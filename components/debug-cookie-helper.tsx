"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { debugStorageState, setSupabaseCookie } from "@/lib/supabase/singleton"

// This component is only for development use
export function DebugCookieHelper() {
  const [cookieInfo, setCookieInfo] = useState<string[]>([])
  const [localStorageInfo, setLocalStorageInfo] = useState<string[]>([])
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Only run in development mode
    if (process.env.NODE_ENV !== "development") return

    // Function to check cookies and localStorage
    const checkStorage = () => {
      try {
        // Check cookies
        const cookies = document.cookie.split(";").map((cookie) => cookie.trim())
        const supabaseCookies = cookies.filter((cookie) => cookie.startsWith("sb-"))
        setCookieInfo(supabaseCookies)

        // Check localStorage
        const storageItems: string[] = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && (key.startsWith("supabase-") || key.startsWith("sb-"))) {
            const value = localStorage.getItem(key)
            storageItems.push(`${key}: ${value ? value.substring(0, 20) + "..." : "null"}`)
          }
        }
        setLocalStorageInfo(storageItems)
      } catch (error) {
        console.error("[DebugCookieHelper] Error checking storage:", error)
      }
    }

    // Check storage initially
    checkStorage()

    // Set up interval to check storage
    const interval = setInterval(checkStorage, 2000)

    // Cleanup on unmount
    return () => {
      clearInterval(interval)
    }
  }, [])

  // Only render in development mode
  if (process.env.NODE_ENV !== "development") return null

  const handleFixCookies = () => {
    try {
      // Try to get session data from localStorage
      const sessionData = localStorage.getItem("supabase-auth-token")
      if (sessionData) {
        const parsedData = JSON.parse(sessionData)
        if (Array.isArray(parsedData) && parsedData.length >= 2) {
          const accessToken = parsedData[0]
          const refreshToken = parsedData[1]

          // Set cookies manually
          setSupabaseCookie("sb-access-token", accessToken)
          setSupabaseCookie("sb-refresh-token", refreshToken)

          console.log("[DebugCookieHelper] Manually set auth cookies from localStorage data")
          debugStorageState()
        }
      }
    } catch (error) {
      console.error("[DebugCookieHelper] Error fixing cookies:", error)
    }
  }

  const handleClearStorage = () => {
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

      console.log("[DebugCookieHelper] Cleared all Supabase storage")
      debugStorageState()
    } catch (error) {
      console.error("[DebugCookieHelper] Error clearing storage:", error)
    }
  }

  return (
    <div className="fixed bottom-2 left-2 z-50">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsVisible(!isVisible)}
        className="bg-black/70 text-white border-purple-900/50"
      >
        {isVisible ? "Hide" : "Debug Cookies"}
      </Button>

      {isVisible && (
        <Card className="absolute bottom-10 left-0 w-80 bg-black/70 text-white border-purple-900/50">
          <CardHeader className="p-3">
            <CardTitle className="text-sm">Supabase Storage Debug</CardTitle>
          </CardHeader>
          <CardContent className="p-3 space-y-3">
            <div>
              <h3 className="text-xs font-bold mb-1">Cookies:</h3>
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

            <div>
              <h3 className="text-xs font-bold mb-1">LocalStorage:</h3>
              <div className="max-h-20 overflow-auto text-xs">
                {localStorageInfo.length > 0 ? (
                  localStorageInfo.map((item, index) => (
                    <div key={index} className="truncate">
                      {item}
                    </div>
                  ))
                ) : (
                  <div>No Supabase localStorage items found</div>
                )}
              </div>
            </div>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleFixCookies}
                className="text-xs bg-purple-900/30 border-purple-900/50 hover:bg-purple-900/50"
              >
                Fix Cookies
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearStorage}
                className="text-xs bg-red-900/30 border-red-900/50 hover:bg-red-900/50"
              >
                Clear All
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
