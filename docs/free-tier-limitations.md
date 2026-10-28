# Free-Tier Limitations & Service Topology

KnowFlow AI is built on a **free-first and open-source architecture**. No paid subscription or paid API is required to develop, run, and test the core application.

---

## Service Matrix

| Service                              | Category                        | Purpose                                                 | Model / Engine Availability                                             | Free Tier / Limits                                                                                  | Account / Setup Required                                               | Fallback / Alternative                                                  |
| :----------------------------------- | :------------------------------ | :------------------------------------------------------ | :---------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------- | :---------------------------------------------------------------------- |
| **Ollama**                           | Local / Open Source             | Local LLM inference & embeddings                        | `llama3.2`, `mistral`, `nomic-embed-text`, `bge-m3`, `all-minilm`       | 100% Free & Unlimited on your hardware (CPU/GPU)                                                    | Download Ollama from [ollama.com](https://ollama.com). No credit card. | Default local fallback for zero-cost operation.                         |
| **Google Gemini API**                | Hosted Developer Free Tier      | Fast Cloud LLM generation & Cloud embeddings            | `gemini-1.5-flash`, `gemini-1.5-pro`, `text-embedding-004`              | 15 Requests Per Minute (RPM), 1,500 Requests Per Day (RPD), 1M Tokens Per Minute (TPM) on free tier | Google AI Studio account & free API key (`GEMINI_API_KEY`).            | Fallback to Ollama or Groq.                                             |
| **Groq Cloud**                       | Hosted Developer Free Tier      | Ultra-low latency cloud inference                       | `llama-3.3-70b-versatile`, `llama-3.1-8b-instant`, `mixtral-8x7b-32768` | 30 RPM, 14,400 RPD, ~6,000–30,000 TPM depending on model                                            | Free Groq Cloud account & API key (`GROQ_API_KEY`).                    | Fallback to Ollama or Gemini.                                           |
| **Supabase (PostgreSQL + pgvector)** | Hosted Free Tier / Local Docker | Persistent relational data, vector index, Auth, Storage | PostgreSQL 15+ with `pgvector` extension (HNSW / IVFFlat)               | Free plan: 2 active projects, 500 MB database, 1 GB file storage, 50,000 MAU Auth                   | Free Supabase account or self-hosted Supabase via Docker CLI.          | Self-hosted local Docker Supabase or standard PostgreSQL with pgvector. |
| **Vercel**                           | Hosted Free Tier                | Edge/Serverless Next.js deployment                      | Node.js Serverless runtime                                              | 100 GB bandwidth, 10s serverless function timeout on Hobby plan                                     | Free Vercel account via GitHub.                                        | Self-hosted Docker container or Node.js server.                         |
| **GitHub Actions**                   | Hosted CI/CD                    | Automated CI workflow, linting, tests                   | Ubuntu latest runners                                                   | 2,000 free minutes/month for public repositories                                                    | GitHub account.                                                        | Local test runs via `npm test`.                                         |

---

## Detailed Service Analysis

### 1. Ollama (Primary Local Engine)

- **Status**: Free, Local, Private.
- **Constraints**:
  - Execution speed depends on host RAM and GPU availability.
  - Recommended models for lower-spec machines: `llama3.2:1b` or `llama3.2:3b` for chat, and `nomic-embed-text` (768 dimensions) for embeddings.
  - Cannot run directly inside serverless Vercel edge functions; requires an externally accessible URL (e.g. ngrok or a VPS) if deploying to Vercel, or local Next.js server for local development.

### 2. Google Gemini Free Tier

- **Status**: Free developer tier via Google AI Studio.
- **Constraints**:
  - Rate limits: 15 RPM / 1,500 RPD.
  - Free tier data may be logged by Google according to their API Terms. Never send sensitive enterprise PII without reviewing the data policy.
  - Models: `gemini-1.5-flash` is ideal for high-throughput RAG summarization.

### 3. Groq Free Tier

- **Status**: Free developer tier with LPUs (Language Processing Units).
- **Constraints**:
  - High speed (up to 300+ tokens/second).
  - Groq currently specializes in inference rather than proprietary embeddings. When using Groq for chat (`AI_PROVIDER=groq`), embeddings can be supplied by Ollama (`nomic-embed-text`) or Gemini (`text-embedding-004`).

### 4. Supabase Free Tier

- **Status**: Free cloud PostgreSQL with pgvector.
- **Constraints**:
  - Database pausing: Inactive projects on the free tier pause after 1 week of inactivity (resumable via Supabase dashboard).
  - Storage limit: 1 GB total file storage. Document upload limits should be enforced (e.g., max 10MB per document).
  - Vector storage: 500MB is sufficient for ~150,000 chunks with 768-dim vectors.

---

## Zero-Cost Local Verification Workflow

1. Install Ollama locally: `ollama run llama3.2` and `ollama pull nomic-embed-text`.
2. Connect to a free Supabase instance (or local Docker PostgreSQL with pgvector).
3. Set `.env.local`:
   ```bash
   AI_PROVIDER=ollama
   EMBEDDING_PROVIDER=ollama
   OLLAMA_BASE_URL=http://localhost:11434
   ```
4. Run KnowFlow AI without spending a single cent or using any paid subscription.
