# Contributing to KnowFlow AI

Thank you for your interest in contributing to KnowFlow AI. We welcome code contributions, issue reports, documentation improvements, and architectural feedback.

## Ground Rules & Architecture Principles

1. **Zero Mock / Fake Data**: KnowFlow AI maintains zero synthetic demo fallbacks. All documents, pgvector chunks, conversation records, and telemetry metrics must be backed by real Supabase PostgreSQL tables and real AI provider APIs.
2. **Next.js 16 Standards**:
   - No deprecated Next.js middleware conventions (`proxy.ts` is used for security boundaries and rewrite routing).
   - Async route parameters: dynamic route handlers must treat params as a promise (`{ params }: { params: Promise<{ id: string }> }`).
   - Do not use `force-dynamic` when `cacheComponents` or `partialPrefetching` is enabled.
3. **Multi-Tenant Security Boundary**:
   - Every database query must either use the user-scoped authenticated client or enforce `is_workspace_member(workspace_id)`.
   - Never bypass PostgreSQL Row-Level Security in client-facing route handlers.

## Local Development Setup

### 1. Prerequisites

- **Node.js**: v20 or v22 LTS
- **Package Manager**: npm v10+
- **Supabase**: A free-tier Supabase project with `pgvector` enabled
- **AI Providers**: Either local Ollama (`ollama serve`), Google Gemini API key, or Groq API key

### 2. Environment Configuration

Copy `.env.example` to `.env.local` and populate the required secrets:

```bash
cp .env.example .env.local
```

### 3. Database Migration

Apply the migrations in chronological order from `supabase/migrations/`:

- `20250101000000_knowflow_init.sql`
- `20260324000000_phase3_schema_security.sql`

### 4. Running the Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Code Quality Gates

Before submitting a Pull Request, ensure all quality gates pass:

```bash
# 1. Linting & Formatting Check
npm run lint

# 2. TypeScript Static Typecheck
npx tsc --noEmit

# 3. Unit & Component Test Suite
npm test

# 4. Production Build Validation
npm run build
```

## Pull Request Guidelines

- Group related changes into a single descriptive commit or PR.
- Add test coverage for new endpoints, auth rules, or UI components.
- Never commit private `.env.local` files or production API keys.
