/**
 * Authentication type definitions and session contracts for KnowFlow AI.
 */

export interface UserSession {
  id: string;
  email: string;
  name?: string;
}
