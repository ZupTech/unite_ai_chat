import { LLM, OpenRouterLLM } from "@/types"

const OPENROUTER_PLATFORM_LINK = "https://openrouter.ai/docs"

// OpenRouter Models (UPDATED 3/27/24)
const GEMINI_2_0_FLASH: OpenRouterLLM = {
  modelId: "google/gemini-2.0-flash-001",
  modelName: "Gemini 2.0 Flash",
  provider: "openrouter" as const,
  hostedId: "google/gemini-2.0-flash-001",
  platformLink: OPENROUTER_PLATFORM_LINK,
  imageInput: true,
  maxContext: 1000000
}

const CLAUDE_3_5_SONNET: OpenRouterLLM = {
  modelId: "anthropic/claude-3.5-sonnet",
  modelName: "Claude 3 Sonnet",
  provider: "openrouter" as const,
  hostedId: "anthropic/claude-3-sonnet",
  platformLink: OPENROUTER_PLATFORM_LINK,
  imageInput: true,
  maxContext: 128000
}

export const OPENROUTER_LLM_LIST: OpenRouterLLM[] = [
  GEMINI_2_0_FLASH,
  CLAUDE_3_5_SONNET
]
