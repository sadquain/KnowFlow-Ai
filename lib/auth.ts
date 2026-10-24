/**
 * Authentication helpers and fallback user configuration for KnowFlow AI.
 */

export const DEMO_USER_ID = "e19db7d6-b156-4e3f-82a8-5ce5d00ee31a";
export const DEMO_USER_EMAIL = "demo@knowflow.ai";

export interface UserSession {
  id: string;
  email: string;
  name?: string;
  isDemo: boolean;
}
