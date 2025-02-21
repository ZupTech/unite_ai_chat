// TODO: Separate into multiple contexts, keeping simple for now

"use client"

import { ChatbotUIContext } from "@/context/context"
import { getProfileByUserId } from "@/db/profile"
import { getWorkspaceImageFromStorage } from "@/db/storage/workspace-images"
import { getWorkspacesByUserId } from "@/db/workspaces"
import { convertBlobToBase64 } from "@/lib/blob-to-b64"
import {
  fetchHostedModels,
  fetchOllamaModels,
  fetchOpenRouterModels
} from "@/lib/models/fetch-models"
import { supabase } from "@/lib/supabase/browser-client"
import { Tables } from "@/supabase/types"
import {
  ChatFile,
  ChatMessage,
  ChatSettings,
  LLM,
  LLMID,
  MessageImage,
  OpenRouterLLM,
  WorkspaceImage
} from "@/types"
import { AssistantImage } from "@/types/images/assistant-image"
import { VALID_ENV_KEYS } from "@/types/valid-keys"
import { useRouter } from "next/navigation"
import { FC, useEffect, useState, useRef } from "react"

interface GlobalStateProps {
  children: React.ReactNode
}

function usePersistedState<T>(key: string, defaultValue: T) {
  const [state, setState] = useState<T>(defaultValue)
  const [isInitialized, setIsInitialized] = useState(false)

  // Carregar do localStorage na montagem
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(key)
        if (saved) {
          setState(JSON.parse(saved))
        }
        setIsInitialized(true)
      } catch (err) {
        console.warn("Error reading from localStorage:", err)
        setIsInitialized(true)
      }
    }
  }, [key])

  // Salvar no localStorage quando mudar
  useEffect(() => {
    if (isInitialized && typeof window !== "undefined") {
      try {
        localStorage.setItem(key, JSON.stringify(state))
      } catch (err) {
        console.warn("Error writing to localStorage:", err)
      }
    }
  }, [key, state, isInitialized])

  return [state, setState, isInitialized] as const
}

export const GlobalState: FC<GlobalStateProps> = ({ children }) => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  // PROFILE STORE
  const [profile, setProfile] = useState<Tables<"profiles"> | null>(null)

  // ITEMS STORE
  const [assistants, setAssistants] = useState<Tables<"assistants">[]>([])
  const [collections, setCollections] = useState<Tables<"collections">[]>([])
  const [chats, setChats] = useState<Tables<"chats">[]>([])
  const [files, setFiles] = useState<Tables<"files">[]>([])
  const [folders, setFolders] = useState<Tables<"folders">[]>([])
  const [models, setModels] = useState<Tables<"models">[]>([])
  const [presets, setPresets] = useState<Tables<"presets">[]>([])
  const [prompts, setPrompts] = useState<Tables<"prompts">[]>([])
  const [tools, setTools] = useState<Tables<"tools">[]>([])
  const [workspaces, setWorkspaces, workspacesInitialized] = usePersistedState<
    Tables<"workspaces">[]
  >("workspaces", [])
  const [
    selectedWorkspace,
    setSelectedWorkspace,
    selectedWorkspaceInitialized
  ] = usePersistedState<Tables<"workspaces"> | null>("selectedWorkspace", null)
  const [workspaceImages, setWorkspaceImages] = useState<WorkspaceImage[]>([])

  // MODELS STORE
  const [envKeyMap, setEnvKeyMap] = useState<Record<string, VALID_ENV_KEYS>>({})
  const [availableHostedModels, setAvailableHostedModels] = useState<LLM[]>([])
  const [availableLocalModels, setAvailableLocalModels] = useState<LLM[]>([])
  const [availableOpenRouterModels, setAvailableOpenRouterModels] = useState<
    OpenRouterLLM[]
  >([])

  // PRESET STORE
  const [selectedPreset, setSelectedPreset] =
    useState<Tables<"presets"> | null>(null)

  // ASSISTANT STORE
  const [selectedAssistant, setSelectedAssistant] =
    useState<Tables<"assistants"> | null>(null)
  const [assistantImages, setAssistantImages] = useState<AssistantImage[]>([])
  const [openaiAssistants, setOpenaiAssistants] = useState<any[]>([])

  // PASSIVE CHAT STORE
  const [userInput, setUserInput] = useState<string>("")
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatSettings, setChatSettings] = useState<ChatSettings>({
    model: "gpt-4o",
    prompt: "You are a helpful AI assistant.",
    temperature: 0.5,
    contextLength: 4000,
    includeProfileContext: true,
    includeWorkspaceInstructions: true,
    embeddingsProvider: "openai"
  })
  const [chatSettingsInitialized, setChatSettingsInitialized] = useState(false)
  const [selectedChat, setSelectedChat] = useState<Tables<"chats"> | null>(null)
  const [chatFileItems, setChatFileItems] = useState<Tables<"file_items">[]>([])

  // ACTIVE CHAT STORE
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [firstTokenReceived, setFirstTokenReceived] = useState<boolean>(false)
  const [abortController, setAbortController] =
    useState<AbortController | null>(null)

  // CHAT INPUT COMMAND STORE
  const [isPromptPickerOpen, setIsPromptPickerOpen] = useState(false)
  const [slashCommand, setSlashCommand] = useState("")
  const [isFilePickerOpen, setIsFilePickerOpen] = useState(false)
  const [hashtagCommand, setHashtagCommand] = useState("")
  const [isToolPickerOpen, setIsToolPickerOpen] = useState(false)
  const [toolCommand, setToolCommand] = useState("")
  const [focusPrompt, setFocusPrompt] = useState(false)
  const [focusFile, setFocusFile] = useState(false)
  const [focusTool, setFocusTool] = useState(false)
  const [focusAssistant, setFocusAssistant] = useState(false)
  const [atCommand, setAtCommand] = useState("")
  const [isAssistantPickerOpen, setIsAssistantPickerOpen] = useState(false)

  // ATTACHMENTS STORE
  const [chatFiles, setChatFiles] = useState<ChatFile[]>([])
  const [chatImages, setChatImages] = useState<MessageImage[]>([])
  const [newMessageFiles, setNewMessageFiles] = useState<ChatFile[]>([])
  const [newMessageImages, setNewMessageImages] = useState<MessageImage[]>([])
  const [showFilesDisplay, setShowFilesDisplay] = useState<boolean>(false)

  // RETIEVAL STORE
  const [useRetrieval, setUseRetrieval] = useState<boolean>(true)
  const [sourceCount, setSourceCount] = useState<number>(4)

  // TOOL STORE
  const [selectedTools, setSelectedTools] = useState<Tables<"tools">[]>([])
  const [toolInUse, setToolInUse] = useState<string>("none")

  // Ref para tracking do último modelo
  const lastModelRef = useRef<string | null>(null)

  // Listener para mudanças no modelo no localStorage - versão simplificada
  useEffect(() => {
    console.log("🔧 GlobalState: Setting up model listener")

    const checkStorageModel = () => {
      const currentModel = localStorage.getItem("unite_default_model")

      if (currentModel && currentModel !== lastModelRef.current) {
        console.log("🔧 GlobalState: Model changed:", {
          from: lastModelRef.current,
          to: currentModel
        })

        lastModelRef.current = currentModel

        setChatSettings(prev => ({
          ...prev,
          model: currentModel as LLMID
        }))
      }
    }

    // Checa a cada 100ms
    const interval = setInterval(checkStorageModel, 100)

    // Cleanup
    return () => clearInterval(interval)
  }, []) // Sem dependências!

  useEffect(() => {
    const initializeState = async () => {
      if (!workspacesInitialized || !selectedWorkspaceInitialized) {
        return
      }

      try {
        const session = (await supabase.auth.getSession()).data.session
        if (!session) {
          setIsLoading(false)
          return
        }

        const profile = await getProfileByUserId(session.user.id)
        if (!profile) {
          setIsLoading(false)
          return
        }

        setProfile(profile)

        if (!profile.has_onboarded) {
          router.push("/setup")
          return
        }

        // Só buscar workspaces se ainda não tivermos nenhum
        if (!workspaces || workspaces.length === 0) {
          console.log("Fetching workspaces in GlobalState...")
          const fetchedWorkspaces = await getWorkspacesByUserId(session.user.id)

          if (fetchedWorkspaces.length > 0) {
            console.log("Setting workspaces:", fetchedWorkspaces)
            setWorkspaces(fetchedWorkspaces)

            // Se não temos um workspace selecionado, selecionar o home
            if (!selectedWorkspace) {
              const homeWorkspace = fetchedWorkspaces.find(w => w.is_home)
              if (homeWorkspace) {
                console.log("Setting home workspace:", homeWorkspace)
                setSelectedWorkspace(homeWorkspace)
              }
            }
          }
        }

        setIsLoading(false)
      } catch (error) {
        console.error("Error initializing state:", error)
        setIsLoading(false)
      }
    }

    initializeState()
  }, [workspacesInitialized, selectedWorkspaceInitialized])

  useEffect(() => {
    ;(async () => {
      console.log("🔧 GlobalState: Starting initialization")
      const profile = await fetchStartingData()

      if (profile) {
        const hostedModelRes = await fetchHostedModels(profile)
        if (!hostedModelRes) {
          console.log("🔧 GlobalState: No hosted models available")
          return
        }

        console.log(
          "🔧 GlobalState: Hosted models loaded:",
          hostedModelRes.hostedModels.map((m: LLM) => m.modelId)
        )
        setEnvKeyMap(hostedModelRes.envKeyMap)
        setAvailableHostedModels(hostedModelRes.hostedModels)

        if (
          profile["openrouter_api_key"] ||
          hostedModelRes.envKeyMap["openrouter"]
        ) {
          console.log("🔧 GlobalState: Fetching OpenRouter models...")
          const openRouterModels = await fetchOpenRouterModels()
          if (openRouterModels) {
            console.log(
              "🔧 GlobalState: OpenRouter models loaded:",
              openRouterModels.map((m: OpenRouterLLM) => m.modelId)
            )
            setAvailableOpenRouterModels(openRouterModels)
          }
        }

        if (process.env.NEXT_PUBLIC_OLLAMA_URL) {
          console.log("🔧 GlobalState: Fetching Ollama models...")
          const localModels = await fetchOllamaModels()
          if (localModels) {
            console.log(
              "🔧 GlobalState: Ollama models loaded:",
              localModels.map((m: LLM) => m.modelId)
            )
            setAvailableLocalModels(localModels)
          }
        }

        setChatSettingsInitialized(true)
      }
    })()
  }, [])

  const fetchStartingData = async () => {
    const session = (await supabase.auth.getSession()).data.session

    if (session) {
      const user = session.user

      const profile = await getProfileByUserId(user.id)
      setProfile(profile)

      if (!profile.has_onboarded) {
        return router.push("/setup")
      }

      // Só buscar workspaces se ainda não tivermos nenhum
      if (!workspaces || workspaces.length === 0) {
        console.log("Fetching workspaces in GlobalState...")
        const workspaces = await getWorkspacesByUserId(user.id)
        setWorkspaces(workspaces)

        // Se não temos um workspace selecionado, selecionar o home
        if (!selectedWorkspace) {
          const homeWorkspace = workspaces.find(w => w.is_home)
          if (homeWorkspace) {
            console.log("Setting home workspace in GlobalState:", homeWorkspace)
            setSelectedWorkspace(homeWorkspace)
          }
        }

        for (const workspace of workspaces) {
          let workspaceImageUrl = ""

          if (workspace.image_path) {
            workspaceImageUrl =
              (await getWorkspaceImageFromStorage(workspace.image_path)) || ""
          }

          if (workspaceImageUrl) {
            const response = await fetch(workspaceImageUrl)
            const blob = await response.blob()
            const base64 = await convertBlobToBase64(blob)

            setWorkspaceImages(prev => [
              ...prev,
              {
                workspaceId: workspace.id,
                path: workspace.image_path,
                base64: base64,
                url: workspaceImageUrl
              }
            ])
          }
        }
      }

      return profile
    }
  }

  if (isLoading || !chatSettingsInitialized) {
    return (
      <div className="size-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <ChatbotUIContext.Provider
      value={{
        // PROFILE STORE
        profile,
        setProfile,

        // ITEMS STORE
        assistants,
        setAssistants,
        collections,
        setCollections,
        chats,
        setChats,
        files,
        setFiles,
        folders,
        setFolders,
        models,
        setModels,
        presets,
        setPresets,
        prompts,
        setPrompts,
        tools,
        setTools,
        workspaces,
        setWorkspaces,

        // MODELS STORE
        envKeyMap,
        setEnvKeyMap,
        availableHostedModels,
        setAvailableHostedModels,
        availableLocalModels,
        setAvailableLocalModels,
        availableOpenRouterModels,
        setAvailableOpenRouterModels,

        // WORKSPACE STORE
        selectedWorkspace,
        setSelectedWorkspace,
        workspaceImages,
        setWorkspaceImages,

        // PRESET STORE
        selectedPreset,
        setSelectedPreset,

        // ASSISTANT STORE
        selectedAssistant,
        setSelectedAssistant,
        assistantImages,
        setAssistantImages,
        openaiAssistants,
        setOpenaiAssistants,

        // PASSIVE CHAT STORE
        userInput,
        setUserInput,
        chatMessages,
        setChatMessages,
        chatSettings,
        setChatSettings,
        selectedChat,
        setSelectedChat,
        chatFileItems,
        setChatFileItems,

        // ACTIVE CHAT STORE
        isGenerating,
        setIsGenerating,
        firstTokenReceived,
        setFirstTokenReceived,
        abortController,
        setAbortController,

        // CHAT INPUT COMMAND STORE
        isPromptPickerOpen,
        setIsPromptPickerOpen,
        slashCommand,
        setSlashCommand,
        isFilePickerOpen,
        setIsFilePickerOpen,
        hashtagCommand,
        setHashtagCommand,
        isToolPickerOpen,
        setIsToolPickerOpen,
        toolCommand,
        setToolCommand,
        focusPrompt,
        setFocusPrompt,
        focusFile,
        setFocusFile,
        focusTool,
        setFocusTool,
        focusAssistant,
        setFocusAssistant,
        atCommand,
        setAtCommand,
        isAssistantPickerOpen,
        setIsAssistantPickerOpen,

        // ATTACHMENT STORE
        chatFiles,
        setChatFiles,
        chatImages,
        setChatImages,
        newMessageFiles,
        setNewMessageFiles,
        newMessageImages,
        setNewMessageImages,
        showFilesDisplay,
        setShowFilesDisplay,

        // RETRIEVAL STORE
        useRetrieval,
        setUseRetrieval,
        sourceCount,
        setSourceCount,

        // TOOL STORE
        selectedTools,
        setSelectedTools,
        toolInUse,
        setToolInUse
      }}
    >
      {children}
    </ChatbotUIContext.Provider>
  )
}
