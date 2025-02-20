"use client"

import React, { useEffect, useContext } from "react"
import { useRouter, useSearchParams, useParams } from "next/navigation"
import { toast } from "@/components/ui/use-toast"
import { ChatbotUIContext } from "@/context/context"
import { supabase } from "@/lib/supabase/browser-client"
import { getProfileByUserId } from "@/db/profile"
import { getWorkspacesByUserId } from "@/db/workspaces"

interface AuthHandlerProps {
  children: React.ReactNode
}

export function AuthHandler({ children }: AuthHandlerProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const params = useParams()
  const {
    profile,
    setProfile,
    workspaces,
    setWorkspaces,
    selectedWorkspace,
    setSelectedWorkspace
  } = useContext(ChatbotUIContext)

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // 1. Verificar se estamos em uma rota protegida
        const isProtectedRoute = !window.location.pathname.includes("/login")
        console.log("🔒 AuthHandler: Starting auth check", {
          path: window.location.pathname,
          isProtectedRoute,
          hasCode: !!searchParams.get("code"),
          hasToken: !!localStorage.getItem("authToken"),
          hasProfile: !!profile
        })

        // 2. Se tem código OAuth, processa primeiro
        const code = searchParams.get("code")
        if (code) {
          console.log("🔒 AuthHandler: Processing OAuth code")
          await handleOAuthCallback(code)
          return
        }

        // 3. Verificar sessão atual
        const {
          data: { session }
        } = await supabase.auth.getSession()
        console.log("🔒 AuthHandler: Session check:", {
          hasSession: !!session,
          userId: session?.user?.id
        })

        // 4. Se não tem sessão em rota protegida
        if (!session && isProtectedRoute) {
          console.log("🔒 AuthHandler: No session in protected route")

          // 4.1 Tentar restaurar com token do Xano
          const token = localStorage.getItem("authToken")
          if (token) {
            console.log(
              "🔒 AuthHandler: Found Xano token, attempting to restore"
            )
            try {
              await restoreSession(token)
              return
            } catch (error) {
              console.error(
                "🔒 AuthHandler: Failed to restore with token:",
                error
              )
              localStorage.removeItem("authToken")
            }
          }

          // 4.2 Se não conseguiu restaurar, inicia fluxo OAuth
          console.log("🔒 AuthHandler: Starting OAuth flow")
          localStorage.setItem("returnLocale", params.locale as string)
          const response = await fetch(
            `/api/oauth-init?redirect_uri=${window.location.origin}`
          )
          const data = await response.json()
          if (data.authUrl) {
            window.location.href = data.authUrl
          }
          return
        }

        // 5. Se tem sessão mas não tem dados
        if (session && !profile) {
          console.log("🔒 AuthHandler: Has session but no profile")
          await initializeUserData()
          return
        }

        // 6. Se tem tudo mas não está no workspace
        if (
          session &&
          profile &&
          isProtectedRoute &&
          !window.location.pathname.includes("/chat")
        ) {
          console.log("🔒 AuthHandler: Redirecting to workspace")
          const workspace = selectedWorkspace || (workspaces || [])[0]
          if (workspace) {
            router.push(`/${workspace.id}/chat`)
          }
        }
      } catch (error) {
        console.error("🔒 AuthHandler: Error in auth flow:", error)
        if (error instanceof Error) {
          toast({
            title: "Authentication error",
            description: error.message || "Please try logging in again",
            variant: "destructive"
          })
        }
        localStorage.removeItem("authToken")
        router.push("/login")
      }
    }

    handleAuth()
  }, [searchParams])

  const restoreSession = async (token: string) => {
    console.log("🔒 AuthHandler: Attempting to restore session")
    const authResponse = await fetch("/api/auth/xano", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ xanoToken: token })
    })

    if (!authResponse.ok) {
      throw new Error("Failed to restore session")
    }

    const session = await authResponse.json()
    if (!session?.session?.access_token || !session?.session?.refresh_token) {
      throw new Error("Invalid session received")
    }

    await supabase.auth.setSession({
      access_token: session.session.access_token,
      refresh_token: session.session.refresh_token
    })

    await initializeUserData()
  }

  const handleOAuthCallback = async (code: string) => {
    try {
      console.log("🔒 AuthHandler: Processing OAuth callback")
      const response = await fetch(`/api/oauth-callback?code=${code}`)
      if (!response.ok) {
        throw new Error(`OAuth callback failed: ${response.status}`)
      }

      const data = await response.json()
      if (!data.token) {
        throw new Error("No token received from OAuth callback")
      }

      localStorage.setItem("authToken", data.token)
      console.log("🔒 AuthHandler: Token saved, restoring session")

      await restoreSession(data.token)

      // Limpar URL e restaurar locale
      const savedLocale = localStorage.getItem("returnLocale") || ""
      localStorage.removeItem("returnLocale")
      const newPath = savedLocale ? `/${savedLocale}` : "/"
      window.history.replaceState({}, "", newPath)
    } catch (error) {
      console.error("🔒 AuthHandler: OAuth callback error:", error)
      localStorage.removeItem("authToken")
      throw error
    }
  }

  const initializeUserData = async () => {
    console.log("🔒 AuthHandler: Initializing user data")
    const {
      data: { session }
    } = await supabase.auth.getSession()

    if (!session) {
      throw new Error("Cannot initialize data without session")
    }

    // Carregar perfil
    const userProfile = await getProfileByUserId(session.user.id)
    console.log("🔒 AuthHandler: Profile loaded:", !!userProfile)

    if (!userProfile) {
      throw new Error("No profile found for user")
    }
    setProfile(userProfile)

    // Carregar workspaces
    const fetchedWorkspaces = await getWorkspacesByUserId(session.user.id)
    console.log("🔒 AuthHandler: Workspaces loaded:", {
      count: fetchedWorkspaces.length,
      ids: fetchedWorkspaces.map(w => w.id)
    })

    if (fetchedWorkspaces.length === 0) {
      throw new Error("No workspaces found for user")
    }

    setWorkspaces(fetchedWorkspaces)
    const homeWorkspace = fetchedWorkspaces.find(w => w.is_home)

    if (homeWorkspace) {
      setSelectedWorkspace(homeWorkspace)
      console.log("🔒 AuthHandler: Redirecting to workspace:", homeWorkspace.id)
      router.push(`/${homeWorkspace.id}/chat`)
    }
  }

  return children
}
