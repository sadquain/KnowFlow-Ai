import { NextRequest, NextResponse } from "next/server";
import { requireWorkspaceMember } from "@/lib/auth/require-workspace-member";
import { AuthError } from "@/lib/auth/require-user";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing workspace id." }, { status: 400 });
    }

    const { user, role, supabase } = await requireWorkspaceMember(id);

    const { data: workspace, error: wsError } = await supabase
      .from("workspaces")
      .select("*")
      .eq("id", id)
      .single();

    if (wsError || !workspace) {
      return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
    }

    const adminDb = createAdminClient();
    const { count: memberCount } = await adminDb
      .from("workspace_members")
      .select("*", { count: "exact", head: true })
      .eq("workspace_id", id);

    const { count: docCount } = await adminDb
      .from("documents")
      .select("*", { count: "exact", head: true })
      .eq("workspace_id", id);

    return NextResponse.json({
      workspace: {
        ...workspace,
        currentUserRole: role,
        isOwner: workspace.owner_id === user.id,
        memberCount: memberCount || 1,
        documentCount: docCount || 0,
      },
    });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    const message = err instanceof Error ? err.message : "Failed to fetch workspace.";
    console.error("[GET /api/workspaces/[id]] Error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing workspace id." }, { status: 400 });
    }

    // Only owners and admins can update workspace details
    const { supabase } = await requireWorkspaceMember(id, ["owner", "admin"]);

    const body = await req.json();
    const { name } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "A valid workspace name is required." }, { status: 400 });
    }

    const trimmedName = name.trim();

    const { data: updated, error: updateError } = await supabase
      .from("workspaces")
      .update({
        name: trimmedName,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("[PATCH /api/workspaces/[id]] Update error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ workspace: updated });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    const message = err instanceof Error ? err.message : "Failed to update workspace.";
    console.error("[PATCH /api/workspaces/[id]] Error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing workspace id." }, { status: 400 });
    }

    // Strictly owners can delete a workspace
    const { user, supabase } = await requireWorkspaceMember(id, ["owner"]);

    const { error: deleteError } = await supabase
      .from("workspaces")
      .delete()
      .eq("id", id)
      .eq("owner_id", user.id);

    if (deleteError) {
      console.error("[DELETE /api/workspaces/[id]] Deletion error:", deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    const message = err instanceof Error ? err.message : "Failed to delete workspace.";
    console.error("[DELETE /api/workspaces/[id]] Error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
