import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"
import { incrementClientCounter, initializeClientCounter } from "./global-counter"

// Init
initializeClientCounter()

// Globals
let supabaseClient: SupabaseClient | null = null
let clientInitialization: Promise<SupabaseClient> | null = null
let initializationCount = 0

function isSecureCookie(): boolean {
  return process.env.NODE_ENV === "production" && window.location.protocol === "https:"
}

export function getSupabaseClient(): Promise<SupabaseClient> {
  if (supabaseClient) return Promise.resolve(supabaseClient)
  if (clientInitialization) return clientInitialization

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
            try {
              const cookies = document.cookie.split(";").map((c) => c.trim())
              const found = cookies.find((c) => c.startsWith(`${name}=`))
              return found ? decodeURIComponent(found.split("=")[1]) : undefined
            } catch (e) {
              console.error(`[Supabase Client] Error getting cookie ${name}:`, e)
              return undefined
            }
          },
          set(name: string, value: string, options: any) {
            try {
              if (process.env.NODE_ENV !== "production") options.secure = false
              const parts = [`${name}=${encodeURIComponent(value)}`]

              if (options.expires) parts.push(`expires=${options.expires.toUTCString()}`)
              parts.push(`path=${options.path || "/"}`)
              if (options.domain) parts.push(`domain=${options.domain}`)
              parts.push(`samesite=${options.sameSite || "Lax"}`)
              if (options.secure) parts.push("secure")

              document.cookie = parts.join("; ")
            } catch (e) {
              console.error(`[Supabase Client] Error setting cookie ${name}:`, e)
            }
          },
          remove(name: string, options: any) {
            try {
              if (process.env.NODE_ENV !== "production") options.secure = false
              const parts = [
                `${name}=`,
                `expires=Thu, 01 Jan 1970 00:00:00 GMT`,
                `path=${options.path || "/"}`,
              ]
              if (options.domain) parts.push(`domain=${options.domain}`)
              parts.push(`samesite=${options.sameSite || "Lax"}`)
              if (options.secure) parts.push("secure")

              document.cookie = parts.join("; ")
            } catch (e) {
              console.error(`[Supabase Client] Error removing cookie ${name}:`, e)
            }
          },
        },
        cookieOptions: {
          secure: isSecureCookie(),
          sameSite: "Lax",
          path: "/",
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

export function resetSupabaseClient(): void {
  console.log("[Supabase Client] Resetting Supabase client")
  supabaseClient = null
  clientInitialization = null
}

export async function createClient(): Promise<SupabaseClient> {
  console.log("[Supabase Client] createClient() called - using singleton")
  return getSupabaseClient()
}

export function getClient(): SupabaseClient | null {
  if (!supabaseClient) {
    console.log("[Supabase Client] getClient() called but no client exists - initializing")
    getSupabaseClient().catch((err) => {
      console.error("[Supabase Client] Error initializing client:", err)
    })
  }
  return supabaseClient
}

export function clearSupabaseClient(): void {
  console.log("[Supabase Client] Clearing instance")

  supabaseClient = null
  clientInitialization = null

  try {
    const cookies = document.cookie.split(";").map((c) => c.trim())
    cookies.forEach((cookie) => {
      const name = cookie.split("=")[0]
      if (name.startsWith("sb-")) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`
      }
    })

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (key.startsWith("supabase-") || key.startsWith("sb-"))) {
        localStorage.removeItem(key)
      }
    }
  } catch (e) {
    console.error("[Supabase Client] Error clearing storage:", e)
  }

  console.log("[Supabase Client] Instance cleared")
}
