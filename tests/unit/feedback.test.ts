/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST, GET } from "@/app/api/feedback/route";
import * as requireMemberModule from "@/lib/auth/require-workspace-member";

describe("POST and GET /api/feedback", () => {
  const mockUser = { id: "user-123", email: "tester@example.com" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should reject POST when workspaceId is missing", async () => {
    const req = new NextRequest("http://localhost:3000/api/feedback", {
      method: "POST",
      body: JSON.stringify({ messageId: "msg-1", isPositive: true }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("workspaceId");
  });

  it("should reject POST when messageId is missing", async () => {
    const req = new NextRequest("http://localhost:3000/api/feedback", {
      method: "POST",
      body: JSON.stringify({ workspaceId: "ws-1", isPositive: true }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("messageId");
  });

  it("should reject POST when isPositive is not a boolean", async () => {
    const req = new NextRequest("http://localhost:3000/api/feedback", {
      method: "POST",
      body: JSON.stringify({ workspaceId: "ws-1", messageId: "msg-1", isPositive: "yes" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("isPositive");
  });

  it("should return 404 when target message is not found in the workspace", async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    };

    vi.spyOn(requireMemberModule, "requireWorkspaceMember").mockResolvedValue({
      user: mockUser as any,
      role: "member",
      workspaceId: "ws-1",
      supabase: mockSupabase as any,
    });

    const req = new NextRequest("http://localhost:3000/api/feedback", {
      method: "POST",
      body: JSON.stringify({ workspaceId: "ws-1", messageId: "msg-nonexistent", isPositive: true }),
    });

    const res = await POST(req);
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toContain("Target message not found");
  });

  it("should successfully record feedback when valid", async () => {
    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === "messages") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: "msg-1", workspace_id: "ws-1" },
              error: null,
            }),
          };
        }
        if (table === "feedback") {
          return {
            upsert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                id: "fb-1",
                workspace_id: "ws-1",
                message_id: "msg-1",
                user_id: mockUser.id,
                is_positive: true,
              },
              error: null,
            }),
          };
        }
        return {};
      }),
    };

    vi.spyOn(requireMemberModule, "requireWorkspaceMember").mockResolvedValue({
      user: mockUser as any,
      role: "member",
      workspaceId: "ws-1",
      supabase: mockSupabase as any,
    });

    const req = new NextRequest("http://localhost:3000/api/feedback", {
      method: "POST",
      body: JSON.stringify({ workspaceId: "ws-1", messageId: "msg-1", isPositive: true }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.feedback.is_positive).toBe(true);
  });

  it("should reject GET when missing query parameters", async () => {
    const req = new NextRequest("http://localhost:3000/api/feedback?workspaceId=ws-1");
    const res = await GET(req);
    expect(res.status).toBe(400);
  });
});
