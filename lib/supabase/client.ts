import { createBrowserClient } from "@supabase/ssr";
import { getClientEnv } from "@/lib/env";

/**
 * Creates a browser-side Supabase client with public anon key.
 * Throws immediately if NEXT_PUBLIC_SUPABASE_URL or anon key is missing.
 */
export function createClient() {
  const env = getClientEnv();
  return createBrowserClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
