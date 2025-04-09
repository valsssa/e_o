"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useSupabase } from "@/components/supabase-provider"
import { clearSupabaseClient, debugStorageState } from "@/lib/supabase/singleton"
import { setAuthCookies, clearAuthCookies, debugAuthStorage } from "@/lib/cookie-manager"
import type { Session, User } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { logAuthEvent } from "@/lib/debug-utils"

type AuthContextType = {
  user: User | null
  session: Session | null
  isLoading: boolean
  isInitializing: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null; success: boolean }>
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: Error | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const { supabase, isLoading: isSupabaseLoading } = useSupabase()
  const router = useRouter()

  // Initialize auth state from Supabase client
  useEffect(() => {
    if (!supabase || isSupabaseLoading) return

    let isMounted = true

    const initializeAuth = async () => {
      try {
        logAuthEvent("AuthProvider: Initializing auth state", {})

        // Get initial session
        const { data } = await supabase.auth.getSession()

        if (!isMounted) return

        setSession(data.session)
        setUser(data.session?.user || null)

        logAuthEvent("AuthProvider: Initialized with session", { hasSession: !!data.session })

        // Debug storage state in development
        if (process.env.NODE_ENV === "development") {
          debugStorageState()
          debugAuthStorage()
        }
      } catch (error) {
        logAuthEvent("AuthProvider: Error initializing", { error })
      } finally {
        if (isMounted) {
          setIsInitializing(false)
        }
      }
    }

    initializeAuth()

    return () => {
      isMounted = false
    }
  }, [supabase, isSupabaseLoading])

  // Set up auth state change listener
  useEffect(() => {
    if (!supabase) return

    logAuthEvent("AuthProvider: Setting up auth state change listener", {})

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      logAuthEvent("AuthProvider: Auth state changed", { event, user: newSession?.user?.email })

      setSession(newSession)
      setUser(newSession?.user || null)

      if (event === "SIGNED_IN") {
        logAuthEvent("AuthProvider: User signed in", { email: newSession?.user?.email })

        // Ensure cookies are properly set
        if (newSession) {
          setAuthCookies(newSession.access_token, newSession.refresh_token, newSession.expires_in || 3600)
        }

        // Force a full page reload to ensure all components re-render with the new auth state
        window.location.href = "/"
      } else if (event === "SIGNED_OUT") {
        logAuthEvent("AuthProvider: User signed out", {})

        // Clear cookies and storage
        clearAuthCookies()

        // Reset client and force reload
        clearSupabaseClient()
        window.location.href = "/"
      } else if (event === "TOKEN_REFRESHED") {
        logAuthEvent("AuthProvider: Token refreshed", {})

        // Update cookies with new tokens
        if (newSession) {
          setAuthCookies(newSession.access_token, newSession.refresh_token, newSession.expires_in || 3600)
        }
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      return { error: new Error("Authentication service not initialized"), success: false }
    }

    setIsLoading(true)

    try {
      logAuthEvent("AuthProvider: Signing in user", { email })
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        logAuthEvent("AuthProvider: Sign in error", { error: error.message })
        return { error, success: false }
      }

      logAuthEvent("AuthProvider: Sign in successful", { email: data.user?.email })

      // Manually set cookies to ensure they're available immediately
      if (data.session) {
        setAuthCookies(data.session.access_token, data.session.refresh_token, data.session.expires_in || 3600)
      }

      // Don't navigate here - let the auth state change listener handle it
      return { error: null, success: true }
    } catch (error) {
      logAuthEvent("AuthProvider: Unexpected sign in error", { error })
      return { error: error as Error, success: false }
    } finally {
      setIsLoading(false)
    }
  }

  const signUp = async (email: string, password: string) => {
    if (!supabase) {
      return { error: new Error("Authentication service not initialized") }
    }

    setIsLoading(true)

    try {
      logAuthEvent("AuthProvider: Signing up user", { email })
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?verified=success`,
        },
      })

      if (error) {
        logAuthEvent("AuthProvider: Sign up error", { error: error.message })
      } else {
        logAuthEvent("AuthProvider: Sign up successful", { email })
      }

      return { error }
    } catch (error) {
      logAuthEvent("AuthProvider: Unexpected sign up error", { error })
      return { error: error as Error }
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    if (!supabase) return

    setIsLoading(true)

    try {
      logAuthEvent("AuthProvider: Signing out user", {})
      await supabase.auth.signOut()

      // Clear cookies and storage
      clearAuthCookies()

      // Reset the client to ensure a fresh instance on next login
      clearSupabaseClient()

      // Let the auth state change listener handle navigation
    } catch (error) {
      logAuthEvent("AuthProvider: Error signing out", { error })
    } finally {
      setIsLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    if (!supabase) {
      return { error: new Error("Authentication service not initialized") }
    }

    try {
      logAuthEvent("AuthProvider: Sending password reset", { email })
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      })

      return { error }
    } catch (error) {
      logAuthEvent("AuthProvider: Error resetting password", { error })
      return { error: error as Error }
    }
  }

  const value = {
    user,
    session,
    isLoading,
    isInitializing,
    signIn,
    signUp,
    signOut,
    resetPassword,
  }

  // Show loading indicator while initializing
  if (isInitializing || isSupabaseLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
        <div className="bg-black/70 p-4 rounded-lg flex items-center space-x-2">
          <Loader2 className="h-6 w-6 text-purple-500 animate-spin" />
          <span className="text-white">Initializing authentication...</span>
        </div>
      </div>
    )
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
