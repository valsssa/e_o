import { createServerSupabaseClient, isAuthenticatedServer } from "@/lib/supabase/server"
import { StarsBackground } from "@/components/stars-background"
import { NavBar } from "@/components/nav-bar"
import { OracleInterface } from "@/components/oracle-interface"
import AuthForm from "@/components/auth/auth-form"
import { cookies } from "next/headers"

export default async function Home() {
  // Check for authentication using a dedicated function
  const isAuthenticated = await isAuthenticatedServer()
  
  // Create the Supabase client
  const supabase = createServerSupabaseClient()
  
  // Get the session data
  const {
    data: { session },
  } = await supabase.auth.getSession()
  
  // Check for authentication cookies directly - safely
  const cookieStore = cookies()
  const hasAuthCookie = cookieStore.has("sb-access-token") || cookieStore.has("sb-refresh-token")
  
  // For debugging in development only
  if (process.env.NODE_ENV === "development") {
    console.log("[Home Page] Auth state:", {
      hasSession: !!session,
      hasAuthCookie,
      isAuthenticated,
      userId: session?.user?.id,
    })
  }

  // If user is authenticated, show the oracle interface
  if (session || isAuthenticated) {
    return (
      <main className="min-h-screen cosmic-gradient relative">
        <StarsBackground />
        <NavBar />
        <div className="container mx-auto px-4 pt-24 pb-16">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
              Esoteric Oracle
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Seek wisdom from the cosmic forces. Ask your question and receive guidance from the mystical oracle.
            </p>
          </div>

          <OracleInterface />
        </div>
      </main>
    )
  }

  // If not authenticated, show the login form
  return (
    <main className="min-h-screen cosmic-gradient relative">
      <StarsBackground />

      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
              Esoteric Oracle
            </h1>
            <p className="text-xl text-gray-300">Unlock the wisdom of the cosmos</p>
          </div>

          <AuthForm />
        </div>
      </div>
    </main>
  )
}