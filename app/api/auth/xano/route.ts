import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { Tables } from "@/supabase/types"
import { createWorkspace } from "@/db/workspaces"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

const XANO_ENDPOINT = "https://xxn3-inb4-ecxi.n7d.xano.io/api:MZh6mH2f/auth/me"

const setupDefaultProfile = async (userId: string, xanoUser: any) => {
  try {
    console.log("Setting up default profile for user:", userId)

    // 1. Criar ou atualizar perfil
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single()

    if (profileError) {
      console.log("Profile not found, creating new profile...")
      const username = `user_${userId.slice(0, 8)}`
      const { error: createError } = await supabaseAdmin
        .from("profiles")
        .insert({
          user_id: userId,
          has_onboarded: true,
          display_name: xanoUser.name || "User",
          username: username,
          bio: "AI Chat User",
          profile_context: "Default profile context",
          use_azure_openai: false,
          image_url: "",
          image_path: "",
          openai_api_key: process.env.OPENAI_API_KEY || "",
          openai_organization_id: process.env.OPENAI_ORG_ID || "",
          anthropic_api_key: process.env.ANTHROPIC_API_KEY || "",
          google_gemini_api_key: process.env.GOOGLE_GEMINI_API_KEY || "",
          mistral_api_key: process.env.MISTRAL_API_KEY || "",
          groq_api_key: process.env.GROQ_API_KEY || "",
          perplexity_api_key: process.env.PERPLEXITY_API_KEY || "",
          openrouter_api_key: process.env.OPENROUTER_API_KEY || "",
          azure_openai_api_key: "",
          azure_openai_endpoint: "",
          azure_openai_35_turbo_id: "",
          azure_openai_45_turbo_id: "",
          azure_openai_45_vision_id: "",
          azure_openai_embeddings_id: ""
        })

      if (createError) throw createError
    } else if (!profile.has_onboarded) {
      // Update existing profile
      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({
          has_onboarded: true,
          display_name: profile.username || xanoUser.name || "User",
          bio: "AI Chat User",
          profile_context: "Default profile context",
          use_azure_openai: false,
          openai_api_key: process.env.OPENAI_API_KEY || "",
          openai_organization_id: process.env.OPENAI_ORG_ID || "",
          anthropic_api_key: process.env.ANTHROPIC_API_KEY || "",
          google_gemini_api_key: process.env.GOOGLE_GEMINI_API_KEY || "",
          mistral_api_key: process.env.MISTRAL_API_KEY || "",
          groq_api_key: process.env.GROQ_API_KEY || "",
          perplexity_api_key: process.env.PERPLEXITY_API_KEY || "",
          openrouter_api_key: process.env.OPENROUTER_API_KEY || "",
          azure_openai_api_key: "",
          azure_openai_endpoint: "",
          azure_openai_35_turbo_id: "",
          azure_openai_45_turbo_id: "",
          azure_openai_45_vision_id: "",
          azure_openai_embeddings_id: ""
        })
        .eq("id", profile.id)

      if (updateError) throw updateError
    }

    // 2. Verificar se já existe um workspace home
    console.log("Checking for home workspace...")
    const { data: existingWorkspaces, error: workspacesError } =
      await supabaseAdmin
        .from("workspaces")
        .select("*")
        .eq("user_id", userId)
        .eq("is_home", true)

    if (workspacesError) throw workspacesError

    if (!existingWorkspaces || existingWorkspaces.length === 0) {
      console.log("No home workspace found, creating one...")
      const { error: createWorkspaceError } = await supabaseAdmin
        .from("workspaces")
        .insert({
          user_id: userId,
          is_home: true,
          name: "Home",
          default_context_length: 4096,
          default_model: "gpt-4o",
          default_prompt: "You are a friendly, helpful AI assistant.",
          default_temperature: 0.5,
          description: "My home workspace.",
          embeddings_provider: "openai",
          include_profile_context: true,
          include_workspace_instructions: true,
          instructions: "",
          sharing: "private"
        })

      if (createWorkspaceError) {
        console.error("Error creating workspace:", createWorkspaceError)
        throw createWorkspaceError
      }
    }

    // 3. Verificar se o workspace foi criado
    const { data: finalCheck, error: finalCheckError } = await supabaseAdmin
      .from("workspaces")
      .select("*")
      .eq("user_id", userId)
      .eq("is_home", true)
      .single()

    if (finalCheckError || !finalCheck) {
      console.error("Final workspace check failed:", finalCheckError)
      throw new Error("Failed to verify workspace creation")
    }

    console.log("Setup completed successfully")
  } catch (error) {
    console.error("Error in setupDefaultProfile:", error)
    throw error
  }
}

export async function POST(request: Request) {
  try {
    const { xanoToken } = await request.json()
    console.log("Received Xano token:", xanoToken)

    // 1. Validar token do Xano
    console.log("Calling Xano endpoint:", XANO_ENDPOINT)
    const xanoResponse = await fetch(XANO_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${xanoToken}`
      }
    })

    console.log("Xano response status:", xanoResponse.status)
    if (!xanoResponse.ok) {
      const errorText = await xanoResponse.text()
      console.error("Xano error:", errorText)
      throw new Error(`Invalid Xano token: ${errorText}`)
    }

    const xanoUser = await xanoResponse.json()
    console.log("Xano user data:", xanoUser)

    // Criar senha consistente baseada no ID do Xano
    const userPassword = `xano_${xanoUser.id}_${process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 8)}`
    console.log("Generated password:", userPassword)

    // 2. Verificar se usuário existe no auth do Supabase
    console.log("Checking if user exists in Supabase auth...")
    const {
      data: { users },
      error: listError
    } = await supabaseAdmin.auth.admin.listUsers()

    if (listError) throw listError

    const existingUser = users.find(u => u.email === xanoUser.email)
    console.log("Existing user:", existingUser)

    let userId: string

    if (!existingUser) {
      console.log("Creating new user in Supabase...")
      const { data: newUser, error: createError } =
        await supabaseAdmin.auth.admin.createUser({
          email: xanoUser.email,
          password: userPassword,
          email_confirm: true,
          user_metadata: {
            xano_id: xanoUser.id,
            full_name: xanoUser.name
          }
        })

      if (createError) throw createError
      userId = newUser.user.id
    } else {
      userId = existingUser.id
      console.log("Updating existing user password...")
      const { error: updateError } =
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          password: userPassword
        })

      if (updateError) throw updateError
    }

    // Setup default profile and workspace
    console.log("Setting up default profile and workspace...")
    await setupDefaultProfile(userId, xanoUser)

    // Fazer login com email/senha
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    console.log("Attempting to sign in with credentials...")
    const { data: session, error: signInError } =
      await supabase.auth.signInWithPassword({
        email: xanoUser.email,
        password: userPassword
      })

    if (signInError) throw signInError
    if (!session) throw new Error("No session returned after sign in")

    console.log("Sign in successful, returning session")
    return NextResponse.json(session)
  } catch (error: any) {
    console.error("Auth error:", error)
    return NextResponse.json(
      { error: error.message || "Authentication failed" },
      { status: 401 }
    )
  }
}
