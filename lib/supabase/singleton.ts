import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"

// Global variables for singleton pattern
let supabaseInstance: SupabaseClient | null = null
let isInitializing = false
let initializationPromise: Promise<SupabaseClient> | null = null

// For debugging
let initializationAttempts = 0
export let instanceCounter = 0

function isSecureCookie(): boolean {
  return process.env.NODE_ENV === "production" && window.location.protocol === "https:"
}

/**
 * Creates a singleton instance of the Supabase client
 */
export async function getSupabaseClient(): Promise<SupabaseClient> {
  if (supabaseInstance) {
    if (process.env.NODE_ENV === "development") {
      console.log("[Supabase Singleton] Returning existing instance")
    }
    return supabaseInstance
  }

  if (isInitializing && initializationPromise) {
    if (process.env.NODE_ENV === "development") {
      console.log("[Supabase Singleton] Initialization in progress, waiting...")
    }
    return initializationPromise
  }

  isInitializing = true
  initializationAttempts++
  instanceCounter++

  if (process.env.NODE_ENV === "development") {
    console.log(`[Supabase Singleton] Creating new instance (attempt #${initializationAttempts})`)
    console.log(`[Supabase Singleton] Instance counter: ${instanceCounter}`)
  }

  initializationPromise = new Promise((resolve) => {
    const instance = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            try {
              const cookies = document.cookie.split(";").map((c) => c.trim())
              const found = cookies.find((c) => c.startsWith(`${name}=`))
              if (found) return decodeURIComponent(found.split("=")[1])
              return localStorage.getItem(`supabase-${name}`) ?? undefined
            } catch (e) {
              console.error(`[Supabase Singleton] Error getting cookie ${name}:`, e)
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
              localStorage.setItem(`supabase-${name}`, value)
            } catch (e) {
              console.error(`[Supabase Singleton] Error setting cookie ${name}:`, e)
            }
          },
          remove(name: string, options: any) {
            try {
              if (process.env.NODE_ENV !== "production") options.secure = false
              const parts = [`${name}=`, `expires=Thu, 01 Jan 1970 00:00:00 GMT`, `path=${options.path || "/"}`]
              if (options.domain) parts.push(`domain=${options.domain}`)
              parts.push(`samesite=${options.sameSite || "Lax"}`)
              if (options.secure) parts.push("secure")
              document.cookie = parts.join("; ")
              localStorage.removeItem(`supabase-${name}`)
            } catch (e) {
              console.error(`[Supabase Singleton] Error removing cookie ${name}:`, e)
            }
          },
        },
        cookieOptions: {
          secure: isSecureCookie(),
          sameSite: "Lax",
          path: "/",
        },
        debug: process.env.NODE_ENV === "development",
        autoRefreshToken: true,
        persistSession: true,
      }
    )

    instance.auth.onAuthStateChange((event) => {
      if (process.env.NODE_ENV === "development") {
        console.log(`[Supabase Singleton] Auth state changed: ${event}`)
      }
    })

    supabaseInstance = instance
    isInitializing = false
    initializationPromise = null

    resolve(instance)
  })

  return initializationPromise
}

/**
 * Clears the Supabase client instance and related cookies/storage
 */
export function clearSupabaseClient(): void {
  supabaseInstance = null
  isInitializing = false
  initializationPromise = null

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
    console.error("[Supabase Singleton] Error clearing storage:", e)
  }
}

/**
 * Manual helper to set a Supabase cookie
 */
export function setSupabaseCookie(name: string, value: string, options: any = {}): void {
  try {
    if (process.env.NODE_ENV !== "production") options.secure = false

    const parts = [`${name}=${encodeURIComponent(value)}`]

    if (options.expires) parts.push(`expires=${options.expires.toUTCString()}`)
    parts.push(`path=${options.path || "/"}`)
    if (options.domain) parts.push(`domain=${options.domain}`)
    parts.push(`samesite=${options.sameSite || "Lax"}`)
    if (options.secure) parts.push("secure")

    document.cookie = parts.join("; ")
    localStorage.setItem(`supabase-${name}`, value)
  } catch (e) {
    console.error(`[Supabase Singleton] Error setting cookie (helper) ${name}:`, e)
  }
}

/**
 * Debug all auth cookies/localStorage
 */
export function debugStorageState(): void {
  if (process.env.NODE_ENV !== "development") return

  console.log("=== AUTH STORAGE DEBUG ===")
  console.log("--- Cookies ---")
  const cookies = document.cookie.split(";").map((c) => c.trim())
  cookies.forEach((c) => console.log(c))
  console.log("--- LocalStorage ---")
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && (key.startsWith("supabase-") || key.startsWith("sb-"))) {
      const value = localStorage.getItem(key)
      console.log(`${key}: ${value?.substring(0, 30)}...`)
    }
  }
  console.log("==========================")
}
