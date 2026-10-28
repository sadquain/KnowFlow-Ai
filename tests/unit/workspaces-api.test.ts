/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { PATCH, DELETE } from "@/app/api/workspaces/[id]/route";
import * as requireMemberModule from "@/lib/auth/require-workspace-member";

describe("Workspace Management API ([id]/route.ts)", () => {
  const mockUser = { id: "user-owner-1", email: "owner@example.com" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should reject PATCH when workspace name is empty", async () => {
    const mockSupabase = {
      from: vi.fn(),
    };

    vi.spyOn(requireMemberModule, "requireWorkspaceMember").mockResolvedValue({
      user: mockUser as any,
      role: "owner",
      workspaceId: "ws-1",
      supabase: mockSupabase as any,
    });

    const req = new NextRequest("http://localhost:3000/api/workspaces/ws-1", {
      method: "PATCH",
      body: JSON.stringify({ name: "" }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: "ws-1" }) });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("valid workspace name");
  });

  it("should successfully rename workspace when called by owner or admin", async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: "ws-1", name: "Renamed Workspace" },
          error: null,
        }),
      }),
    };

    vi.spyOn(requireMemberModule, "requireWorkspaceMember").mockResolvedValue({
      user: mockUser as any,
      role: "owner",
      workspaceId: "ws-1",
      supabase: mockSupabase as any,
    });

    const req = new NextRequest("http://localhost:3000/api/workspaces/ws-1", {
      method: "PATCH",
      body: JSON.stringify({ name: "Renamed Workspace" }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: "ws-1" }) });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.workspace.name).toBe("Renamed Workspace");
  });

  it("should delete workspace when called by owner", async () => {
    const filterBuilder: any = {};
    filterBuilder.eq = vi.fn().mockReturnValue(filterBuilder);
    filterBuilder.then = (resolve: (val: any) => void) => resolve({ error: null });

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        delete: vi.fn().mockReturnValue(filterBuilder),
      }),
    };

    vi.spyOn(requireMemberModule, "requireWorkspaceMember").mockResolvedValue({
      user: mockUser as any,
      role: "owner",
      workspaceId: "ws-1",
      supabase: mockSupabase as any,
    });

    const req = new NextRequest("http://localhost:3000/api/workspaces/ws-1", {
      method: "DELETE",
    });

    const res = await DELETE(req, { params: Promise.resolve({ id: "ws-1" }) });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });
});
