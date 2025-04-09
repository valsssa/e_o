/**
 * Debug utility functions for authentication issues
 * ONLY USED IN DEVELOPMENT MODE
 */

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === "development"

/**
 * Log authentication events to console and localStorage in development
 */
export function logAuthEvent(event: string, data: any) {
  if (!isDevelopment) return

  console.log(`[AUTH DEBUG] ${event}:`, data)

  // Store in localStorage for debugging
  try {
    const logs = JSON.parse(localStorage.getItem("auth_debug_logs") || "[]")
    logs.push({
      timestamp: new Date().toISOString(),
      event,
      data,
    })
    // Keep only the last 20 logs
    if (logs.length > 20) {
      logs.shift()
    }
    localStorage.setItem("auth_debug_logs", JSON.stringify(logs))
  } catch (e) {
    console.error("Error storing auth debug logs:", e)
  }
}

/**
 * Clear authentication debug logs from localStorage
 */
export function clearAuthLogs() {
  if (!isDevelopment) return
  
  localStorage.removeItem("auth_debug_logs")
  console.log("[AUTH DEBUG] Logs cleared")
}

/**
 * Get authentication debug logs from localStorage
 */
export function getAuthLogs() {
  if (!isDevelopment) return []

  try {
    return JSON.parse(localStorage.getItem("auth_debug_logs") || "[]")
  } catch (e) {
    console.error("Error retrieving auth debug logs:", e)
    return []
  }
}

/**
 * Check cookie status in development mode
 */
export function checkCookieStatus() {
  if (!isDevelopment) return { disabled: true }

  try {
    const cookies = document.cookie.split(";").map((c) => c.trim())
    const supabaseCookies = cookies.filter((c) => c.startsWith("sb-"))

    return {
      hasCookies: cookies.length > 0,
      hasSupabaseCookies: supabaseCookies.length > 0,
      supabaseCookies: supabaseCookies,
      allCookies: cookies,
    }
  } catch (e) {
    console.error("Error checking cookie status:", e)
    return { error: String(e) }
  }
}

/**
 * Debug utility to log all cookies and localStorage items
 */
export function debugStorageState() {
  if (!isDevelopment) return

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