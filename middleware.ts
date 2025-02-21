import { createClient } from "@/lib/supabase/middleware"
import { i18nRouter } from "next-i18n-router"
import { NextResponse, type NextRequest } from "next/server"
import i18nConfig from "./i18nConfig"

export async function middleware(request: NextRequest) {
  const i18nResult = i18nRouter(request, i18nConfig)
  if (i18nResult) return i18nResult

  try {
    // Check for v parameter in URL for external links
    const url = new URL(request.url)
    const vParam = url.searchParams.get('v')
    
    if (vParam) {
      try {
        // Decode base64 parameter
        const decodedParams = atob(vParam)
        const params = new URLSearchParams(decodedParams)
        const model = params.get('model')
        const prompt = params.get('prompt')
        
        // Instead of cookies, we'll pass these as URL parameters
        const { supabase, response } = createClient(request)
        const session = await supabase.auth.getSession()

        if (session) {
          const { data: homeWorkspace, error } = await supabase
            .from("workspaces")
            .select("*")
            .eq("user_id", session.data.session?.user.id)
            .eq("is_home", true)
            .single()

          if (!homeWorkspace) {
            throw new Error(error?.message)
          }

          // Redirect to chat with parameters
          const redirectUrl = new URL(`/${homeWorkspace.id}/chat`, request.url)
          if (model) redirectUrl.searchParams.set('defaultModel', model)
          if (prompt) redirectUrl.searchParams.set('defaultPrompt', prompt)
          
          return NextResponse.redirect(redirectUrl)
        }
      } catch (e) {
        console.error('Error handling parameters:', e)
      }
    }

    const { supabase, response } = createClient(request)
    const session = await supabase.auth.getSession()
    const redirectToChat = session && request.nextUrl.pathname === "/"

    if (redirectToChat) {
      const { data: homeWorkspace, error } = await supabase
        .from("workspaces")
        .select("*")
        .eq("user_id", session.data.session?.user.id)
        .eq("is_home", true)
        .single()

      if (!homeWorkspace) {
        throw new Error(error?.message)
      }

      // Preserve any existing parameters in the redirect
      const redirectUrl = new URL(`/${homeWorkspace.id}/chat`, request.url)
      url.searchParams.forEach((value, key) => {
        if (key !== 'v') {
          redirectUrl.searchParams.set(key, value)
        }
      })

      return NextResponse.redirect(redirectUrl)
    }

    return response
  } catch (e) {
    return NextResponse.next({
      request: {
        headers: request.headers
      }
    })
  }
}

export const config = {
  matcher: "/((?!api|static|.*\\..*|_next|auth).*)"
}
