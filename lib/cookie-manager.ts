/**
 * Enhanced cookie management for Supabase authentication
 * This utility helps work around common cookie issues in browsers
 */

// Cookie names that Supabase uses
const SUPABASE_AUTH_TOKEN_NAME = "sb-access-token"
const SUPABASE_REFRESH_TOKEN_NAME = "sb-refresh-token"
const SUPABASE_PROVIDER_TOKEN_NAME = "sb-provider-token"

// LocalStorage keys for fallback
const LS_AUTH_TOKEN_KEY = "supabase-auth-token"
const LS_AUTH_STATE_KEY = "supabase-auth-state"

/**
 * Directly set authentication cookies with proper attributes
 */
export function setAuthCookies(accessToken: string, refreshToken: string, expiresIn = 3600, domain?: string): void {
  try {
    const expiryDate = new Date()
    expiryDate.setTime(expiryDate.getTime() + expiresIn * 1000)

    // Set the main auth token cookie
    document.cookie = `${SUPABASE_AUTH_TOKEN_NAME}=${encodeURIComponent(
      accessToken,
    )}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax; ${
      window.location.protocol === "https:" ? "Secure;" : ""
    } ${domain ? `domain=${domain};` : ""}`

    // Set the refresh token cookie with a longer expiry
    const refreshExpiryDate = new Date()
    refreshExpiryDate.setTime(refreshExpiryDate.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days

    document.cookie = `${SUPABASE_REFRESH_TOKEN_NAME}=${encodeURIComponent(
      refreshToken,
    )}; expires=${refreshExpiryDate.toUTCString()}; path=/; SameSite=Lax; ${
      window.location.protocol === "https:" ? "Secure;" : ""
    } ${domain ? `domain=${domain};` : ""}`

    // Also store in localStorage as fallback
    try {
      localStorage.setItem(
        LS_AUTH_TOKEN_KEY,
        JSON.stringify([accessToken, refreshToken, null, null, Math.floor(Date.now() / 1000) + expiresIn]),
      )
      localStorage.setItem(LS_AUTH_STATE_KEY, "authenticated")

      if (process.env.NODE_ENV === "development") {
        console.log("[CookieManager] Auth tokens stored in localStorage")
      }
    } catch (storageError) {
      console.error("[CookieManager] Error storing in localStorage:", storageError)
    }

    if (process.env.NODE_ENV === "development") {
      console.log("[CookieManager] Auth cookies set successfully")
    }
  } catch (error) {
    console.error("[CookieManager] Error setting auth cookies:", error)
  }
}

/**
 * Get authentication tokens from cookies or localStorage fallback
 */
export function getAuthTokens(): { accessToken: string | null; refreshToken: string | null } {
  try {
    // Try to get from cookies first
    const cookies = document.cookie.split(";").map((cookie) => cookie.trim())

    let accessToken: string | null = null
    let refreshToken: string | null = null

    // Check cookies
    for (const cookie of cookies) {
      if (cookie.startsWith(`${SUPABASE_AUTH_TOKEN_NAME}=`)) {
        accessToken = decodeURIComponent(cookie.split("=")[1])
      } else if (cookie.startsWith(`${SUPABASE_REFRESH_TOKEN_NAME}=`)) {
        refreshToken = decodeURIComponent(cookie.split("=")[1])
      }
    }

    // If not found in cookies, try localStorage
    if (!accessToken || !refreshToken) {
      const lsTokens = localStorage.getItem(LS_AUTH_TOKEN_KEY)
      if (lsTokens) {
        try {
          const parsedTokens = JSON.parse(lsTokens)
          if (Array.isArray(parsedTokens) && parsedTokens.length >= 2) {
            accessToken = parsedTokens[0]
            refreshToken = parsedTokens[1]

            if (process.env.NODE_ENV === "development") {
              console.log("[CookieManager] Auth tokens retrieved from localStorage")
            }

            // Restore cookies from localStorage
            if (accessToken && refreshToken) {
              const expiresAt = parsedTokens[4] || Math.floor(Date.now() / 1000) + 3600
              const expiresIn = expiresAt - Math.floor(Date.now() / 1000)

              if (expiresIn > 0) {
                setAuthCookies(accessToken, refreshToken, expiresIn)
              }
            }
          }
        } catch (parseError) {
          console.error("[CookieManager] Error parsing localStorage tokens:", parseError)
        }
      }
    }

    return { accessToken, refreshToken }
  } catch (error) {
    console.error("[CookieManager] Error getting auth tokens:", error)
    return { accessToken: null, refreshToken: null }
  }
}

/**
 * Clear all authentication cookies and localStorage items
 */
export function clearAuthCookies(): void {
  try {
    // Clear cookies by setting expiry in the past
    document.cookie = `${SUPABASE_AUTH_TOKEN_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`
    document.cookie = `${SUPABASE_REFRESH_TOKEN_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`
    document.cookie = `${SUPABASE_PROVIDER_TOKEN_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`

    // Also clear any Supabase cookies with project ID
    const cookies = document.cookie.split(";").map((cookie) => cookie.trim())
    for (const cookie of cookies) {
      if (cookie.startsWith("sb-")) {
        const name = cookie.split("=")[0]
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`
      }
    }

    // Clear localStorage
    localStorage.removeItem(LS_AUTH_TOKEN_KEY)
    localStorage.removeItem(LS_AUTH_STATE_KEY)

    // Clear any other Supabase-related items
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (key.startsWith("supabase-") || key.startsWith("sb-"))) {
        localStorage.removeItem(key)
      }
    }

    if (process.env.NODE_ENV === "development") {
      console.log("[CookieManager] Auth cookies and storage cleared")
    }
  } catch (error) {
    console.error("[CookieManager] Error clearing auth cookies:", error)
  }
}

/**
 * Check if user is authenticated based on cookies or localStorage
 */
export function isAuthenticated(): boolean {
  try {
    const { accessToken, refreshToken } = getAuthTokens()
    return !!accessToken && !!refreshToken
  } catch (error) {
    console.error("[CookieManager] Error checking authentication:", error)
    return false
  }
}

/**
 * Debug function to log all cookies and localStorage
 */
export function debugAuthStorage(): void {
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

  // Check authentication status
  console.log("--- Auth Status ---")
  console.log(`Is authenticated: ${isAuthenticated()}`)

  const { accessToken, refreshToken } = getAuthTokens()
  console.log(`Access token: ${accessToken ? "Present" : "Missing"}`)
  console.log(`Refresh token: ${refreshToken ? "Present" : "Missing"}`)

  console.log("=========================")
}
