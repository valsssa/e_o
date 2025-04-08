"use client"

import { useEffect, useState } from "react"
import { useSupabase } from "@/components/supabase-provider"

// This component is only for development use
export function DebugMonitor() {
  const [instanceCount, setInstanceCount] = useState(0)
  const [cookieInfo, setCookieInfo] = useState<string[]>([])
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  const { supabase, isLoading } = useSupabase()

  useEffect(() => {
    // Only run in development mode
    if (process.env.NODE_ENV !== "development") return

    // Function to check cookies
    const checkCookies = () => {
      try {
        const cookies = document.cookie.split(";").map((cookie) => cookie.trim())
        const supabaseCookies = cookies.filter((cookie) => cookie.startsWith("sb-"))
        setCookieInfo(supabaseCookies)
      } catch (error) {
        console.error("[DebugMonitor] Error checking cookies:", error)
      }
    }

    // Check cookies initially
    checkCookies()

    // Set up interval to check cookies
    const cookieInterval = setInterval(checkCookies, 2000)

    // Function to check session
    const checkSession = async () => {
      if (!supabase) return

      try {
        const { data, error } = await supabase.auth.getSession()
        if (error) {
          console.error("[DebugMonitor] Error getting session:", error)
          return
        }

        setSessionInfo({
          hasSession: !!data.session,
          expiresAt: data.session?.expires_at,
          user: data.session?.user?.email,
        })
      } catch (error) {
        console.error("[DebugMonitor] Error checking session:", error)
      }
    }

    // Check session initially
    if (supabase) {
      checkSession()
    }

    // Set up interval to check session
    const sessionInterval = setInterval(() => {
      if (supabase) {
        checkSession()
      }
    }, 5000)

    // Get instance counter from singleton
    const updateInstanceCount = async () => {
      try {
        // Import dynamically to avoid circular dependencies
        const { instanceCounter } = await import("@/lib/supabase/singleton")
        setInstanceCount(instanceCounter)
      } catch (err) {
        console.error("[DebugMonitor] Error getting instance counter:", err)
      }
    }

    // Update instance count initially
    updateInstanceCount()

    // Set up interval to update instance count
    const countInterval = setInterval(updateInstanceCount, 2000)

    // Cleanup on unmount
    return () => {
      clearInterval(cookieInterval)
      clearInterval(sessionInterval)
      clearInterval(countInterval)
    }
  }, [supabase])

  // Only render in development mode
  if (process.env.NODE_ENV !== "development") return null

  return (
    <div className="fixed bottom-2 right-2 bg-black/70 text-white text-xs p-2 rounded-md z-50 max-w-xs">
      <div className="mb-1">GoTrueClient instances: {instanceCount}</div>
      <div className="mb-1">Supabase loaded: {isLoading ? "No" : "Yes"}</div>

      <div className="mb-1">Session info:</div>
      <div className="max-h-20 overflow-auto text-xs mb-2">
        {sessionInfo ? (
          <div>
            <div>Has session: {sessionInfo.hasSession ? "Yes" : "No"}</div>
            {sessionInfo.hasSession && (
              <>
                <div>User: {sessionInfo.user}</div>
                <div>Expires: {new Date(sessionInfo.expiresAt * 1000).toLocaleString()}</div>
              </>
            )}
          </div>
        ) : (
          <div>No session info available</div>
        )}
      </div>

      <div className="mb-1">Supabase cookies:</div>
      <div className="max-h-20 overflow-auto text-xs">
        {cookieInfo.length > 0 ? (
          cookieInfo.map((cookie, index) => (
            <div key={index} className="truncate">
              {cookie}
            </div>
          ))
        ) : (
          <div>No Supabase cookies found</div>
        )}
      </div>
    </div>
  )
}
