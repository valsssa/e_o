"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { getSupabaseClient } from "@/lib/supabase/singleton"
import type { SupabaseClient } from "@supabase/supabase-js"
import { logAuthEvent } from "@/lib/debug-utils"

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
        logAuthEvent("SupabaseProvider: Initializing Supabase client", {})
        const client = await getSupabaseClient()

        if (isMounted) {
          setSupabase(client)
          setIsLoading(false)
          logAuthEvent("SupabaseProvider: Supabase client initialized", {})
        }
      } catch (error) {
        logAuthEvent("SupabaseProvider: Error initializing Supabase client", { error })
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
