import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * Create a Supabase client for server components and API routes
 */
export function createServerSupabaseClient(): SupabaseClient {
  const isDevelopment = process.env.NODE_ENV === "development"
  if (isDevelopment) {
    console.log("[Server Supabase] Creating server client")
  }
  
  // Get the cookie store synchronously
  // Note: cookies() itself is not async, but using its methods can trigger warnings
  // if not handled properly in server components
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          try {
            // Access the cookie value directly
            const value = cookieStore.get(name)?.value
            return value
          } catch (error) {
            // Log error in development only
            if (isDevelopment) {
              console.error(`[Server Supabase] Error getting cookie: ${name}`, error)
            }
            return undefined
          }
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            if (isDevelopment) {
              console.error(`[Server Supabase] Error setting cookie: ${name}`, error)
            }
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: "", ...options, maxAge: 0 })
          } catch (error) {
            if (isDevelopment) {
              console.error(`[Server Supabase] Error removing cookie: ${name}`, error)
            }
          }
        },
      },
    }
  )
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

    return !!data.session
  } catch (error) {
    console.error("[Server Supabase] Unexpected error checking authentication:", error)
    return false
  }
}