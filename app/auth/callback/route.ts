import { createServerSupabaseClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const next = requestUrl.searchParams.get("next") || "/"
  const verified = requestUrl.searchParams.get("verified")

  if (code) {
    try {
      console.log("[Auth Callback] Processing auth callback with code")
      const supabase = createServerSupabaseClient()

      // Exchange code for session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error("[Auth Callback] Error exchanging code for session:", error)
        return NextResponse.redirect(
          `${requestUrl.origin}/?error=${encodeURIComponent("Authentication failed. Please try again.")}`,
        )
      }

      console.log("[Auth Callback] Code exchange successful, session created:", !!data.session)

      // Add cache control headers to prevent caching
      const response = NextResponse.redirect(
        `${requestUrl.origin}${next}${verified ? (next.includes("?") ? "&" : "?") + `verified=${verified}` : ""}`,
      )

      response.headers.set("Cache-Control", "no-store, max-age=0")
      return response
    } catch (error) {
      console.error("[Auth Callback] Unexpected error in auth callback:", error)
      return NextResponse.redirect(
        `${requestUrl.origin}/?error=${encodeURIComponent("An unexpected error occurred. Please try again.")}`,
      )
    }
  }

  // URL to redirect to after sign in process completes
  let redirectUrl = requestUrl.origin + next

  // Add verified parameter if it exists
  if (verified) {
    redirectUrl += (redirectUrl.includes("?") ? "&" : "?") + `verified=${verified}`
  }

  console.log(`[Auth Callback] Redirecting to: ${redirectUrl}`)

  const response = NextResponse.redirect(redirectUrl)
  response.headers.set("Cache-Control", "no-store, max-age=0")
  return response
}
