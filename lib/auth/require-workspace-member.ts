import { requireUser, AuthError } from "@/lib/auth/require-user";
import { createAdminClient } from "@/lib/supabase/admin";
import type { User, SupabaseClient } from "@supabase/supabase-js";

export type WorkspaceRole = "owner" | "admin" | "member";

export interface WorkspaceMembershipContext {
  user: User;
  workspaceId: string;
  role: WorkspaceRole;
  supabase: SupabaseClient;
}

export interface DocumentAccessContext {
  user: User;
  document: {
    id: string;
    workspace_id: string;
    user_id: string;
    title: string;
    file_path: string;
    file_type: string;
    status: string;
  };
  workspaceId: string;
  supabase: SupabaseClient;
}

export interface ConversationAccessContext {
  user: User;
  conversation: {
    id: string;
    workspace_id: string;
    user_id: string;
    title: string;
  };
  workspaceId: string;
  supabase: SupabaseClient;
}

/**
 * Validates that the authenticated user is an active member or owner of the workspace.
 * Throws AuthError(401) if not signed in, or AuthError(403) if unauthorized.
 */
export async function requireWorkspaceMember(
  workspaceId: string,
  allowedRoles?: WorkspaceRole[]
): Promise<WorkspaceMembershipContext> {
  if (!workspaceId) {
    throw new AuthError("Missing required workspaceId parameter.", 400);
  }

  const { user, supabase } = await requireUser();
  const adminDb = createAdminClient();

  // 1. Check if user is the direct workspace owner
  const { data: workspace, error: wsError } = await adminDb
    .from("workspaces")
    .select("id, owner_id")
    .eq("id", workspaceId)
    .maybeSingle();

  if (wsError || !workspace) {
    throw new AuthError("Workspace not found or inaccessible.", 404);
  }

  if (workspace.owner_id === user.id) {
    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes("owner")) {
      throw new AuthError("Forbidden. Insufficient workspace permissions.", 403);
    }
    return {
      user,
      workspaceId,
      role: "owner",
      supabase,
    };
  }

  // 2. Check workspace_members table for membership & role
  const { data: membership, error: memberError } = await adminDb
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (memberError || !membership) {
    throw new AuthError("Forbidden. You do not have access to this workspace.", 403);
  }

  const role = membership.role as WorkspaceRole;
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    throw new AuthError("Forbidden. Insufficient workspace permissions.", 403);
  }

  return {
    user,
    workspaceId,
    role,
    supabase,
  };
}

/**
 * Validates that the document exists and that the user is authorized to access its parent workspace.
 */
export async function requireDocumentAccess(
  documentId: string,
  workspaceId?: string
): Promise<DocumentAccessContext> {
  if (!documentId) {
    throw new AuthError("Missing required documentId parameter.", 400);
  }

  const adminDb = createAdminClient();

  let query = adminDb
    .from("documents")
    .select("id, workspace_id, user_id, title, file_path, file_type, status")
    .eq("id", documentId);

  if (workspaceId) {
    query = query.eq("workspace_id", workspaceId);
  }

  const { data: doc, error: docError } = await query.maybeSingle();

  if (docError || !doc) {
    throw new AuthError("Document not found or inaccessible.", 404);
  }

  const { user, supabase } = await requireWorkspaceMember(doc.workspace_id);

  return {
    user,
    document: doc,
    workspaceId: doc.workspace_id,
    supabase,
  };
}

/**
 * Validates that the conversation exists and that the user belongs to its parent workspace.
 */
export async function requireConversationAccess(
  conversationId: string,
  workspaceId?: string
): Promise<ConversationAccessContext> {
  if (!conversationId) {
    throw new AuthError("Missing required conversationId parameter.", 400);
  }

  const adminDb = createAdminClient();

  let query = adminDb
    .from("conversations")
    .select("id, workspace_id, user_id, title")
    .eq("id", conversationId);

  if (workspaceId) {
    query = query.eq("workspace_id", workspaceId);
  }

  const { data: conv, error: convError } = await query.maybeSingle();

  if (convError || !conv) {
    throw new AuthError("Conversation not found or inaccessible.", 404);
  }

  const { user, supabase } = await requireWorkspaceMember(conv.workspace_id);

  return {
    user,
    conversation: conv,
    workspaceId: conv.workspace_id,
    supabase,
  };
}
