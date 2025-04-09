"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { HomeIcon, UserIcon, LogOutIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"

export default function Navbar() {
  const pathname = usePathname()
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function getUser() {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
      setLoading(false)
    }
    getUser()
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = "/login"
  }

  if (loading) return null

  if (!user) return null

  return (
    <header className="w-full py-3 px-4 sm:px-6 bg-black/20 backdrop-blur-md border-b border-white/10 relative z-20">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="text-white font-bold text-xl">
          Esoteric Oracle
        </Link>

        <nav className="flex items-center gap-2">
          <Link
            href="/"
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              pathname === "/" ? "bg-purple-700/50 text-white" : "text-white/70 hover:text-white hover:bg-white/10"
            }`}
          >
            <span className="flex items-center gap-2">
              <HomeIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Oracle</span>
            </span>
          </Link>

          <Link
            href="/profile"
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              pathname === "/profile"
                ? "bg-purple-700/50 text-white"
                : "text-white/70 hover:text-white hover:bg-white/10"
            }`}
          >
            <span className="flex items-center gap-2">
              <UserIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </span>
          </Link>

          <div className="text-white/50 text-sm hidden md:block ml-4">Signed in as {user.email}</div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="ml-2 text-white/70 hover:text-white hover:bg-white/10"
          >
            <LogOutIcon className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </nav>
      </div>
    </header>
  )
}
