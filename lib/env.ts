import { z } from "zod";

/**
 * Server-side environment variables schema.
 * Throws immediately if required variables are missing or malformed.
 */
const serverEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),
  NEXT_PUBLIC_APP_URL: z.string().url().optional().default("http://localhost:3000"),
  AI_PROVIDER: z.enum(["ollama", "gemini", "groq"]).default("gemini"),
  EMBEDDING_PROVIDER: z.enum(["ollama", "gemini"]).default("gemini"),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_CHAT_MODEL: z.string().optional().default("gemini-3.8-flash"),
  GEMINI_EMBED_MODEL: z.string().optional().default("gemini-embedding-001"),
  GROQ_API_KEY: z.string().optional(),
  GROQ_CHAT_MODEL: z.string().optional().default("openai/gpt-oss-120b"),
  OLLAMA_BASE_URL: z.string().optional().default("http://localhost:11434"),
  OLLAMA_CHAT_MODEL: z.string().optional().default("llama3.2"),
  OLLAMA_EMBED_MODEL: z.string().optional().default("nomic-embed-text"),
});

/**
 * Client-side environment variables schema (accessible in browser).
 */
const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
  NEXT_PUBLIC_APP_URL: z.string().url().optional().default("http://localhost:3000"),
});

export function getServerEnv() {
  const result = serverEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    AI_PROVIDER: process.env.AI_PROVIDER,
    EMBEDDING_PROVIDER: process.env.EMBEDDING_PROVIDER,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GEMINI_CHAT_MODEL: process.env.GEMINI_CHAT_MODEL,
    GEMINI_EMBED_MODEL: process.env.GEMINI_EMBED_MODEL,
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    GROQ_CHAT_MODEL: process.env.GROQ_CHAT_MODEL,
    OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL,
    OLLAMA_CHAT_MODEL: process.env.OLLAMA_CHAT_MODEL,
    OLLAMA_EMBED_MODEL: process.env.OLLAMA_EMBED_MODEL,
  });

  if (!result.success) {
    const errorDetails = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`[CRITICAL] Missing or invalid server environment variables:\n${errorDetails}`);
  }

  return result.data;
}

export function getClientEnv() {
  const result = clientEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  });

  if (!result.success) {
    const errorDetails = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`[CRITICAL] Missing or invalid client environment variables:\n${errorDetails}`);
  }

  return result.data;
}
