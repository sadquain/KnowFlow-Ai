# KnowFlow AI — Production Engineering Lessons & Incident Log

This document records authentic engineering challenges encountered during development, root cause investigations, applied solutions, and design takeaways.

---

## Log #001: Next.js CLI Project Naming & Directory Initialization Collision

- **Date**: Initial Scaffold Phase
- **Symptom**: Executing `npx create-next-app@latest .` failed with `npm error: Could not create a project called "KnowFlow Ai" because of npm naming restrictions (no capital letters or spaces)`.
- **Root Cause**: `create-next-app` automatically uses the parent folder name as the default `package.json` name when targeting `.` directly, which violated npm URL-friendly package naming rules (`knowflow-ai` vs `KnowFlow Ai`).
- **Resolution**: Initialized the project with an explicit package name `knowflow-ai` and relocated the scaffolded project files cleanly into the workspace root, establishing standard configuration.
- **Lesson**: CLI tools bootstrapping in-place often infer package names from the directory path. Providing an explicit conformant package name avoids directory naming discrepancies.

---

## Log #002: LangChain.js Modularization & Eliminating `--legacy-peer-deps`

- **Date**: Package Resolution Phase
- **Symptom**: Monolithic LangChain packages (`@langchain/community`) created strict peer dependency locks on older `@langchain/core` versions, while newer provider packages (`@langchain/google-genai`, `@langchain/groq`, `@langchain/ollama`) interface directly via `@langchain/core`.
- **Root Cause**: `@langchain/community` was not actually imported in application code, yet forced npm into peer dependency conflicts unless `--legacy-peer-deps` was passed.
- **Resolution**: Pruned `@langchain/community` and `pdf2json`, explicitly declared `@langchain/textsplitters`, updated `@types/node` to `^22` matching `vitest@5`, and removed `.npmrc`. `npm install` now executes cleanly with zero peer dependency conflicts.
- **Lesson**: In fast-moving AI SDK ecosystems, pinning `@langchain/core` and using standalone provider integrations directly yields cleaner dependency graphs than monolithic community bundles.

---

## Log #003: Fixed Vector Dimension Alignment in PostgreSQL pgvector & Gemini Embeddings

- **Date**: Vector Architecture Phase
- **Symptom**: Attempting to interchange local Ollama (`nomic-embed-text`: 768 dimensions) with cloud Google Gemini (`gemini-embedding-001`: default 3072 dimensions) resulted in database insertion failures against the `vector(768)` column in PostgreSQL.
- **Root Cause**: PostgreSQL `pgvector` columns are fixed-dimension. Inserting vectors of differing dimensions causes immediate SQL execution errors.
- **Resolution**: Configured Google Gemini's embedding client with explicit `outputDimensionality: 768` (`new TaskType.RETRIEVAL_DOCUMENT` with 768 dimensions), standardizing vector dimensionality across both local Ollama and cloud Google Gemini on the same `vector(768)` pgvector column.
- **Lesson**: Always standardize embedding dimensions across your chosen local and cloud provider matrices before deploying database migrations and embedding pipelines.

---

## Log #004: Next.js 16 Breaking Conventions — Async Route Parameters & Prerender Guards

- **Date**: Migration Phase
- **Symptom**: Route handlers accessing dynamic path parameters failed typechecks with `Type '{ id: string; }' is not assignable to type 'Promise<{ id: string; }>'`. Additionally, route bailing occurred when using request headers without dynamic guards.
- **Root Cause**: Next.js 16 introduces asynchronous route parameters `{ params }: { params: Promise<{ id: string }> }` across both page components and API route handlers.
- **Resolution**: Updated all dynamic route handlers (`/api/documents/[id]`, `/api/workspaces/[id]`, etc.) to `await params`. Avoided deprecated `force-dynamic` directives that conflict with Next.js 16 Turbopack `cacheComponents` and `partialPrefetching`.
- **Lesson**: Always consult the Next.js distribution documentation (`node_modules/next/dist/docs/`) before modifying framework-level APIs in major version bumps.

---

## Log #005: Cosine Similarity Threshold Calibration for Document Summarization

- **Date**: RAG Retrieval Phase
- **Symptom**: Broad summary queries (e.g. "Summarize key findings from my documents") returned `"I couldn't find enough information in your knowledge base to answer that."` even though relevant documents were indexed.
- **Root Cause**: High-level semantic questions produce lower cosine similarity scores (~0.30 - 0.45) compared to exact factoid keyword queries (>0.60). A rigid `0.55` match threshold prematurely filtered out valid document overview chunks.
- **Resolution**: Calibrated default similarity threshold to `0.35` with an automatic relaxed fallback to `0.25` when zero chunks meet the initial cutoff, ensuring broad questions retrieve context while preserving hallucination boundaries.
- **Lesson**: RAG similarity thresholds must account for query specificity. Implementing adaptive thresholding prevents false-negative retrieval failures on broad exploratory questions.
