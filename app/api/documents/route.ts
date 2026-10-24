import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { localStore } from "@/lib/storage/store";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json({ error: "Missing workspaceId." }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) {
      return NextResponse.json({ documents: localStore.getDocuments(workspaceId) });
    }

    return NextResponse.json({ documents: data });
  } catch {
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId") || "default-ws";
    return NextResponse.json({ documents: localStore.getDocuments(workspaceId) });
  }
}
