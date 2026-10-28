import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkRateLimit } from "@/lib/rate-limit";

// Mock Supabase admin client
const mockMaybeSingle = vi.fn();
const mockSelect = vi.fn(() => ({
  eq: vi.fn().mockReturnThis(),
  maybeSingle: mockMaybeSingle,
}));
const mockUpdate = vi.fn(() => ({
  eq: vi.fn().mockResolvedValue({ error: null }),
}));
const mockInsert = vi.fn().mockResolvedValue({ error: null });

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      if (table === "rate_limits") {
        return {
          select: mockSelect,
          update: mockUpdate,
          insert: mockInsert,
        };
      }
      return {};
    },
  }),
}));

describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should allow first request in window and insert new rate limit record", async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });

    const result = await checkRateLimit("ws-1", "user-1", "chat", 10, 60);

    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(10);
    expect(result.remaining).toBe(9);
    expect(mockInsert).toHaveBeenCalledTimes(1);
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        workspace_id: "ws-1",
        user_id: "user-1",
        endpoint: "chat",
        request_count: 1,
      })
    );
  });

  it("should increment request count when below limit", async () => {
    mockMaybeSingle.mockResolvedValueOnce({
      data: { id: "rate-1", request_count: 5 },
      error: null,
    });

    const result = await checkRateLimit("ws-1", "user-1", "chat", 10, 60);

    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(10);
    expect(result.remaining).toBe(4);
    expect(mockUpdate).toHaveBeenCalledWith({ request_count: 6 });
  });

  it("should block request and return allowed=false when limit is exceeded", async () => {
    mockMaybeSingle.mockResolvedValueOnce({
      data: { id: "rate-1", request_count: 10 },
      error: null,
    });

    const result = await checkRateLimit("ws-1", "user-1", "chat", 10, 60);

    expect(result.allowed).toBe(false);
    expect(result.limit).toBe(10);
    expect(result.remaining).toBe(0);
    expect(result.resetSeconds).toBeGreaterThan(0);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("should fail open gracefully if database select fails", async () => {
    mockMaybeSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "Database timeout" },
    });

    const result = await checkRateLimit("ws-1", "user-1", "chat", 10, 60);

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(9);
  });
});
