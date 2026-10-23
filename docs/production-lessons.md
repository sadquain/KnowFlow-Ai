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

## Log #002: LangChain.js Core & Community Peer Dependency Mismatch in Modern Node Ecosystems

- **Date**: Package Resolution Phase
- **Symptom**: Installing `@langchain/core` alongside `@langchain/community` yielded `npm error ERESOLVE unable to resolve dependency tree: peer @langchain/core@"^1.1.38" from @langchain/community@1.1.29`.
- **Root Cause**: LangChain ecosystem has undergone rapid modularization where `@langchain/community` had a tight peer requirement, while newer provider packages (`@langchain/google-genai`, `@langchain/groq`, `@langchain/ollama`) interface directly via `@langchain/core`.
- **Resolution**: Standardized on `--legacy-peer-deps` during npm resolution while explicitly leveraging `@langchain/core` runnables, prompts, and document splitters directly. This ensures seamless interoperability between Ollama, Gemini, and Groq provider adapters without package tree breakage.
- **Lesson**: In fast-moving AI SDK ecosystems, pinning `@langchain/core` and using provider-specific integrations directly (e.g. `@langchain/ollama`, `@langchain/google-genai`) yields cleaner dependency graphs than monolithic community bundles.

---

## Log #003: Vector Dimension Compatibility Across Embedding Providers

- **Date**: Vector Architecture Phase
- **Symptom**: Attempting to interchange `OllamaEmbeddings` (default `nomic-embed-text`: 768 dimensions) with `GeminiEmbeddings` (`text-embedding-004`: 768 dimensions) vs other embedding models (e.g. OpenAI 1536 dims).
- **Root Cause**: PostgreSQL `pgvector` columns are fixed-dimension (e.g., `vector(768)`). Attempting to insert a 1536-dimensional vector into a 768-dim column causes a hard SQL execution failure.
- **Resolution**: Selected 768-dimensional embeddings as the primary standard across both Ollama (`nomic-embed-text`) and Google Gemini (`text-embedding-004`), ensuring cross-provider compatibility on the same database column. The schema includes an explicit check constraint and documented dimension configuration.
- **Lesson**: Always standardize embedding dimensions across your chosen local and cloud provider matrices before deploying database migrations.
