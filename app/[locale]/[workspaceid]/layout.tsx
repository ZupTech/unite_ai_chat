"use client"

import { Dashboard } from "@/components/ui/dashboard"
import { ChatbotUIContext } from "@/context/context"
import { getAssistantWorkspacesByWorkspaceId } from "@/db/assistants"
import { getChatsByWorkspaceId } from "@/db/chats"
import { getCollectionWorkspacesByWorkspaceId } from "@/db/collections"
import { getFileWorkspacesByWorkspaceId } from "@/db/files"
import { getFoldersByWorkspaceId } from "@/db/folders"
import { getModelWorkspacesByWorkspaceId } from "@/db/models"
import { getPresetWorkspacesByWorkspaceId } from "@/db/presets"
import { getPromptWorkspacesByWorkspaceId } from "@/db/prompts"
import { getAssistantImageFromStorage } from "@/db/storage/assistant-images"
import { getToolWorkspacesByWorkspaceId } from "@/db/tools"
import { getWorkspaceById } from "@/db/workspaces"
import { convertBlobToBase64 } from "@/lib/blob-to-b64"
import { supabase } from "@/lib/supabase/browser-client"
import { LLMID } from "@/types"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { ReactNode, useContext, useEffect, useState } from "react"
import Loading from "../loading"
import { AutoRefresh } from "@/components/utility/auto-refresh"

interface WorkspaceLayoutProps {
  children: ReactNode
}

export default function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const workspaceId = params.workspaceid as string

  const {
    setChatSettings,
    setAssistants,
    setAssistantImages,
    setChats,
    setCollections,
    setFolders,
    setFiles,
    setPresets,
    setPrompts,
    setTools,
    setModels,
    selectedWorkspace,
    setSelectedWorkspace,
    workspaces,
    setSelectedChat,
    setChatMessages,
    setUserInput,
    setIsGenerating,
    setFirstTokenReceived,
    setChatFiles,
    setChatImages,
    setNewMessageFiles,
    setNewMessageImages,
    setShowFilesDisplay
  } = useContext(ChatbotUIContext)

  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const session = (await supabase.auth.getSession()).data.session
      if (!session) {
        console.log("No session found, redirecting to login")
        router.push("/login")
        return false
      }
      return true
    }

    const init = async () => {
      const isAuthenticated = await checkAuth()
      if (!isAuthenticated) return

      // Se já temos o workspace correto carregado, não fazer nada
      if (selectedWorkspace?.id === workspaceId && initialized) {
        console.log("Workspace already loaded:", workspaceId)
        setLoading(false)
        return
      }

      // Se temos workspaces mas não o selecionado, tentar encontrar
      if (workspaces?.length > 0 && !selectedWorkspace) {
        const workspace = workspaces.find(w => w.id === workspaceId)
        if (workspace) {
          console.log("Found workspace in existing workspaces:", workspace)
          setSelectedWorkspace(workspace)
          setInitialized(true)
          setLoading(false)
          return
        }
      }

      console.log("Fetching workspace data...")
      await fetchWorkspaceData(workspaceId)
      setInitialized(true)
      setLoading(false)
    }

    init()
  }, [workspaceId, selectedWorkspace?.id])

  const fetchWorkspaceData = async (workspaceId: string) => {
    console.log("Fetching workspace:", workspaceId)

    try {
      const workspace = await getWorkspaceById(workspaceId)
      if (!workspace) {
        console.error("Workspace not found")
        router.push("/login")
        return
      }

      console.log("Setting selected workspace:", workspace)
      setSelectedWorkspace(workspace)

      const [
        assistantWorkspaces,
        chatWorkspaces,
        collectionWorkspaces,
        fileWorkspaces,
        folderWorkspaces,
        presetWorkspaces,
        promptWorkspaces,
        toolWorkspaces,
        modelWorkspaces
      ] = await Promise.all([
        getAssistantWorkspacesByWorkspaceId(workspaceId),
        getChatsByWorkspaceId(workspaceId),
        getCollectionWorkspacesByWorkspaceId(workspaceId),
        getFileWorkspacesByWorkspaceId(workspaceId),
        getFoldersByWorkspaceId(workspaceId),
        getPresetWorkspacesByWorkspaceId(workspaceId),
        getPromptWorkspacesByWorkspaceId(workspaceId),
        getToolWorkspacesByWorkspaceId(workspaceId),
        getModelWorkspacesByWorkspaceId(workspaceId)
      ])

      setAssistants(assistantWorkspaces.assistants || [])
      setChats(chatWorkspaces)
      setCollections(collectionWorkspaces.collections || [])
      setFiles(fileWorkspaces.files || [])
      setFolders(folderWorkspaces)
      setPresets(presetWorkspaces.presets || [])
      setPrompts(promptWorkspaces.prompts || [])
      setTools(toolWorkspaces.tools || [])
      setModels(modelWorkspaces.models || [])

      setChatSettings({
        model: "gpt-4o" as LLMID,
        prompt:
          workspace.default_prompt ||
          "You are a friendly, helpful AI assistant.",
        temperature: workspace.default_temperature || 0.5,
        contextLength: workspace.default_context_length || 4096,
        includeProfileContext: workspace.include_profile_context || true,
        includeWorkspaceInstructions:
          workspace.include_workspace_instructions || true,
        embeddingsProvider:
          (workspace.embeddings_provider as "openai" | "local") || "openai"
      })

      // Reset chat state
      setUserInput("")
      setChatMessages([])
      setSelectedChat(null)
      setIsGenerating(false)
      setFirstTokenReceived(false)
      setChatFiles([])
      setChatImages([])
      setNewMessageFiles([])
      setNewMessageImages([])
      setShowFilesDisplay(false)
    } catch (error) {
      console.error("Error fetching workspace data:", error)
      router.push("/login")
    }
  }

  if (loading) {
    return (
      <div className="size-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <>
      <AutoRefresh />
      <Dashboard>{children}</Dashboard>
    </>
  )
}
