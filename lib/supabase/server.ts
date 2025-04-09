import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { SupabaseClient } from "@supabase/supabase-js"

function isSecureCookie(): boolean {
  return process.env.NODE_ENV === "production"
}

/**
 * Create a Supabase client for server components and API routes
 */
export function createServerSupabaseClient(): SupabaseClient {
  console.log("[Server Supabase] Creating server client")

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          const cookieStore = await cookies()
          console.log(`[Server Supabase] Getting cookie: ${name}`)
          const cookie = cookieStore.get(name)
          console.log(`[Server Supabase] Cookie ${name}: ${cookie ? "found" : "not found"}`)
          return cookie?.value
        },
        async set(name: string, value: string, options: any) {
          const cookieStore = await cookies()

          if (process.env.NODE_ENV !== "production") {
            options.secure = false
          }

          console.log(`[Server Supabase] Setting cookie: ${name}`)
          cookieStore.set({ name, value, ...options })
        },
        async remove(name: string, options: any) {
          const cookieStore = await cookies()

          if (process.env.NODE_ENV !== "production") {
            options.secure = false
          }

          console.log(`[Server Supabase] Removing cookie: ${name}`)
          cookieStore.set({
            name,
            value: "",
            ...options,
            maxAge: 0,
          })
        },
      },
      cookieOptions: {
        secure: isSecureCookie(),
        sameSite: "Lax",
        path: "/",
      },
    }
  )
}

/**
 * Backward-compatible helper
 */
export function createClient(): SupabaseClient {
  console.log("[Server Supabase] createClient() called - creating server client")
  return createServerSupabaseClient()
}

/**
 * Check if a user is authenticated in server context
 */
export async function isAuthenticatedServer(): Promise<boolean> {
  try {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      console.error("[Server Supabase] Error checking authentication:", error)
      return false
    }

    console.log("[Server Supabase] Authentication check:", !!data.session)
    return !!data.session
  } catch (error) {
    console.error("[Server Supabase] Unexpected error checking authentication:", error)
    return false
  }
}
