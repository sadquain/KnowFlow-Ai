import { ChatOllama, OllamaEmbeddings } from "@langchain/ollama";
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { ChatGroq } from "@langchain/groq";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import type { Embeddings } from "@langchain/core/embeddings";
import type { SupportedAIProvider, SupportedEmbeddingProvider } from "./types";

export interface ProviderConfig {
  aiProvider: SupportedAIProvider;
  embeddingProvider: SupportedEmbeddingProvider;
  chatModelName: string;
  embedModelName: string;
  ollamaBaseUrl: string;
}

export function getProviderConfig(): ProviderConfig {
  const aiProvider = (process.env.AI_PROVIDER || "ollama").toLowerCase() as SupportedAIProvider;
  const embeddingProvider = (process.env.EMBEDDING_PROVIDER || "ollama").toLowerCase() as SupportedEmbeddingProvider;
  const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";

  let chatModelName = process.env.OLLAMA_CHAT_MODEL || "llama3.2";
  if (aiProvider === "gemini") {
    chatModelName = process.env.GEMINI_CHAT_MODEL || "gemini-3.8-flash";
  } else if (aiProvider === "groq") {
    chatModelName = process.env.GROQ_CHAT_MODEL || "openai/gpt-oss-120b";
  }

  let embedModelName = process.env.OLLAMA_EMBED_MODEL || "nomic-embed-text";
  if (embeddingProvider === "gemini") {
    embedModelName = process.env.GEMINI_EMBED_MODEL || "gemini-embedding-001";
  }

  return {
    aiProvider,
    embeddingProvider,
    chatModelName,
    embedModelName,
    ollamaBaseUrl,
  };
}

/**
 * Returns a LangChain BaseChatModel configured for the active provider.
 */
export function getChatModel(
  overrideProvider?: SupportedAIProvider,
  overrideModel?: string
): BaseChatModel {
  const config = getProviderConfig();
  const provider = overrideProvider || config.aiProvider;

  switch (provider) {
    case "gemini": {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not configured in environment variables.");
      }
      const modelName = overrideModel || process.env.GEMINI_CHAT_MODEL || "gemini-3.8-flash";
      return new ChatGoogleGenerativeAI({
        model: modelName,
        apiKey,
        temperature: 0.2,
      });
    }

    case "groq": {
      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) {
        throw new Error("GROQ_API_KEY is not configured in environment variables.");
      }
      const modelName = overrideModel || process.env.GROQ_CHAT_MODEL || "openai/gpt-oss-120b";
      return new ChatGroq({
        model: modelName,
        apiKey,
        temperature: 0.2,
      });
    }

    case "ollama":
    default: {
      const modelName = overrideModel || process.env.OLLAMA_CHAT_MODEL || "llama3.2";
      return new ChatOllama({
        model: modelName,
        baseUrl: config.ollamaBaseUrl,
        temperature: 0.2,
      });
    }
  }
}

/**
 * Returns a LangChain Embeddings instance configured for the active embedding provider.
 * Both nomic-embed-text (Ollama) and gemini-embedding-001 (Gemini) generate 768-dim vectors.
 */
export function getEmbeddingModel(
  overrideProvider?: SupportedEmbeddingProvider,
  overrideModel?: string
): Embeddings {
  const config = getProviderConfig();
  const provider = overrideProvider || config.embeddingProvider;

  switch (provider) {
    case "gemini": {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not configured for embeddings.");
      }
      const modelName = overrideModel || process.env.GEMINI_EMBED_MODEL || "gemini-embedding-001";
      return new GoogleGenerativeAIEmbeddings({
        model: modelName,
        apiKey,
      });
    }

    case "ollama":
    default: {
      const modelName = overrideModel || process.env.OLLAMA_EMBED_MODEL || "nomic-embed-text";
      return new OllamaEmbeddings({
        model: modelName,
        baseUrl: config.ollamaBaseUrl,
      });
    }
  }
}
