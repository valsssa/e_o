"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StarsBackground } from "@/components/stars-background"
import { Loader2, CheckCircle2, XCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function VerifyPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("Verifying your email...")
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const token = searchParams.get("token")
    const type = searchParams.get("type")

    if (type === "email_confirmation" && token) {
      // Email verification was successful
      setStatus("success")
      setMessage("Your email has been successfully verified!")

      // Redirect to sign in page after a delay
      setTimeout(() => {
        router.push("/?verified=success")
      }, 3000)
    } else {
      // Invalid or missing parameters
      setStatus("error")
      setMessage("Invalid verification link. Please request a new verification email.")
    }
  }, [searchParams, router])

  return (
    <main className="min-h-screen cosmic-gradient relative">
      <StarsBackground />

      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md">
          <Card className="bg-black/40 backdrop-blur-md border-purple-900/50 glow">
            <CardHeader>
              <CardTitle className="text-center text-2xl font-bold">Email Verification</CardTitle>
              <CardDescription className="text-center">
                {status === "loading"
                  ? "Verifying your email address"
                  : status === "success"
                    ? "Verification successful"
                    : "Verification failed"}
              </CardDescription>
            </CardHeader>

            <CardContent className="flex flex-col items-center justify-center py-6 space-y-4">
              {status === "loading" && <Loader2 className="h-16 w-16 text-purple-500 animate-spin" />}

              {status === "success" && <CheckCircle2 className="h-16 w-16 text-green-500" />}

              {status === "error" && <XCircle className="h-16 w-16 text-red-500" />}

              <p className="text-center text-lg mt-4">{message}</p>

              {status === "error" && (
                <Button asChild className="mt-4 bg-purple-700 hover:bg-purple-600">
                  <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Return to Sign In
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
