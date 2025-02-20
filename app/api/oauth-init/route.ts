import { NextResponse } from "next/server"
import { headers } from "next/headers"

export async function GET(request: Request) {
  console.log("OAuth init route called")
  const headersList = headers()
  const protocol = headersList.get("x-forwarded-proto") || "http"
  const host = headersList.get("host") || ""
  const redirect_uri = `${protocol}://${host}`

  console.log("Constructed redirect_uri:", redirect_uri)

  try {
    const response = await fetch(
      "https://xxn3-inb4-ecxi.n7d.xano.io/api:Ys-isoaj/oauth/auth0/init?" +
        new URLSearchParams({
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
    console.log("OAuth init successful, returning auth URL:", data.authUrl)
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in OAuth init:", error)
    return NextResponse.json(
      { error: "Failed to initialize authentication" },
      { status: 500 }
    )
  }
}
