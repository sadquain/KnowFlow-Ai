"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  UserPlus,
  Shield,
  Trash2,
  Edit2,
  Check,
  X,
  AlertTriangle,
  LogOut,
  Mail,
} from "lucide-react";
import { useWorkspace } from "@/components/providers/workspace-provider";
import { createClient } from "@/lib/supabase/client";

interface Member {
  id: string;
  userId: string;
  role: "owner" | "admin" | "member";
  email: string;
  fullName: string;
  avatarUrl: string | null;
  joinedAt: string;
}

export function WorkspaceSettingsSection() {
  const router = useRouter();
  const { currentWorkspace, workspaceId, refreshWorkspaces } = useWorkspace();

  const [members, setMembers] = useState<Member[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  // Rename state
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  // Invite state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  // Delete state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Action feedback
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data?.user?.id || null);
    });
  }, []);

  const fetchMembers = useCallback(async () => {
    if (!workspaceId) return;
    setIsLoadingMembers(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members || []);
      }
    } catch {
      // Ignored
    } finally {
      setIsLoadingMembers(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!workspaceId) return;
      setIsLoadingMembers(true);
      try {
        const res = await fetch(`/api/workspaces/${workspaceId}/members`);
        if (res.ok && !ignore) {
          const data = await res.json();
          setMembers(data.members || []);
        }
      } catch {
        // Ignored
      } finally {
        if (!ignore) setIsLoadingMembers(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [workspaceId]);

  // Determine current user role from members synchronously with useMemo
  const currentUserRole = useMemo(() => {
    if (currentUserId && members.length > 0) {
      const current = members.find((m) => m.userId === currentUserId);
      if (current) return current.role;
    }
    if (currentWorkspace?.owner_id === currentUserId) return "owner";
    return "member";
  }, [currentUserId, members, currentWorkspace?.owner_id]);

  const isOwner = currentUserRole === "owner" || currentWorkspace?.owner_id === currentUserId;
  const isAdminOrOwner = isOwner || currentUserRole === "admin";

  const handleSaveName = async () => {
    if (!workspaceId || !editName.trim()) return;
    setIsSavingName(true);
    setNameError(null);

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to rename workspace.");
      }
      await refreshWorkspaces();
      setIsEditingName(false);
    } catch (err) {
      setNameError(err instanceof Error ? err.message : "Rename failed.");
    } finally {
      setIsSavingName(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId || !inviteEmail.trim()) return;

    setIsInviting(true);
    setInviteError(null);
    setInviteSuccess(null);

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to invite member.");
      }

      setInviteSuccess(`Added ${inviteEmail} as ${inviteRole}!`);
      setInviteEmail("");
      await fetchMembers();
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "Failed to invite member.");
    } finally {
      setIsInviting(false);
    }
  };

  const handleRoleChange = async (targetUserId: string, newRole: "admin" | "member") => {
    if (!workspaceId) return;
    setActionError(null);

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: targetUserId, role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update member role.");
      }
      await fetchMembers();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to update role.");
    }
  };

  const handleRemoveMember = async (targetUserId: string) => {
    if (!workspaceId) return;
    const isSelf = targetUserId === currentUserId;
    const confirmMsg = isSelf
      ? "Are you sure you want to leave this workspace?"
      : "Are you sure you want to remove this member?";
    if (!confirm(confirmMsg)) return;

    setActionError(null);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members?userId=${targetUserId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to remove member.");
      }

      if (isSelf) {
        await refreshWorkspaces();
        router.push("/dashboard");
      } else {
        await fetchMembers();
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to remove member.");
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!workspaceId) return;
    if (deleteConfirmText !== currentWorkspace?.name) {
      setDeleteError("Confirmation text does not match workspace name.");
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete workspace.");
      }

      await refreshWorkspaces();
      router.push("/dashboard");
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete workspace.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!currentWorkspace) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-xs text-slate-500">
        No active workspace selected.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* General Workspace Information */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Workspace Profile
            </span>
            <div className="mt-1 flex items-center gap-3">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-bold text-slate-900 focus:border-blue-500 focus:outline-none"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleSaveName}
                    disabled={isSavingName}
                    className="rounded-lg bg-blue-600 p-1.5 text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingName(false);
                      setEditName(currentWorkspace.name);
                    }}
                    className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900">{currentWorkspace.name}</h2>
                  {isAdminOrOwner && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditName(currentWorkspace.name);
                        setIsEditingName(true);
                      }}
                      title="Rename workspace"
                      className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
            {nameError && <p className="mt-1 text-xs text-red-600">{nameError}</p>}
          </div>

          <div className="text-right">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              <Shield className="h-3 w-3" />
              <span className="capitalize">{currentUserRole}</span>
            </span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
          <div>
            <span className="text-slate-400">Workspace Identifier (UUID):</span>
            <p className="mt-0.5 font-mono text-slate-700 select-all">{currentWorkspace.id}</p>
          </div>
          <div>
            <span className="text-slate-400">Slug:</span>
            <p className="mt-0.5 font-mono text-slate-700">{currentWorkspace.slug || "N/A"}</p>
          </div>
        </div>
      </div>

      {/* Team Members Management */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Workspace Members</h3>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
              {members.length}
            </span>
          </div>
        </div>

        {/* Invite Member Form (Owner & Admin only) */}
        {isAdminOrOwner && (
          <form
            onSubmit={handleInvite}
            className="mt-4 flex flex-col sm:flex-row gap-2 border-b border-slate-100 pb-4"
          >
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as "admin" | "member")}
              className="rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700 bg-white focus:border-blue-500 focus:outline-none"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
            <button
              type="submit"
              disabled={isInviting || !inviteEmail.trim()}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50 transition"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>{isInviting ? "Inviting..." : "Add Member"}</span>
            </button>
          </form>
        )}

        {inviteError && (
          <p className="mt-2 text-xs text-red-600 bg-red-50 p-2.5 rounded-xl">{inviteError}</p>
        )}
        {inviteSuccess && (
          <p className="mt-2 text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-xl">
            {inviteSuccess}
          </p>
        )}
        {actionError && (
          <p className="mt-2 text-xs text-red-600 bg-red-50 p-2.5 rounded-xl">{actionError}</p>
        )}

        {/* Member List Table */}
        <div className="mt-4 divide-y divide-slate-100">
          {isLoadingMembers ? (
            <div className="py-6 text-center text-xs text-slate-400">Loading members...</div>
          ) : members.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">
              No members registered in this workspace yet.
            </div>
          ) : (
            members.map((member) => {
              const isMemberOwner = member.role === "owner";
              const isSelf = member.userId === currentUserId;

              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between py-3 text-xs gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-800 truncate">
                      {member.fullName} {isSelf && <span className="text-slate-400">(You)</span>}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">{member.email}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Role Badge or Selector */}
                    {isOwner && !isMemberOwner && !isSelf ? (
                      <select
                        value={member.role}
                        onChange={(e) =>
                          handleRoleChange(member.userId, e.target.value as "admin" | "member")
                        }
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700"
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                    ) : (
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                          isMemberOwner
                            ? "bg-purple-100 text-purple-700"
                            : member.role === "admin"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {member.role}
                      </span>
                    )}

                    {/* Actions: Remove or Leave */}
                    {!isMemberOwner && (
                      <>
                        {isSelf ? (
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(member.userId)}
                            title="Leave workspace"
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] text-slate-600 hover:bg-red-50 hover:text-red-600 transition"
                          >
                            <LogOut className="h-3 w-3" />
                            <span>Leave</span>
                          </button>
                        ) : (
                          isAdminOrOwner && (
                            <button
                              type="button"
                              onClick={() => handleRemoveMember(member.userId)}
                              title="Remove member"
                              className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Danger Zone: Workspace Deletion (Owner only) */}
      {isOwner && (
        <div className="rounded-2xl border border-red-200 bg-red-50/40 p-6 shadow-xs">
          <div className="flex items-center gap-2 text-sm font-bold text-red-900">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span>Danger Zone</span>
          </div>
          <p className="mt-1 text-xs text-red-700 leading-relaxed">
            Permanently delete this workspace, including all uploaded documents, pgvector
            embeddings, and conversation logs. This action cannot be undone.
          </p>

          <div className="mt-4">
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-red-700 transition"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete Workspace</span>
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-red-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-red-600 pb-3 border-b border-slate-100">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-100">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Confirm Workspace Deletion</h3>
                <p className="text-[11px] text-slate-500">Irreversible destructive operation</p>
              </div>
            </div>

            <p className="mt-4 text-xs text-slate-600 leading-relaxed">
              To confirm deletion of workspace{" "}
              <strong className="text-slate-900 font-semibold">{currentWorkspace.name}</strong>,
              please type the workspace name below:
            </p>

            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder={currentWorkspace.name}
              className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-red-500 focus:outline-none"
            />

            {deleteError && (
              <p className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded-lg">{deleteError}</p>
            )}

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeleteConfirmText("");
                  setDeleteError(null);
                }}
                className="rounded-xl px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteWorkspace}
                disabled={isDeleting || deleteConfirmText !== currentWorkspace.name}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-red-700 disabled:opacity-50 transition"
              >
                {isDeleting ? "Deleting..." : "Permanently Delete Workspace"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
