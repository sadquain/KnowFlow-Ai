# KnowFlow AI — Testing & Verification Strategy

## 1. Testing Philosophy

Testing in KnowFlow AI ensures that:

1. Security and multi-tenancy rules cannot be bypassed.
2. The RAG pipeline generates grounded prompts, strictly formats context, and properly rejects insufficient evidence.
3. Citation metadata mappings are faithful to database retrieval results.
4. Token streaming handles cancellation, errors, and backpressure safely.
5. Accessibility (WCAG 2.2 AA) is verified via automated assertions and component checks.

---

## 2. Test Suites

### A. Unit Tests (Vitest)

Located in `tests/unit/`:

- **Validation**: Zod schema tests for upload file restrictions, question input sanitization, workspace creation.
- **Text Splitter & Chunking**: Testing `RecursiveCharacterTextSplitter` behavior with markdown headers, tables, boundary overlaps, and empty inputs.
- **RAG Prompt Construction**: Testing prompt formatting, ensuring system prompts cannot be overwritten by adversarial chunk text.
- **Provider Abstraction**: Verifying that switching `AI_PROVIDER` between `ollama`, `gemini`, and `groq` configures the correct client and throws helpful errors when API keys or URLs are missing.

### B. Component & Accessibility Tests (React Testing Library + axe-core)

Located in `tests/components/`:

- **Chat Interface**: Form submission, disable states during streaming, stop generation trigger, retry interaction.
- **Citation Badges & Drawer**: Keyboard accessibility (Enter/Space opens drawer), focus trapping, ARIA attributes.
- **Document Status Badges**: Verifying multi-modal state (icons + text), accessible badges.

### C. End-to-End & Integration Tests (Playwright)

Located in `tests/e2e/`:

- Multi-tenant boundary tests: Verifying User B cannot query or view documents from Workspace A.
- Document upload to indexing flow.
- RAG question-answering verification.
