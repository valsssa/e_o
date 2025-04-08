"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getSupabaseClient } from "@/lib/supabase/singleton"
import { getAuthLogs, checkCookieStatus } from "@/lib/debug-utils"
import { debugAuthStorage } from "@/lib/cookie-manager"

export function AuthDebug() {
  const [isVisible, setIsVisible] = useState(false)
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  const [cookieInfo, setCookieInfo] = useState<any>(null)
  const [localStorageInfo, setLocalStorageInfo] = useState<string[]>([])
  const [authLogs, setAuthLogs] = useState<any[]>([])
  const { user, session } = useAuth()

  useEffect(() => {
    if (!isVisible) return

    const refreshData = async () => {
      try {
        // Check session
        const supabase = await getSupabaseClient()
        const { data } = await supabase.auth.getSession()
        setSessionInfo(data)

        // Check cookies
        setCookieInfo(checkCookieStatus())

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

        // Get auth logs
        setAuthLogs(getAuthLogs())
      } catch (error) {
        console.error("Error refreshing debug data:", error)
      }
    }

    refreshData()
    const intervalId = setInterval(refreshData, 5000)

    return () => {
      clearInterval(intervalId)
    }
  }, [isVisible])

  // Only show in development mode
  if (process.env.NODE_ENV !== "development") return null

  return (
    <div className="fixed bottom-2 right-2 z-50">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsVisible(!isVisible)}
        className="bg-black/70 text-white border-purple-900/50"
      >
        {isVisible ? "Hide Debug" : "Auth Debug"}
      </Button>

      {isVisible && (
        <Card className="absolute bottom-10 right-0 w-96 bg-black/70 text-white border-purple-900/50 overflow-auto max-h-[80vh]">
          <CardHeader className="p-3">
            <CardTitle className="text-sm">Authentication Debug</CardTitle>
          </CardHeader>
          <CardContent className="p-3 space-y-3">
            <div>
              <h3 className="text-xs font-bold mb-1">Auth Context:</h3>
              <div className="max-h-20 overflow-auto text-xs bg-black/30 p-2 rounded">
                <div>User: {user ? user.email : "Not logged in"}</div>
                <div>Session: {session ? "Active" : "None"}</div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold mb-1">Session Info:</h3>
              <div className="max-h-40 overflow-auto text-xs bg-black/30 p-2 rounded">
                <pre>{JSON.stringify(sessionInfo, null, 2)}</pre>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold mb-1">Cookie Status:</h3>
              <div className="max-h-40 overflow-auto text-xs bg-black/30 p-2 rounded">
                <pre>{JSON.stringify(cookieInfo, null, 2)}</pre>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold mb-1">LocalStorage:</h3>
              <div className="max-h-20 overflow-auto text-xs bg-black/30 p-2 rounded">
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

            <div>
              <h3 className="text-xs font-bold mb-1">Auth Logs:</h3>
              <div className="max-h-60 overflow-auto text-xs bg-black/30 p-2 rounded">
                <pre>{JSON.stringify(authLogs, null, 2)}</pre>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  debugAuthStorage()
                }}
                className="w-full text-xs"
              >
                Debug Storage
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Force a hard refresh
                  window.location.reload()
                }}
                className="w-full text-xs"
              >
                Force Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
