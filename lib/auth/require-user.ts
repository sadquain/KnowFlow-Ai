import { createClient } from "@/lib/supabase/server";
import type { User, SupabaseClient } from "@supabase/supabase-js";

export class AuthError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode = 401) {
    super(message);
    this.name = "AuthError";
    this.statusCode = statusCode;
  }
}

export interface AuthenticatedUserContext {
  user: User;
  supabase: SupabaseClient;
}

/**
 * Validates that a user is actively authenticated via Supabase session cookies.
 * Returns the authenticated User object and the user-scoped Supabase client (respecting RLS).
 * Throws AuthError(401) if no session or user is found.
 */
export async function requireUser(): Promise<AuthenticatedUserContext> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new AuthError("Authentication required. Please sign in.", 401);
  }

  return { user, supabase };
}
