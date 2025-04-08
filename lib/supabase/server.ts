import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * Create a Supabase client for server components and API routes
 */
export function createServerSupabaseClient(): SupabaseClient {
  console.log("[Server Supabase] Creating server client")
  const cookieStore = cookies()

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      get(name: string) {
        console.log(`[Server Supabase] Getting cookie: ${name}`)
        const cookie = cookieStore.get(name)
        console.log(`[Server Supabase] Cookie ${name}: ${cookie ? "found" : "not found"}`)
        return cookie?.value
      },
      set(name: string, value: string, options: any) {
        console.log(`[Server Supabase] Setting cookie: ${name}`)
        cookieStore.set({ name, value, ...options })
      },
      remove(name: string, options: any) {
        console.log(`[Server Supabase] Removing cookie: ${name}`)
        cookieStore.set({ name, value: "", ...options, maxAge: 0 })
      },
    },
  })
}

/**
 * IMPORTANT: This is for backward compatibility only
 * All new code should use createServerSupabaseClient() instead
 */
export function createClient(): SupabaseClient {
  console.log("[Server Supabase] createClient() called - creating server client")
  return createServerSupabaseClient()
}

/**
 * Helper function to check if a user is authenticated on the server
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
