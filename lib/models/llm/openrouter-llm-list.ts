import { LLM } from "@/types"

const OPENROUTER_PLATFORM_LINK = "https://openrouter.ai/docs"

// OpenRouter Models (UPDATED 3/27/24)
const CLAUDE_3_OPUS: LLM = {
  modelId: "op_anthropic/claude-3-opus",
  modelName: "Claude 3 Opus",
  provider: "openrouter",
  hostedId: "anthropic/claude-3-opus",
  platformLink: OPENROUTER_PLATFORM_LINK,
  imageInput: true
}

const CLAUDE_3_SONNET: LLM = {
  modelId: "op_anthropic/claude-3-sonnet",
  modelName: "Claude 3 Sonnet",
  provider: "openrouter",
  hostedId: "anthropic/claude-3-sonnet",
  platformLink: OPENROUTER_PLATFORM_LINK,
  imageInput: true
}

export const OPENROUTER_LLM_LIST: LLM[] = [CLAUDE_3_OPUS, CLAUDE_3_SONNET]
