import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { localStore } from "@/lib/storage/store";

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("workspaces")
      .select("*")
      .order("created_at", { ascending: true });

    if (error || !data || data.length === 0) {
      // Graceful fallback to local workspace cache if Supabase table is pending creation
      return NextResponse.json({ workspaces: localStore.getWorkspaces() });
    }

    return NextResponse.json({ workspaces: data });
  } catch {
    return NextResponse.json({ workspaces: localStore.getWorkspaces() });
  }
}

import { DEMO_USER_ID } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const supabaseUser = await createClient();
    const {
      data: { user },
    } = await supabaseUser.auth.getUser();

    const userId = user?.id || DEMO_USER_ID;
    const body = await req.json();
    const { name } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Workspace name is required." }, { status: 400 });
    }

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") + "-" + Math.random().toString(36).substring(2, 6);

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("workspaces")
      .insert({
        name,
        slug,
        owner_id: userId,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Insert owner as workspace member
    await supabase.from("workspace_members").insert({
      workspace_id: data.id,
      user_id: userId,
      role: "owner",
    });

    return NextResponse.json({ workspace: data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to create workspace." }, { status: 500 });
  }
}
