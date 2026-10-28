import { NextRequest, NextResponse } from "next/server";
import { requireWorkspaceMember } from "@/lib/auth/require-workspace-member";
import { AuthError } from "@/lib/auth/require-user";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing workspace id." }, { status: 400 });
    }

    // Caller must be an authorized member of the workspace
    await requireWorkspaceMember(id);

    const adminDb = createAdminClient();

    // Query members with profile info
    const { data: members, error: membersError } = await adminDb
      .from("workspace_members")
      .select("id, user_id, role, created_at")
      .eq("workspace_id", id)
      .order("created_at", { ascending: true });

    if (membersError) {
      console.error("[GET /api/workspaces/[id]/members] Error:", membersError);
      return NextResponse.json({ error: membersError.message }, { status: 500 });
    }

    const userIds = (members || []).map((m) => m.user_id);
    const { data: profiles } = await adminDb
      .from("profiles")
      .select("id, email, full_name, avatar_url")
      .in("id", userIds);

    const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

    const enrichedMembers = (members || []).map((m) => {
      const profile = profileMap.get(m.user_id);
      return {
        id: m.id,
        userId: m.user_id,
        role: m.role,
        email: profile?.email || "User",
        fullName: profile?.full_name || profile?.email?.split("@")[0] || "User",
        avatarUrl: profile?.avatar_url || null,
        joinedAt: m.created_at,
      };
    });

    return NextResponse.json({ members: enrichedMembers });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    const message = err instanceof Error ? err.message : "Failed to fetch members.";
    console.error("[GET /api/workspaces/[id]/members] Error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing workspace id." }, { status: 400 });
    }

    // Only owners and admins can invite new members
    await requireWorkspaceMember(id, ["owner", "admin"]);

    const body = await req.json();
    const { email, role = "member" } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
    }

    if (role !== "admin" && role !== "member") {
      return NextResponse.json({ error: "Role must be 'admin' or 'member'." }, { status: 400 });
    }

    const adminDb = createAdminClient();

    // Look up user by email in profiles
    const { data: profile } = await adminDb
      .from("profiles")
      .select("id, email, full_name")
      .ilike("email", email.trim())
      .maybeSingle();

    if (!profile) {
      return NextResponse.json(
        {
          error: `No registered account found with email "${email}". Ask them to create an account first.`,
        },
        { status: 404 }
      );
    }

    // Check if already a member
    const { data: existingMember } = await adminDb
      .from("workspace_members")
      .select("id, role")
      .eq("workspace_id", id)
      .eq("user_id", profile.id)
      .maybeSingle();

    if (existingMember) {
      return NextResponse.json(
        {
          error: `User "${email}" is already a member of this workspace (${existingMember.role}).`,
        },
        { status: 409 }
      );
    }

    const { data: newMember, error: insertError } = await adminDb
      .from("workspace_members")
      .insert({
        workspace_id: id,
        user_id: profile.id,
        role,
      })
      .select()
      .single();

    if (insertError) {
      console.error("[POST /api/workspaces/[id]/members] Insert error:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      member: {
        id: newMember.id,
        userId: profile.id,
        role: newMember.role,
        email: profile.email,
        fullName: profile.full_name,
        joinedAt: newMember.created_at,
      },
    });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    const message = err instanceof Error ? err.message : "Failed to add member.";
    console.error("[POST /api/workspaces/[id]/members] Error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing workspace id." }, { status: 400 });
    }

    // Only owners and admins can modify member roles
    const { user: callerUser, role: callerRole } = await requireWorkspaceMember(id, [
      "owner",
      "admin",
    ]);

    const body = await req.json();
    const { userId, role } = body;

    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ error: "Missing target userId." }, { status: 400 });
    }

    if (role !== "admin" && role !== "member") {
      return NextResponse.json({ error: "Role must be 'admin' or 'member'." }, { status: 400 });
    }

    const adminDb = createAdminClient();

    // Check workspace owner
    const { data: ws } = await adminDb.from("workspaces").select("owner_id").eq("id", id).single();

    if (ws?.owner_id === userId) {
      return NextResponse.json(
        { error: "Cannot change the role of the workspace owner." },
        { status: 400 }
      );
    }

    // Admins cannot modify other admins or owner
    if (callerRole === "admin" && callerUser.id !== ws?.owner_id) {
      const { data: targetMember } = await adminDb
        .from("workspace_members")
        .select("role")
        .eq("workspace_id", id)
        .eq("user_id", userId)
        .maybeSingle();

      if (targetMember?.role === "admin" || targetMember?.role === "owner") {
        return NextResponse.json(
          { error: "Admins cannot modify permissions of other admins or the owner." },
          { status: 403 }
        );
      }
    }

    const { data: updated, error: updateError } = await adminDb
      .from("workspace_members")
      .update({ role })
      .eq("workspace_id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (updateError) {
      console.error("[PATCH /api/workspaces/[id]/members] Update error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, member: updated });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    const message = err instanceof Error ? err.message : "Failed to update member role.";
    console.error("[PATCH /api/workspaces/[id]/members] Error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing workspace id." }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get("userId");

    if (!targetUserId) {
      return NextResponse.json({ error: "Missing userId query parameter." }, { status: 400 });
    }

    const { user: callerUser, role: callerRole } = await requireWorkspaceMember(id);

    const adminDb = createAdminClient();

    // Check workspace owner
    const { data: ws } = await adminDb.from("workspaces").select("owner_id").eq("id", id).single();

    if (ws?.owner_id === targetUserId) {
      return NextResponse.json(
        { error: "The workspace owner cannot leave or be removed." },
        { status: 400 }
      );
    }

    // Permission check: caller is removing themselves (leaving) OR caller is owner/admin
    const isSelfLeaving = callerUser.id === targetUserId;
    const isOwnerOrAdmin = callerRole === "owner" || callerRole === "admin";

    if (!isSelfLeaving && !isOwnerOrAdmin) {
      return NextResponse.json(
        { error: "Forbidden. Insufficient permissions to remove members." },
        { status: 403 }
      );
    }

    const { error: deleteError } = await adminDb
      .from("workspace_members")
      .delete()
      .eq("workspace_id", id)
      .eq("user_id", targetUserId);

    if (deleteError) {
      console.error("[DELETE /api/workspaces/[id]/members] Delete error:", deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, removedUserId: targetUserId });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    const message = err instanceof Error ? err.message : "Failed to remove member.";
    console.error("[DELETE /api/workspaces/[id]/members] Error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
