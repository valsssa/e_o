"use client"

import { useState } from "react"

import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { LogOut, Loader2 } from "lucide-react"

export function AuthStatus() {
  const [isLoading, setIsLoading] = useState(false)
  const { user, signOut } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const handleSignOut = async () => {
    setIsLoading(true)

    try {
      await signOut()

      toast({
        title: "Signed out",
        description: "You have been successfully signed out",
      })

      router.push("/")
      router.refresh()
    } catch (error: any) {
      console.error("Error signing out:", error)

      toast({
        title: "Error signing out",
        description: error.message || "An error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) return null

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-gray-300 hidden md:inline">
        Signed in as <span className="font-medium text-purple-300">{user.email}</span>
      </span>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleSignOut}
        disabled={isLoading}
        className="text-gray-300 hover:bg-purple-900/30 hover:text-white"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Signing Out...
          </>
        ) : (
          <>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </>
        )}
      </Button>
    </div>
  )
}
