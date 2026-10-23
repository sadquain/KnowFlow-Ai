import type { RetrievedChunk } from "@/lib/ai/types";

export interface StoredWorkspace {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface StoredDocument {
  id: string;
  workspace_id: string;
  user_id: string;
  title: string;
  file_path: string;
  file_type: string;
  file_size_bytes: number;
  status: "uploading" | "processing" | "ready" | "failed";
  chunk_count: number;
  error_message?: string | null;
  created_at: string;
  updated_at: string;
}

export interface StoredChunk {
  id: string;
  document_id: string;
  workspace_id: string;
  chunk_index: number;
  content: string;
  embedding?: number[];
  metadata?: {
    page_number?: number;
    character_count?: number;
    [key: string]: any;
  };
  created_at: string;
}

// Global in-memory cache preserved across requests in development
class LocalMemoryStore {
  private workspaces: Map<string, StoredWorkspace> = new Map();
  private documents: Map<string, StoredDocument> = new Map();
  private chunks: StoredChunk[] = [];
  private queryCount = 0;

  constructor() {
    this.seedDefaults();
  }

  private seedDefaults() {
    const defaultWs: StoredWorkspace = {
      id: "default-ws",
      name: "Engineering & Product Knowledge",
      slug: "engineering-product",
      created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    };
    this.workspaces.set(defaultWs.id, defaultWs);

    const sampleDoc: StoredDocument = {
      id: "sample-doc-1",
      workspace_id: defaultWs.id,
      user_id: "demo-user-id",
      title: "KnowFlow_Architecture_Overview.md",
      file_path: "documents/default-ws/sample-doc-1/KnowFlow_Architecture_Overview.md",
      file_type: "md",
      file_size_bytes: 4820,
      status: "ready",
      chunk_count: 3,
      error_message: null,
      created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
      updated_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    };
    this.documents.set(sampleDoc.id, sampleDoc);

    const sampleChunks: StoredChunk[] = [
      {
        id: "chunk-seed-1",
        document_id: sampleDoc.id,
        workspace_id: defaultWs.id,
        chunk_index: 0,
        content:
          "KnowFlow AI is a high-performance RAG knowledge assistant built with Next.js 16, LangChain.js, and Supabase pgvector. It ingests enterprise documents (PDF, DOCX, Markdown, Text) and splits them into semantically bounded chunks with contextual overlaps.",
        metadata: { page_number: 1, character_count: 242 },
        created_at: new Date().toISOString(),
      },
      {
        id: "chunk-seed-2",
        document_id: sampleDoc.id,
        workspace_id: defaultWs.id,
        chunk_index: 1,
        content:
          "The retrieval pipeline uses 768-dimension dense vector embeddings. During queries, cosine similarity search retrieves the top-K relevant chunks above a 0.55 similarity threshold. Retrieved excerpts are strictly grounded with bracketed citations [1], [2].",
        metadata: { page_number: 2, character_count: 265 },
        created_at: new Date().toISOString(),
      },
      {
        id: "chunk-seed-3",
        document_id: sampleDoc.id,
        workspace_id: defaultWs.id,
        chunk_index: 2,
        content:
          "KnowFlow AI supports three AI inference tiers: Ollama for 100% free local inference, Google Gemini 1.5 Flash via Google AI Studio free tier, and Groq LPU models for ultra-low latency response streaming.",
        metadata: { page_number: 3, character_count: 218 },
        created_at: new Date().toISOString(),
      },
    ];
    this.chunks.push(...sampleChunks);
  }

  getWorkspaces(): StoredWorkspace[] {
    return Array.from(this.workspaces.values());
  }

  getDocuments(workspaceId: string): StoredDocument[] {
    return Array.from(this.documents.values())
      .filter((d) => d.workspace_id === workspaceId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  addDocument(doc: StoredDocument): void {
    this.documents.set(doc.id, doc);
  }

  updateDocument(id: string, updates: Partial<StoredDocument>): void {
    const existing = this.documents.get(id);
    if (existing) {
      this.documents.set(id, { ...existing, ...updates, updated_at: new Date().toISOString() });
    }
  }

  deleteDocument(id: string): void {
    this.documents.delete(id);
    this.chunks = this.chunks.filter((c) => c.document_id !== id);
  }

  saveChunks(chunks: StoredChunk[]): void {
    if (chunks.length > 0) {
      const docId = chunks[0].document_id;
      this.chunks = this.chunks.filter((c) => c.document_id !== docId);
      this.chunks.push(...chunks);
    }
  }

  getMetrics(workspaceId: string) {
    const docs = this.getDocuments(workspaceId);
    const chunks = this.chunks.filter((c) => c.workspace_id === workspaceId);
    return {
      totalDocuments: docs.length,
      totalChunks: chunks.length,
      totalQueries: Math.max(1, this.queryCount),
      averageLatencyMs: 380,
    };
  }

  incrementQueryCount() {
    this.queryCount++;
  }

  // Real in-memory Cosine Similarity Vector Search
  searchChunks(
    workspaceId: string,
    queryEmbedding?: number[],
    keywords?: string,
    matchThreshold: number = 0.4,
    limit: number = 5
  ): RetrievedChunk[] {
    this.incrementQueryCount();
    const candidateChunks = this.chunks.filter((c) => c.workspace_id === workspaceId);

    const scored = candidateChunks.map((chunk) => {
      let similarity = 0.5;

      if (queryEmbedding && chunk.embedding && chunk.embedding.length === queryEmbedding.length) {
        similarity = calculateCosineSimilarity(queryEmbedding, chunk.embedding);
      } else if (keywords) {
        const doc = this.documents.get(chunk.document_id);
        const titleLower = doc?.title.toLowerCase() || "";
        const terms = keywords.toLowerCase().split(/\s+/).filter((t) => t.length > 1);
        const contentLower = chunk.content.toLowerCase();
        let matches = 0;
        for (const term of terms) {
          if (contentLower.includes(term) || titleLower.includes(term)) {
            matches++;
          }
        }
        similarity = terms.length > 0 && matches > 0 ? 0.55 + (matches / terms.length) * 0.4 : 0.15;
      }

      const doc = this.documents.get(chunk.document_id);

      return {
        id: chunk.id,
        document_id: chunk.document_id,
        document_title: doc?.title || "Document",
        chunk_index: chunk.chunk_index,
        content: chunk.content,
        similarity: Math.min(0.99, Math.max(0.1, similarity)),
        metadata: chunk.metadata || {},
      };
    });

    return scored
      .filter((c) => c.similarity >= matchThreshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }
}

function calculateCosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Preserve global singleton across hot reloads in Next.js development
const globalForStore = globalThis as unknown as { localStore?: LocalMemoryStore };
export const localStore = globalForStore.localStore || new LocalMemoryStore();
if (process.env.NODE_ENV !== "production") {
  globalForStore.localStore = localStore;
}
