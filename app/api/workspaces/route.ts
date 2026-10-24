import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabaseUser = await createClient();
    const {
      data: { user },
    } = await supabaseUser.auth.getUser();

    const supabase = createAdminClient();

    // Query user workspaces if signed in, or all visible workspaces
    let query = supabase.from("workspaces").select("*").order("created_at", { ascending: true });
    if (user) {
      // Filter by user workspace memberships or ownership
      const { data: memberWorkspaces } = await supabase
        .from("workspace_members")
        .select("workspace_id")
        .eq("user_id", user.id);

      const memberIds = memberWorkspaces?.map((m) => m.workspace_id) || [];
      if (memberIds.length > 0) {
        query = query.or(`owner_id.eq.${user.id},id.in.(${memberIds.join(",")})`);
      } else {
        query = query.eq("owner_id", user.id);
      }
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Always return empty array state if no records exist, never fake/seeded data
    return NextResponse.json({ workspaces: data || [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch workspaces.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabaseUser = await createClient();
    const {
      data: { user },
    } = await supabaseUser.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to create a workspace." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { name } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Workspace name is required." }, { status: 400 });
    }

    const slug =
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") +
      "-" +
      Math.random().toString(36).substring(2, 6);

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("workspaces")
      .insert({
        name,
        slug,
        owner_id: user.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Insert owner as workspace member
    await supabase.from("workspace_members").insert({
      workspace_id: data.id,
      user_id: user.id,
      role: "owner",
    });

    return NextResponse.json({ workspace: data }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create workspace.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
