import { useEffect } from "react"
import { LLMID, ChatSettings } from "@/types"
import { useSearchParams } from "next/navigation"
import { LLM_LIST } from "@/lib/models/llm/llm-list"
import { useLocalStorage } from "@/lib/hooks/use-local-storage"

interface UseDefaultChatSettingsProps {
  setChatSettings: (
    settings: ChatSettings | ((prev: ChatSettings) => ChatSettings)
  ) => void
}

export const useDefaultChatSettings = ({
  setChatSettings
}: UseDefaultChatSettingsProps) => {
  const searchParams = useSearchParams()
  const storedModel = useLocalStorage("unite_default_model")

  useEffect(() => {
    const modelToUse = storedModel || searchParams.get("defaultModel")

    if (modelToUse) {
      const selectedModel =
        LLM_LIST.find(m => m.modelId === modelToUse) || LLM_LIST[0]

      setChatSettings(prev => ({
        ...prev,
        model: selectedModel.modelId as LLMID
      }))
    }
  }, [storedModel, searchParams, setChatSettings])

  const getDefaultModel = () => {
    if (typeof window === "undefined") return LLM_LIST[0].modelId
    const storedModel = localStorage.getItem("unite_default_model")
    const model =
      LLM_LIST.find(m => m.modelId === (storedModel || "")) || LLM_LIST[0]
    return model.modelId
  }

  return {
    model: getDefaultModel(),
    temperature: 0.7
    // ... outras configurações
  }
}
