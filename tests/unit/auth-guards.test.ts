import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { AuthError } from "@/lib/auth/require-user";
import {
  requireWorkspaceMember,
  requireDocumentAccess,
  requireConversationAccess,
} from "@/lib/auth/require-workspace-member";

// Mock Supabase modules
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

describe("Auth Guards & Permissions Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("AuthError", () => {
    it("should instantiate with default 401 status code", () => {
      const err = new AuthError("Unauthorized");
      expect(err.message).toBe("Unauthorized");
      expect(err.statusCode).toBe(401);
      expect(err.name).toBe("AuthError");
    });

    it("should support custom status codes like 403 and 404", () => {
      const forbidden = new AuthError("Forbidden", 403);
      expect(forbidden.statusCode).toBe(403);

      const notFound = new AuthError("Not found", 404);
      expect(notFound.statusCode).toBe(404);
    });
  });

  describe("requireWorkspaceMember", () => {
    it("should reject with 400 when workspaceId is missing", async () => {
      await expect(requireWorkspaceMember("")).rejects.toThrow(
        "Missing required workspaceId parameter."
      );
    });

    it("should reject with 401 when no active session exists", async () => {
      const mockSupabase = {
        auth: {
          getUser: vi
            .fn()
            .mockResolvedValue({ data: { user: null }, error: new Error("No session") }),
        },
      };
      vi.mocked(createClient).mockResolvedValue(mockSupabase as unknown as SupabaseClient);

      await expect(requireWorkspaceMember("ws-123")).rejects.toMatchObject({
        statusCode: 401,
      });
    });

    it("should recognize workspace owner without querying workspace_members", async () => {
      const mockUser = { id: "user-owner" };
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
        },
      };
      vi.mocked(createClient).mockResolvedValue(mockSupabase as unknown as SupabaseClient);

      const mockAdminDb = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "workspaces") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: { id: "ws-123", owner_id: "user-owner" },
                    error: null,
                  }),
                }),
              }),
            };
          }
          throw new Error(`Unexpected table ${table}`);
        }),
      };
      vi.mocked(createAdminClient).mockReturnValue(mockAdminDb as unknown as SupabaseClient);

      const result = await requireWorkspaceMember("ws-123");
      expect(result.role).toBe("owner");
      expect(result.user.id).toBe("user-owner");
      expect(result.workspaceId).toBe("ws-123");
    });

    it("should recognize invited member via workspace_members table", async () => {
      const mockUser = { id: "user-member" };
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
        },
      };
      vi.mocked(createClient).mockResolvedValue(mockSupabase as unknown as SupabaseClient);

      const mockAdminDb = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "workspaces") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: { id: "ws-123", owner_id: "other-owner" },
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === "workspace_members") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: { role: "member" },
                      error: null,
                    }),
                  }),
                }),
              }),
            };
          }
          throw new Error(`Unexpected table ${table}`);
        }),
      };
      vi.mocked(createAdminClient).mockReturnValue(mockAdminDb as unknown as SupabaseClient);

      const result = await requireWorkspaceMember("ws-123");
      expect(result.role).toBe("member");
      expect(result.user.id).toBe("user-member");
    });

    it("should reject with 403 if user is not in workspace_members", async () => {
      const mockUser = { id: "user-stranger" };
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
        },
      };
      vi.mocked(createClient).mockResolvedValue(mockSupabase as unknown as SupabaseClient);

      const mockAdminDb = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "workspaces") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: { id: "ws-123", owner_id: "other-owner" },
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === "workspace_members") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: null,
                      error: null,
                    }),
                  }),
                }),
              }),
            };
          }
          throw new Error(`Unexpected table ${table}`);
        }),
      };
      vi.mocked(createAdminClient).mockReturnValue(mockAdminDb as unknown as SupabaseClient);

      await expect(requireWorkspaceMember("ws-123")).rejects.toMatchObject({
        statusCode: 403,
      });
    });

    it("should reject with 403 if user role does not satisfy allowedRoles", async () => {
      const mockUser = { id: "user-member" };
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
        },
      };
      vi.mocked(createClient).mockResolvedValue(mockSupabase as unknown as SupabaseClient);

      const mockAdminDb = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "workspaces") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: { id: "ws-123", owner_id: "other-owner" },
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === "workspace_members") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: { role: "member" },
                      error: null,
                    }),
                  }),
                }),
              }),
            };
          }
          throw new Error(`Unexpected table ${table}`);
        }),
      };
      vi.mocked(createAdminClient).mockReturnValue(mockAdminDb as unknown as SupabaseClient);

      await expect(requireWorkspaceMember("ws-123", ["admin", "owner"])).rejects.toMatchObject({
        statusCode: 403,
      });
    });
  });

  describe("requireDocumentAccess", () => {
    it("should reject with 400 when documentId is missing", async () => {
      await expect(requireDocumentAccess("")).rejects.toThrow(
        "Missing required documentId parameter."
      );
    });

    it("should reject with 404 when document does not exist", async () => {
      const mockAdminDb = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
        }),
      };
      vi.mocked(createAdminClient).mockReturnValue(mockAdminDb as unknown as SupabaseClient);

      await expect(requireDocumentAccess("doc-missing")).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe("requireConversationAccess", () => {
    it("should reject with 400 when conversationId is missing", async () => {
      await expect(requireConversationAccess("")).rejects.toThrow(
        "Missing required conversationId parameter."
      );
    });

    it("should reject with 404 when conversation does not exist", async () => {
      const mockAdminDb = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
        }),
      };
      vi.mocked(createAdminClient).mockReturnValue(mockAdminDb as unknown as SupabaseClient);

      await expect(requireConversationAccess("conv-missing")).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });
});
