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
  modelName: "Claude 3.5 Sonnet",
  provider: "openrouter" as const,
  hostedId: "anthropic/claude-3-sonnet",
  platformLink: OPENROUTER_PLATFORM_LINK,
  imageInput: true,
  maxContext: 128000
}

const OPEN_AI_GPT_4o_MINI: OpenRouterLLM = {
  modelId: "openai/gpt-4o-mini",
  modelName: "GPT 4o mini",
  provider: "openrouter" as const,
  hostedId: "openai/gpt-4o-mini",
  platformLink: OPENROUTER_PLATFORM_LINK,
  imageInput: true,
  maxContext: 128000
}

const OPEN_AI_GPT_4o: OpenRouterLLM = {
  modelId: "openai/gpt-4o",
  modelName: "GPT 4o",
  provider: "openrouter" as const,
  hostedId: "openai/gpt-4o",
  platformLink: OPENROUTER_PLATFORM_LINK,
  imageInput: true,
  maxContext: 128000
}

const DEEPSEEK_V3: OpenRouterLLM = {
  modelId: "deepseek/deepseek-chat",
  modelName: "Deepseek V3",
  provider: "openrouter" as const,
  hostedId: "deepseek/deepseek-chat",
  platformLink: OPENROUTER_PLATFORM_LINK,
  imageInput: false,
  maxContext: 131072
}

const DEEPSEEK_R1: OpenRouterLLM = {
  modelId: "deepseek/deepseek-r1-distill-llama-70b",
  modelName: "Deepseek R1",
  provider: "openrouter" as const,
  hostedId: "deepseek/deepseek-r1",
  platformLink: OPENROUTER_PLATFORM_LINK,
  imageInput: false,
  maxContext: 128000
}

const PERPLEXITY_SONAR: OpenRouterLLM = {
  modelId: "perplexity/sonar",
  modelName: "Perplexity Sonar",
  provider: "openrouter" as const,
  hostedId: "perplexity/sonar",
  platformLink: OPENROUTER_PLATFORM_LINK,
  imageInput: false,
  maxContext: 127000
}

const CLAUDE_3_5_HAIKU: OpenRouterLLM = {
  modelId: "anthropic/claude-3.5-haiku",
  modelName: "Claude 3.5 Haiku",
  provider: "openrouter" as const,
  hostedId: "anthropic/claude-3-haiku",
  platformLink: OPENROUTER_PLATFORM_LINK,
  imageInput: false,
  maxContext: 200000
}

const META_LLAMA_3_3_70B: OpenRouterLLM = {
  modelId: "meta-llama/llama-3.3-70b-instruct",
  modelName: "Meta Llama 3.3",
  provider: "openrouter" as const,
  hostedId: "meta-llama/llama-3.3-70b-instruct",
  platformLink: OPENROUTER_PLATFORM_LINK,
  imageInput: false,
  maxContext: 131072
}

export const OPENROUTER_LLM_LIST: OpenRouterLLM[] = [
  GEMINI_2_0_FLASH,
  CLAUDE_3_5_SONNET,
  OPEN_AI_GPT_4o_MINI,
  OPEN_AI_GPT_4o,
  DEEPSEEK_V3,
  DEEPSEEK_R1,
  PERPLEXITY_SONAR,
  CLAUDE_3_5_HAIKU,
  META_LLAMA_3_3_70B
]
