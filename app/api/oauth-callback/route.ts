import { NextResponse } from "next/server"
import { headers } from "next/headers"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  console.log("OAuth callback route called")
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const vParam = searchParams.get("v")

  if (!code) {
    return NextResponse.json({ error: "No code provided" }, { status: 400 })
  }

  const headersList = headers()
  const protocol = headersList.get("x-forwarded-proto") || "http"
  const host = headersList.get("host") || ""
  const redirect_uri = `${protocol}://${host}${vParam ? `?v=${vParam}` : ""}`

  console.log("Constructed redirect_uri:", redirect_uri)

  try {
    const response = await fetch(
      "https://xxn3-inb4-ecxi.n7d.xano.io/api:Ys-isoaj/oauth/auth0/continue?" +
        new URLSearchParams({
          code,
          redirect_uri
        }),
      {
        method: "GET",
        headers: {
          accept: "application/json"
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Xano API responded with status: ${response.status}`)
    }

    const data = await response.json()
    console.log("OAuth callback successful")
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in OAuth callback:", error)
    return NextResponse.json(
      { error: "Failed to complete authentication" },
      { status: 500 }
    )
  }
}
