import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"

// Global variables for singleton pattern
let supabaseInstance: SupabaseClient | null = null
let isInitializing = false
let initializationPromise: Promise<SupabaseClient> | null = null

// For debugging - track how many times we try to create a client
let initializationAttempts = 0

// Global counter for GoTrueClient instances
export let instanceCounter = 0

/**
 * Creates a singleton instance of the Supabase client
 * This ensures only one GoTrueClient is created across the application
 */
export async function getSupabaseClient(): Promise<SupabaseClient> {
  // If we already have an instance, return it immediately
  if (supabaseInstance) {
    if (process.env.NODE_ENV === "development") {
      console.log("[Supabase Singleton] Returning existing instance")
    }
    return supabaseInstance
  }

  // If initialization is in progress, wait for it to complete
  if (isInitializing && initializationPromise) {
    if (process.env.NODE_ENV === "development") {
      console.log("[Supabase Singleton] Initialization in progress, waiting...")
    }
    return initializationPromise
  }

  // Start initialization
  isInitializing = true
  initializationAttempts++
  instanceCounter++

  if (process.env.NODE_ENV === "development") {
    console.log(`[Supabase Singleton] Creating new instance (attempt #${initializationAttempts})`)
    console.log(`[Supabase Singleton] Instance counter: ${instanceCounter}`)
  }

  // Create a promise for the initialization
  initializationPromise = new Promise((resolve) => {
    // Create a new instance
    const instance = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            try {
              if (process.env.NODE_ENV === "development") {
                console.log(`[Supabase Singleton] Getting cookie: ${name}`)
              }

              // Get cookies from document.cookie
              const cookies = document.cookie.split(";").map((cookie) => cookie.trim())
              const cookie = cookies.find((cookie) => cookie.startsWith(`${name}=`))

              if (cookie) {
                const value = cookie.split("=")[1]
                if (process.env.NODE_ENV === "development") {
                  console.log(`[Supabase Singleton] Cookie found: ${name}=${value.substring(0, 5)}...`)
                }
                return decodeURIComponent(value)
              }

              // If cookie not found, try localStorage as fallback
              const localStorageValue = localStorage.getItem(`supabase-${name}`)
              if (localStorageValue) {
                if (process.env.NODE_ENV === "development") {
                  console.log(`[Supabase Singleton] Cookie found in localStorage: ${name}`)
                }
                return localStorageValue
              }

              if (process.env.NODE_ENV === "development") {
                console.log(`[Supabase Singleton] Cookie not found: ${name}`)
              }
              return undefined
            } catch (error) {
              console.error(`[Supabase Singleton] Error getting cookie ${name}:`, error)
              return undefined
            }
          },
          set(name: string, value: string, options: any) {
            try {
              if (process.env.NODE_ENV === "development") {
                console.log(`[Supabase Singleton] Setting cookie: ${name}=${value.substring(0, 5)}...`)
              }

              // Set cookies on document.cookie
              let cookie = `${name}=${encodeURIComponent(value)}`

              if (options.expires) {
                cookie += `; expires=${options.expires.toUTCString()}`
              }
              if (options.path) {
                cookie += `; path=${options.path}`
              } else {
                cookie += "; path=/" // Default path to root
              }
              if (options.domain) {
                cookie += `; domain=${options.domain}`
              }
              if (options.sameSite) {
                cookie += `; samesite=${options.sameSite}`
              } else {
                cookie += "; samesite=Lax" // Default to Lax
              }
              if (options.secure) {
                cookie += "; secure"
              }

              document.cookie = cookie

              // Also store in localStorage as a fallback
              try {
                localStorage.setItem(`supabase-${name}`, value)
                if (process.env.NODE_ENV === "development") {
                  console.log(`[Supabase Singleton] Also stored in localStorage: ${name}`)
                }
              } catch (localStorageError) {
                console.error(`[Supabase Singleton] Error storing in localStorage: ${name}`, localStorageError)
              }
            } catch (error) {
              console.error(`[Supabase Singleton] Error setting cookie ${name}:`, error)
            }
          },
          remove(name: string, options: any) {
            try {
              if (process.env.NODE_ENV === "development") {
                console.log(`[Supabase Singleton] Removing cookie: ${name}`)
              }

              // Remove cookies by setting expiry in the past
              let cookie = `${name}=`

              cookie += `; expires=Thu, 01 Jan 1970 00:00:00 GMT`
              if (options.path) {
                cookie += `; path=${options.path}`
              } else {
                cookie += "; path=/" // Default path to root
              }
              if (options.domain) {
                cookie += `; domain=${options.domain}`
              }
              if (options.sameSite) {
                cookie += `; samesite=${options.sameSite}`
              } else {
                cookie += "; samesite=Lax" // Default to Lax
              }
              if (options.secure) {
                cookie += "; secure"
              }

              document.cookie = cookie

              // Also remove from localStorage
              try {
                localStorage.removeItem(`supabase-${name}`)
                if (process.env.NODE_ENV === "development") {
                  console.log(`[Supabase Singleton] Also removed from localStorage: ${name}`)
                }
              } catch (localStorageError) {
                console.error(`[Supabase Singleton] Error removing from localStorage: ${name}`, localStorageError)
              }
            } catch (error) {
              console.error(`[Supabase Singleton] Error removing cookie ${name}:`, error)
            }
          },
        },
        // Add debug mode to help troubleshoot
        debug: process.env.NODE_ENV === "development",
        // Ensure proper cookie parsing
        cookieOptions: {
          secure: window.location.protocol === "https:",
          sameSite: "Lax",
          path: "/",
        },
        // Set auto refresh token to true
        autoRefreshToken: true,
        persistSession: true,
      },
    )

    // Listen for auth state changes
    instance.auth.onAuthStateChange((event, session) => {
      if (process.env.NODE_ENV === "development") {
        console.log(`[Supabase Singleton] Auth state changed: ${event}`)
      }
    })

    // Store the instance
    supabaseInstance = instance
    isInitializing = false
    initializationPromise = null

    if (process.env.NODE_ENV === "development") {
      console.log("[Supabase Singleton] Instance created successfully")
    }

    resolve(instance)
  })

  return initializationPromise
}

/**
 * Clears the Supabase client instance
 * This should be called when signing out to ensure a fresh instance on next login
 */
export function clearSupabaseClient(): void {
  if (process.env.NODE_ENV === "development") {
    console.log("[Supabase Singleton] Clearing instance")
  }

  // Clear the instance
  supabaseInstance = null
  isInitializing = false
  initializationPromise = null

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
    console.error("[Supabase Singleton] Error clearing storage:", error)
  }

  if (process.env.NODE_ENV === "development") {
    console.log("[Supabase Singleton] Instance cleared")
  }
}

/**
 * Helper function to set a Supabase cookie
 */
export function setSupabaseCookie(name: string, value: string, options: any = {}): void {
  try {
    if (process.env.NODE_ENV === "development") {
      console.log(`[Supabase Singleton] Setting cookie (helper): ${name}=${value.substring(0, 5)}...`)
    }

    let cookie = `${name}=${encodeURIComponent(value)}`

    if (options.expires) {
      cookie += `; expires=${options.expires.toUTCString()}`
    }
    if (options.path) {
      cookie += `; path=${options.path}`
    } else {
      cookie += "; path=/" // Default path to root
    }
    if (options.domain) {
      cookie += `; domain=${options.domain}`
    }
    if (options.sameSite) {
      cookie += `; samesite=${options.sameSite}`
    } else {
      cookie += "; samesite=Lax" // Default to Lax
    }
    if (options.secure) {
      cookie += "; secure"
    }

    document.cookie = cookie

    // Also store in localStorage as a fallback
    try {
      localStorage.setItem(`supabase-${name}`, value)
      if (process.env.NODE_ENV === "development") {
        console.log(`[Supabase Singleton] Also stored in localStorage: ${name}`)
      }
    } catch (localStorageError) {
      console.error(`[Supabase Singleton] Error storing in localStorage: ${name}`, localStorageError)
    }
  } catch (error) {
    console.error(`[Supabase Singleton] Error setting cookie (helper) ${name}:`, error)
  }
}

/**
 * Debug function to log all cookies and localStorage items
 */
export function debugStorageState(): void {
  if (process.env.NODE_ENV !== "development") return

  console.log("=== AUTH STORAGE DEBUG ===")

  // Log cookies
  console.log("--- Cookies ---")
  const cookies = document.cookie.split(";").map((cookie) => cookie.trim())
  if (cookies.length === 1 && cookies[0] === "") {
    console.log("No cookies found")
  } else {
    cookies.forEach((cookie) => console.log(cookie))
  }

  // Log localStorage
  console.log("--- LocalStorage ---")
  let hasAuthItems = false
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && (key.startsWith("supabase-") || key.startsWith("sb-"))) {
      const value = localStorage.getItem(key)
      console.log(`${key}: ${value ? value.substring(0, 20) + "..." : "null"}`)
      hasAuthItems = true
    }
  }

  if (!hasAuthItems) {
    console.log("No auth localStorage items found")
  }

  console.log("=========================")
}
