// Debug utility functions for authentication issues

export function logAuthEvent(event: string, data: any) {
  if (process.env.NODE_ENV === "development") {
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
}

export function clearAuthLogs() {
  if (process.env.NODE_ENV === "development") {
    localStorage.removeItem("auth_debug_logs")
    console.log("[AUTH DEBUG] Logs cleared")
  }
}

export function getAuthLogs() {
  if (process.env.NODE_ENV === "development") {
    try {
      return JSON.parse(localStorage.getItem("auth_debug_logs") || "[]")
    } catch (e) {
      console.error("Error retrieving auth debug logs:", e)
      return []
    }
  }
  return []
}

// Function to check cookie issues
export function checkCookieStatus() {
  if (process.env.NODE_ENV === "development") {
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
  return { disabled: true }
}
