import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"

// Global variables to track client state
let supabaseClient: SupabaseClient | null = null
let clientInitializing: Promise<SupabaseClient> | null = null

/**
 * Get the Supabase client for browser environments
 * Creates a new client if one doesn't exist
 */
export function getSupabaseClient(): Promise<SupabaseClient> {
  // If we already have a client, return it
  if (supabaseClient) {
    return Promise.resolve(supabaseClient)
  }

  // If initialization is in progress, return the existing promise
  if (clientInitializing) {
    return clientInitializing
  }

  // Create a new initialization promise
  const isDevelopment = process.env.NODE_ENV === "development"
  if (isDevelopment) {
    console.log("[Supabase Client] Creating new client")
  }

  clientInitializing = new Promise((resolve) => {
    const client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            const cookies = document.cookie.split(";").map((c) => c.trim())
            const cookie = cookies.find((c) => c.startsWith(`${name}=`))
            return cookie ? decodeURIComponent(cookie.split("=")[1]) : undefined
          },
          set(name: string, value: string, options: any) {
            document.cookie = `${name}=${encodeURIComponent(value)}; ${Object.entries(options)
              .map(([key, value]) => `${key}=${value}`)
              .join("; ")}`
          },
          remove(name: string, options: any) {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; ${Object.entries(options)
              .map(([key, value]) => `${key}=${value}`)
              .join("; ")}`
          },
        },
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
        cookieOptions: {
          secure: process.env.NODE_ENV === "production" || window.location.protocol === "https:",
          sameSite: "Lax",
          path: "/",
        },
        // Only enable debug mode in development
        debug: isDevelopment,
      },
    )

    supabaseClient = client
    clientInitializing = null
    resolve(client)
  })

  return clientInitializing
}

/**
 * Reset the Supabase client
 * Useful when signing out to ensure a fresh client on next login
 */
export function clearSupabaseClient(): void {
  if (process.env.NODE_ENV === "development") {
    console.log("[Supabase Client] Clearing client")
  }

  // Clear the instance
  supabaseClient = null
  clientInitializing = null

  // Clear all auth cookies and storage
  try {
    // Clear all Supabase cookies
    const cookies = document.cookie.split(";").map((cookie) => cookie.trim())
    const supabaseCookies = cookies.filter((cookie) => cookie.startsWith("sb-"))

    for (const cookie of supabaseCookies) {
      const name = cookie.split("=")[0]
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`
    }

    // Clear localStorage items related to Supabase
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (key.startsWith("supabase-") || key.startsWith("sb-"))) {
        localStorage.removeItem(key)
      }
    }
  } catch (error) {
    console.error("[Supabase Client] Error clearing storage:", error)
  }
}

/**
 * IMPORTANT: This is for backward compatibility only
 * All new code should use getSupabaseClient() instead
 */
export async function createClient(): Promise<SupabaseClient> {
  return getSupabaseClient()
}