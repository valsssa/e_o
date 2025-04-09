// components/supabase-provider.tsx
"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import * as AuthService from "@/lib/auth-service" // Use the new auth service
import type { SupabaseClient } from "@supabase/supabase-js"

type SupabaseContext = {
  supabase: SupabaseClient | null
  isLoading: boolean
}

const Context = createContext<SupabaseContext | undefined>(undefined)

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const initializeSupabase = async () => {
      try {
        if (process.env.NODE_ENV === "development") {
          console.log("SupabaseProvider: Initializing Supabase client")
        }
        
        // Use the auth service to get the client
        const client = AuthService.createClient()

        if (isMounted) {
          setSupabase(client)
          setIsLoading(false)
          if (process.env.NODE_ENV === "development") {
            console.log("SupabaseProvider: Supabase client initialized")
          }
        }
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("SupabaseProvider: Error initializing Supabase client", error)
        }
        
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    initializeSupabase()

    return () => {
      isMounted = false
    }
  }, [])

  return <Context.Provider value={{ supabase, isLoading }}>{children}</Context.Provider>
}

export const useSupabase = () => {
  const context = useContext(Context)
  if (context === undefined) {
    throw new Error("useSupabase must be used inside SupabaseProvider")
  }
  return context
}