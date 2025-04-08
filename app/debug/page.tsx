"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useSupabase } from "@/components/supabase-provider"
import { getAuthLogs, clearAuthLogs, checkCookieStatus } from "@/lib/debug-utils"
import { StarsBackground } from "@/components/stars-background"

// Only available in development mode
export default function DebugPage() {
  const [authLogs, setAuthLogs] = useState<any[]>([])
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  const [cookieInfo, setCookieInfo] = useState<any>(null)
  const { supabase } = useSupabase()

  useEffect(() => {
    // Only run in development mode
    if (process.env.NODE_ENV !== "development") return

    const fetchData = async () => {
      // Get auth logs
      setAuthLogs(getAuthLogs())

      // Get session info
      const { data } = await supabase.auth.getSession()
      setSessionInfo(data)

      // Check cookie status
      setCookieInfo(checkCookieStatus())
    }

    fetchData()
  }, [supabase])

  const handleClearLogs = () => {
    clearAuthLogs()
    setAuthLogs([])
  }

  const handleRefresh = async () => {
    const { data } = await supabase.auth.getSession()
    setSessionInfo(data)
    setCookieInfo(checkCookieStatus())
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    handleRefresh()
  }

  // Only show in development mode
  if (process.env.NODE_ENV !== "development") {
    return (
      <main className="min-h-screen cosmic-gradient relative">
        <StarsBackground />
        <div className="flex items-center justify-center min-h-screen p-4">
          <Card className="w-full max-w-md bg-black/40 backdrop-blur-md border-purple-900/50">
            <CardHeader>
              <CardTitle>Debug Page</CardTitle>
              <CardDescription>This page is only available in development mode.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen cosmic-gradient relative">
      <StarsBackground />
      <div className="container mx-auto px-4 py-8">
        <Card className="bg-black/40 backdrop-blur-md border-purple-900/50 mb-6">
          <CardHeader>
            <CardTitle>Authentication Debug</CardTitle>
            <CardDescription>Troubleshooting tools for authentication issues</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <Button onClick={handleRefresh} variant="outline">
                Refresh Data
              </Button>
              <Button onClick={handleClearLogs} variant="outline">
                Clear Logs
              </Button>
              <Button onClick={handleSignOut} variant="outline">
                Sign Out
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Session Info</h3>
                <pre className="bg-black/30 p-4 rounded-md overflow-auto max-h-60 text-xs">
                  {JSON.stringify(sessionInfo, null, 2)}
                </pre>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Cookie Info</h3>
                <pre className="bg-black/30 p-4 rounded-md overflow-auto max-h-60 text-xs">
                  {JSON.stringify(cookieInfo, null, 2)}
                </pre>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Auth Logs</h3>
                <pre className="bg-black/30 p-4 rounded-md overflow-auto max-h-60 text-xs">
                  {JSON.stringify(authLogs, null, 2)}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
