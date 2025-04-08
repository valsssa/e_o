import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"
import { incrementClientCounter, initializeClientCounter } from "./global-counter"

// Initialize the counter
initializeClientCounter()

// Global variables to track client state
let supabaseClient: SupabaseClient | null = null
let clientInitialization: Promise<SupabaseClient> | null = null
let initializationCount = 0

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
  if (clientInitialization) {
    return clientInitialization
  }

  // Create a new initialization promise
  initializationCount++
  console.log(`[Supabase Client] Creating new client (attempt #${initializationCount})`)
  incrementClientCounter()

  clientInitialization = new Promise((resolve) => {
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
      },
    )

    supabaseClient = client
    clientInitialization = null
    resolve(client)
  })

  return clientInitialization
}

/**
 * Reset the Supabase client
 * Useful when signing out to ensure a fresh client on next login
 */
export function resetSupabaseClient(): void {
  console.log("[Supabase Client] Resetting Supabase client")
  supabaseClient = null
  clientInitialization = null
}

/**
 * IMPORTANT: This is for backward compatibility only
 * All new code should use getSupabaseClient() instead
 */
export async function createClient(): Promise<SupabaseClient> {
  console.log("[Supabase Client] createClient() called - using singleton")
  return getSupabaseClient()
}

/**
 * IMPORTANT: This is for backward compatibility only
 * All new code should use getSupabaseClient() instead
 */
export function getClient(): SupabaseClient | null {
  if (!supabaseClient) {
    console.log("[Supabase Client] getClient() called but no client exists - initializing")
    // Trigger async initialization but don't wait for it
    getSupabaseClient().catch((err) => {
      console.error("[Supabase Client] Error initializing client:", err)
    })
  }
  return supabaseClient
}

export function clearSupabaseClient(): void {
  console.log("[Supabase Client] Clearing instance")

  // Clear the instance
  supabaseClient = null
  clientInitialization = null

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

  console.log("[Supabase Client] Instance cleared")
}
