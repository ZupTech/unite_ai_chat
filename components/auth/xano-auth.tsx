import { supabase } from "@/lib/supabase/browser-client"
import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export const XanoAuth = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isAuthenticated, setIsAuthenticated] = useState(false)

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

  const handleXanoAuth = async () => {
    try {
      // Se já estiver autenticado, não fazer nada
      if (isAuthenticated) return

      // 1. Pegar token do Xano
      const xanoToken = getAuthToken()
      console.log("Found Xano token:", !!xanoToken)

      if (!xanoToken) {
        console.log("No Xano token found")
        router.push("/login")
        return
      }

      // 2. Chamar nosso endpoint de auth
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
        router.push("/login")
        return
      }

      const session = await response.json()
      console.log("Received session:", session)

      if (!session?.session?.access_token || !session?.session?.refresh_token) {
        console.error("Invalid session received:", session)
        router.push("/login")
        return
      }

      // 3. Setar a sessão no Supabase
      console.log("Setting Supabase session...")
      await supabase.auth.setSession({
        access_token: session.session.access_token,
        refresh_token: session.session.refresh_token
      })

      // Marcar como autenticado
      setIsAuthenticated(true)

      // 4. Redirecionar para workspace
      console.log("Redirecting to setup...")
      router.push("/setup")
    } catch (error: any) {
      console.error("Auth error details:", {
        message: error.message,
        stack: error.stack,
        error
      })
      router.push("/login")
    }
  }

  useEffect(() => {
    // Tentar autenticar na montagem do componente
    handleXanoAuth()

    // Adicionar listener para mudanças no localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "authToken" && e.newValue && !isAuthenticated) {
        handleXanoAuth()
      }
    }

    // Verificar periodicamente o token
    const checkInterval = setInterval(() => {
      if (!isAuthenticated && getAuthToken()) {
        handleXanoAuth()
      }
    }, 1000) // Verificar a cada segundo

    window.addEventListener("storage", handleStorageChange)

    // Cleanup
    return () => {
      window.removeEventListener("storage", handleStorageChange)
      clearInterval(checkInterval)
    }
  }, [isAuthenticated])

  return null
}
