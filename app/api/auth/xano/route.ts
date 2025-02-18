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
    const randomPassword = Math.random().toString(36).slice(-8)

    if (!userId) {
      console.log("Creating new user in Supabase...")

      // Criar novo usuário se não existir
      const { data: newUser, error: createError } =
        await supabaseAdmin.auth.admin.createUser({
          email: xanoUser.email,
          password: randomPassword,
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
    }

    // Gerar link de autenticação
    const { data, error: linkError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email: xanoUser.email
      })

    if (linkError) {
      console.error("Error generating link:", linkError)
      throw linkError
    }

    // Criar sessão usando o token gerado
    const { data: session } = await supabaseAdmin.auth.signInWithPassword({
      email: xanoUser.email,
      password: randomPassword
    })

    return NextResponse.json(session)
  } catch (error: any) {
    console.error("Auth error:", error)
    return NextResponse.json(
      { error: error.message || "Authentication failed" },
      { status: 401 }
    )
  }
}
