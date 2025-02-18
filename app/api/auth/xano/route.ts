import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

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

    if (listError) {
      console.error("Error listing users:", listError)
      throw listError
    }

    const authUser = users.find(u => u.email === xanoUser.email)
    console.log("Existing auth user:", authUser)

    let userId = authUser?.id

    if (!userId) {
      console.log("Creating new user in Supabase...")

      // Criar novo usuário se não existir
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

      if (createError) {
        console.error("Error creating user:", createError)
        throw createError
      }

      console.log("New user created:", newUser)
      userId = newUser.user.id
    } else {
      // Se o usuário já existe, atualizar a senha
      console.log("Updating existing user password...")
      const { error: updateError } =
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          password: userPassword
        })

      if (updateError) {
        console.error("Error updating user password:", updateError)
        throw updateError
      }
      console.log("User password updated successfully")
    }

    // Criar cliente Supabase normal
    console.log("Creating Supabase client...")
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Fazer login com email/senha
    console.log("Attempting to sign in with credentials...")
    const { data: session, error: signInError } =
      await supabase.auth.signInWithPassword({
        email: xanoUser.email,
        password: userPassword
      })

    if (signInError) {
      console.error("Sign in error:", signInError)
      throw signInError
    }

    if (!session) {
      console.error("No session returned after sign in")
      throw new Error("No session returned after sign in")
    }

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
