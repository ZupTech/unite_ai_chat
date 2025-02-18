import { supabase } from "@/lib/supabase/browser-client"
import { useEffect, useState, useContext, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ChatbotUIContext } from "@/context/context"

export const XanoAuth = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const { setSelectedWorkspace, setWorkspaces, selectedWorkspace, workspaces } =
    useContext(ChatbotUIContext)

  const getAuthToken = () => {
    // 1. Primeiro tentar pegar da URL
    const tokenFromUrl = searchParams.get("token")
    if (tokenFromUrl) {
      // Se encontrou na URL, salva no localStorage para futuras verificações
      localStorage.setItem("authToken", tokenFromUrl)
      // Remove o token da URL para não ficar exposto
      router.replace("/")
      return tokenFromUrl
    }

    // 2. Tentar pegar do localStorage
    const localToken = localStorage.getItem("authToken")
    if (localToken) return localToken

    // 3. Se não encontrar, tentar pegar dos cookies
    const cookies = document.cookie.split(";")
    const authCookie = cookies.find(cookie =>
      cookie.trim().startsWith("authToken=")
    )
    if (authCookie) {
      const token = authCookie.split("=")[1]
      // Salvar no localStorage para próximas verificações
      localStorage.setItem("authToken", token)
      return token
    }

    return null
  }

  // Função centralizada para redirecionamento
  const handleRedirect = useCallback(
    async (workspace: any) => {
      if (isRedirecting) return

      console.log("Attempting to redirect with workspace:", workspace)
      setIsRedirecting(true)

      try {
        // Verificar se o workspace está realmente definido no contexto
        if (!selectedWorkspace) {
          console.log("Workspace not found in context, setting it now...")
          setSelectedWorkspace(workspace)
          // Aguardar para garantir que o estado foi atualizado
          await new Promise(resolve => setTimeout(resolve, 500))
        }

        // Verificar novamente se o workspace está definido
        if (selectedWorkspace) {
          console.log("Redirecting to workspace:", selectedWorkspace.id)
          // Forçar atualização da página antes do redirecionamento
          const redirectUrl = `/${selectedWorkspace.id}/chat`
          window.location.href = redirectUrl

          // Adicionar flag para indicar que precisamos de um segundo refresh
          localStorage.setItem("needsSecondRefresh", "true")
        } else {
          console.error("Failed to set workspace before redirect")
          setIsRedirecting(false)
          setAuthError("Failed to prepare workspace for redirect")
        }
      } catch (error) {
        console.error("Error during redirect:", error)
        setIsRedirecting(false)
        setAuthError("Redirect failed")
      }
    },
    [selectedWorkspace, isRedirecting, setSelectedWorkspace]
  )

  const waitForWorkspace = async (
    userId: string,
    maxAttempts = 5
  ): Promise<any> => {
    for (let i = 0; i < maxAttempts; i++) {
      console.log(`Attempt ${i + 1} of ${maxAttempts} to find workspace...`)
      const { data: workspace, error } = await supabase
        .from("workspaces")
        .select("*")
        .eq("user_id", userId)
        .eq("is_home", true)
        .single()

      if (error) {
        console.log("Error finding workspace:", error)
      } else if (workspace) {
        console.log("Found workspace:", workspace)
        return workspace
      }

      // Esperar antes da próxima tentativa
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    return null
  }

  const handleWorkspaceSetup = async (session: any) => {
    try {
      if (isRedirecting) {
        console.log("Already redirecting, skipping workspace setup")
        return
      }

      // Esperar a criação do workspace
      console.log("Waiting for workspace creation...")
      const homeWorkspace = await waitForWorkspace(session.user.id)

      if (!homeWorkspace) {
        console.error("Workspace creation timeout")
        setAuthError("Workspace creation failed")
        return
      }

      // Buscar todos os workspaces do usuário
      console.log("Getting user workspaces...")
      const { data: fetchedWorkspaces, error: workspacesError } = await supabase
        .from("workspaces")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })

      if (
        workspacesError ||
        !fetchedWorkspaces ||
        fetchedWorkspaces.length === 0
      ) {
        console.error("Error fetching workspaces:", workspacesError)
        setAuthError("Failed to fetch workspaces")
        return
      }

      // Atualizar o contexto global
      console.log("Setting workspaces in context:", fetchedWorkspaces)
      setWorkspaces(fetchedWorkspaces)

      // Setar o workspace selecionado
      console.log("Setting selected workspace:", homeWorkspace)
      setSelectedWorkspace(homeWorkspace)

      // Iniciar o processo de redirecionamento
      await handleRedirect(homeWorkspace)
    } catch (error) {
      console.error("Error in handleWorkspaceSetup:", error)
      setAuthError("Workspace setup failed")
    }
  }

  const handleXanoAuth = async () => {
    try {
      if (isRedirecting) {
        console.log("Already redirecting, skipping auth")
        return
      }

      // Se já estiver autenticado e tiver workspace, redirecionar
      if (isAuthenticated && selectedWorkspace) {
        console.log("Already authenticated with workspace:", selectedWorkspace)
        await handleRedirect(selectedWorkspace)
        return
      }

      // Se tiver autenticado mas não tiver workspace, tentar buscar
      if (isAuthenticated && !selectedWorkspace) {
        console.log("Authenticated but no workspace, trying to fetch...")
        const session = await supabase.auth.getSession()
        if (session.data.session) {
          await handleWorkspaceSetup(session.data.session)
        }
        return
      }

      // Pegar token do Xano
      const xanoToken = getAuthToken()
      if (!xanoToken) {
        console.log("No Xano token found")
        setAuthError("No authentication token found")
        return
      }

      // Chamar endpoint de auth
      console.log("Calling auth endpoint...")
      const response = await fetch("/api/auth/xano", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ xanoToken })
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Auth endpoint error:", errorData)
        setAuthError(errorData.error || "Authentication failed")
        return
      }

      const session = await response.json()
      if (!session?.session?.access_token || !session?.session?.refresh_token) {
        console.error("Invalid session received:", session)
        setAuthError("Invalid session received")
        return
      }

      // Setar a sessão no Supabase
      console.log("Setting Supabase session...")
      await supabase.auth.setSession({
        access_token: session.session.access_token,
        refresh_token: session.session.refresh_token
      })

      setIsAuthenticated(true)
      await handleWorkspaceSetup(session)
    } catch (error: any) {
      console.error("Auth error details:", {
        message: error.message,
        stack: error.stack,
        error
      })
      setAuthError(error.message || "Authentication failed")
    }
  }

  // Effect para inicialização
  useEffect(() => {
    let mounted = true

    const init = async () => {
      if (isRedirecting || authError) {
        return
      }

      // Se já estiver autenticado e tiver workspace, redirecionar
      if (isAuthenticated && selectedWorkspace && mounted) {
        await handleRedirect(selectedWorkspace)
        return
      }

      // Se não tiver token, não fazer nada
      const token = getAuthToken()
      if (!token) {
        console.log("No auth token found, skipping init")
        return
      }

      if (mounted) {
        console.log("Starting authentication process...")
        await handleXanoAuth()
      }
    }

    init()

    return () => {
      mounted = false
    }
  }, [isAuthenticated, isRedirecting, authError, selectedWorkspace])

  if (authError) {
    router.push("/login")
    return null
  }

  return null
}
