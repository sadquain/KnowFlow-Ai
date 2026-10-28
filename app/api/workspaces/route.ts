import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const { user, supabase } = await requireUser();

    // Use user-scoped Supabase client with RLS to query user's workspaces
    const { data: memberWorkspaces, error: memberError } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", user.id);

    if (memberError) {
      console.error("[GET /api/workspaces] Error checking memberships:", memberError);
      return NextResponse.json({ error: "Failed to fetch workspaces." }, { status: 500 });
    }

    const memberIds = memberWorkspaces?.map((m) => m.workspace_id) || [];

    let query = supabase.from("workspaces").select("*").order("created_at", { ascending: true });

    if (memberIds.length > 0) {
      query = query.or(`owner_id.eq.${user.id},id.in.(${memberIds.join(",")})`);
    } else {
      query = query.eq("owner_id", user.id);
    }

    const { data: workspaces, error: wsError } = await query;

    if (wsError) {
      console.error("[GET /api/workspaces] Query error:", wsError);
      return NextResponse.json({ error: "Failed to fetch workspaces." }, { status: 500 });
    }

    if (!workspaces || workspaces.length === 0) {
      // Auto-provision initial workspace for user so every authenticated user has a real workspace
      const initialName = "My Workspace";
      const slug = `ws-${user.id.substring(0, 8)}-${Math.random().toString(36).substring(2, 6)}`;
      const { data: initialWs, error: createError } = await supabase
        .from("workspaces")
        .insert({
          name: initialName,
          slug,
          owner_id: user.id,
        })
        .select()
        .single();

      if (!createError && initialWs) {
        const adminDb = createAdminClient();
        await adminDb.from("workspace_members").insert({
          workspace_id: initialWs.id,
          user_id: user.id,
          role: "owner",
        });
        return NextResponse.json({ workspaces: [initialWs] });
      }
    }

    return NextResponse.json({ workspaces: workspaces || [] });
  } catch (err: unknown) {
    if (typeof err === "object" && err !== null && "statusCode" in err) {
      const authErr = err as { message: string; statusCode: number };
      return NextResponse.json({ error: authErr.message }, { status: authErr.statusCode });
    }
    console.error("[GET /api/workspaces] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, supabase } = await requireUser();

    const body = await req.json();
    const { name } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "A valid workspace name is required." }, { status: 400 });
    }

    const trimmedName = name.trim();
    const slug =
      trimmedName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") +
      "-" +
      Math.random().toString(36).substring(2, 6);

    // Atomically create workspace and register owner membership
    // 1. Insert workspace using user-scoped client (RLS check: auth.uid() = owner_id)
    const { data: workspace, error: createError } = await supabase
      .from("workspaces")
      .insert({
        name: trimmedName,
        slug,
        owner_id: user.id,
      })
      .select()
      .single();

    if (createError || !workspace) {
      console.error("[POST /api/workspaces] Failed to insert workspace:", createError);
      return NextResponse.json({ error: "Failed to create workspace." }, { status: 500 });
    }

    // 2. Insert owner as workspace member
    const adminDb = createAdminClient();
    const { error: memberError } = await adminDb.from("workspace_members").insert({
      workspace_id: workspace.id,
      user_id: user.id,
      role: "owner",
    });

    if (memberError) {
      // Rollback workspace creation to guarantee atomic consistency
      console.error(
        "[POST /api/workspaces] Failed to register owner member, rolling back:",
        memberError
      );
      await adminDb.from("workspaces").delete().eq("id", workspace.id);
      return NextResponse.json(
        { error: "Failed to establish workspace ownership. Transaction aborted." },
        { status: 500 }
      );
    }

    return NextResponse.json({ workspace }, { status: 201 });
  } catch (err: unknown) {
    if (typeof err === "object" && err !== null && "statusCode" in err) {
      const authErr = err as { message: string; statusCode: number };
      return NextResponse.json({ error: authErr.message }, { status: authErr.statusCode });
    }
    console.error("[POST /api/workspaces] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
