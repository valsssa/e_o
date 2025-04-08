"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, ArrowLeft } from "lucide-react"
import { StarsBackground } from "@/components/stars-background"
import Link from "next/link"

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const { resetPassword } = useAuth()
  const { toast } = useToast()

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await resetPassword(email)

      if (error) throw error

      setIsSubmitted(true)
      toast({
        title: "Reset link sent",
        description: "Check your email for a link to reset your password",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset link. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen cosmic-gradient relative">
      <StarsBackground />

      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md">
          <Card className="bg-black/40 backdrop-blur-md border-purple-900/50 glow">
            <CardHeader>
              <CardTitle className="text-center text-2xl font-bold">Reset Password</CardTitle>
              <CardDescription className="text-center">
                {isSubmitted
                  ? "Check your email for a password reset link"
                  : "Enter your email to receive a password reset link"}
              </CardDescription>
            </CardHeader>

            {!isSubmitted ? (
              <form onSubmit={handleResetPassword}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-black/30 border-purple-900/50"
                    />
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col space-y-2">
                  <Button type="submit" className="w-full bg-purple-700 hover:bg-purple-600" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Send Reset Link"
                    )}
                  </Button>

                  <Link
                    href="/"
                    className="text-sm text-purple-400 hover:text-purple-300 flex items-center justify-center mt-4"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Sign In
                  </Link>
                </CardFooter>
              </form>
            ) : (
              <CardContent className="space-y-6 text-center">
                <p className="text-gray-300">
                  We've sent a password reset link to <span className="font-medium text-purple-300">{email}</span>
                </p>
                <p className="text-gray-400 text-sm">
                  If you don't see the email, check your spam folder or try again with a different email address.
                </p>

                <div className="pt-4">
                  <Link href="/" className="text-purple-400 hover:text-purple-300 flex items-center justify-center">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Return to Sign In
                  </Link>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </main>
  )
}
