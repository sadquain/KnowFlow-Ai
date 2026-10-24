export type SupportedAIProvider = "ollama" | "gemini" | "groq";
export type SupportedEmbeddingProvider = "ollama" | "gemini";

export interface RetrievedChunk {
  id: string;
  document_id: string;
  document_title: string;
  chunk_index: number;
  content: string;
  metadata: {
    page_number?: number;
    character_count?: number;
    [key: string]: unknown;
  };
  similarity: number;
}

export interface GroundedCitation {
  id: string;
  document_id: string;
  document_title: string;
  chunk_id: string;
  snippet: string;
  page_number?: number;
  similarity_score: number;
}

export interface StreamEventPayload {
  type: "token" | "citation" | "done" | "error";
  token?: string;
  citations?: GroundedCitation[];
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
    latency_ms: number;
  };
  error?: string;
}
