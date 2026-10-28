import { createAdminClient } from "@/lib/supabase/admin";

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
}

/**
 * Enforces per-user, per-workspace rate limits backed by PostgreSQL `public.rate_limits`.
 *
 * @param workspaceId ID of the workspace
 * @param userId ID of the authenticated user
 * @param endpoint Identifier for the rate-limited endpoint (e.g. "chat")
 * @param maxRequests Maximum allowed requests per window (default 30)
 * @param windowSeconds Duration of the rate limit window in seconds (default 60s)
 */
export async function checkRateLimit(
  workspaceId: string,
  userId: string,
  endpoint: string = "chat",
  maxRequests: number = 30,
  windowSeconds: number = 60
): Promise<RateLimitResult> {
  const supabase = createAdminClient();
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const windowStartTime = Math.floor(now / windowMs) * windowMs;
  const windowStartIso = new Date(windowStartTime).toISOString();
  const resetSeconds = Math.max(1, Math.ceil((windowStartTime + windowMs - now) / 1000));

  try {
    const { data: existing, error: selectError } = await supabase
      .from("rate_limits")
      .select("id, request_count")
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId)
      .eq("endpoint", endpoint)
      .eq("window_start", windowStartIso)
      .maybeSingle();

    if (selectError) {
      console.warn("[rate-limit] Failed to query rate limits table:", selectError.message);
      // Fail open if database lookup errors so transient DB glitches don't block legitimate users
      return { allowed: true, limit: maxRequests, remaining: maxRequests - 1, resetSeconds };
    }

    if (existing) {
      const newCount = existing.request_count + 1;
      if (newCount > maxRequests) {
        return {
          allowed: false,
          limit: maxRequests,
          remaining: 0,
          resetSeconds,
        };
      }

      await supabase
        .from("rate_limits")
        .update({ request_count: newCount })
        .eq("id", existing.id);

      return {
        allowed: true,
        limit: maxRequests,
        remaining: Math.max(0, maxRequests - newCount),
        resetSeconds,
      };
    }

    // First request in this window
    await supabase.from("rate_limits").insert({
      workspace_id: workspaceId,
      user_id: userId,
      endpoint,
      request_count: 1,
      window_start: windowStartIso,
    });

    return {
      allowed: true,
      limit: maxRequests,
      remaining: maxRequests - 1,
      resetSeconds,
    };
  } catch (err) {
    console.warn("[rate-limit] Unexpected error checking rate limit:", err);
    // Fail open on unexpected error
    return { allowed: true, limit: maxRequests, remaining: maxRequests - 1, resetSeconds };
  }
}
