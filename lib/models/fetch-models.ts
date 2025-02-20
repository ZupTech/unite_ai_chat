import { Tables } from "@/supabase/types"
import { LLM, LLMID, ModelProvider, OpenRouterLLM } from "@/types"
import { toast } from "sonner"
import { LLM_LIST_MAP } from "./llm/llm-list"
import { LLM_LIST } from "@/lib/models/llm/llm-list"
import { OPENROUTER_LLM_LIST } from "./llm/openrouter-llm-list"

export const fetchHostedModels = async (profile: Tables<"profiles">) => {
  try {
    const providers = [
      "google",
      "anthropic",
      "mistral",
      "groq",
      "perplexity",
      "openai"
    ]

    const response = await fetch("/api/keys")

    if (!response.ok) {
      throw new Error(`Server is not responding.`)
    }

    const data = await response.json()

    let modelsToAdd: LLM[] = []

    for (const provider of providers) {
      let providerKey: keyof typeof profile

      if (provider === "google") {
        providerKey = "google_gemini_api_key"
      } else {
        providerKey = `${provider}_api_key` as keyof typeof profile
      }

      if (profile?.[providerKey] || data.isUsingEnvKeyMap[provider]) {
        const models = LLM_LIST_MAP[provider]

        if (Array.isArray(models)) {
          modelsToAdd.push(...models)
        }
      }
    }

    return {
      envKeyMap: data.isUsingEnvKeyMap,
      hostedModels: modelsToAdd
    }
  } catch (error) {
    console.warn("Error fetching hosted models: " + error)
  }
}

export const fetchOllamaModels = async () => {
  try {
    const response = await fetch(
      process.env.NEXT_PUBLIC_OLLAMA_URL + "/api/tags"
    )

    if (!response.ok) {
      throw new Error(`Ollama server is not responding.`)
    }

    const data = await response.json()

    const localModels: LLM[] = data.models.map((model: any) => ({
      modelId: model.name as LLMID,
      modelName: model.name,
      provider: "ollama",
      hostedId: model.name,
      platformLink: "https://ollama.ai/library",
      imageInput: false
    }))

    return localModels
  } catch (error) {
    console.warn("Error fetching Ollama models: " + error)
  }
}

export const fetchOpenRouterModels = async () => {
  try {
    // Return the static list directly with type assertion
    return OPENROUTER_LLM_LIST as OpenRouterLLM[]
  } catch (error) {
    console.error("Error fetching Open Router models: " + error)
    toast.error("Error fetching Open Router models: " + error)
    return []
  }
}

export async function fetchModels(providers: ModelProvider[]): Promise<LLM[]> {
  try {
    const allModels = LLM_LIST.filter(model =>
      providers.includes(model.provider)
    )

    return allModels
  } catch (error) {
    console.error("Error fetching models:", error)
    return []
  }
}
