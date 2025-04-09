"use client"

import type React from "react"

import { useState, useRef } from "react"
import type { User } from "@supabase/supabase-js"
import { SendIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import OracleResponse from "@/components/oracle-response"
import { createClient } from "@/utils/supabase/client"

interface OracleInputProps {
  user: User
}

export default function OracleInput({ user }: OracleInputProps) {
  const [question, setQuestion] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [response, setResponse] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const supabase = createClient()
  const abortControllerRef = useRef<AbortController | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!question.trim()) {
      toast({
        title: "Empty question",
        description: "Please enter a question to receive wisdom",
        variant: "destructive",
      })
      return
    }

    // Reset states
    setIsLoading(true)
    setResponse("")
    setIsStreaming(true)
    setError(null)

    // Create a new AbortController for this request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    try {
      const response = await fetch("/api/oracle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || `Server error: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error("Response body is null")
      }

      const decoder = new TextDecoder()
      let accumulatedResponse = ""

      while (true) {
        const { value, done } = await reader.read()

        if (done) {
          break
        }

        const chunkText = decoder.decode(value, { stream: true })
        accumulatedResponse += chunkText
        setResponse(accumulatedResponse)
      }

      // Save the interaction to Supabase
      await supabase.from("interactions").insert({
        user_id: user.id,
        question,
        response: accumulatedResponse,
      })
    } catch (error: any) {
      // Don't show abort errors (they happen when user cancels)
      if (error.name !== "AbortError") {
        const errorMessage = error.message || "Failed to get a response from the oracle"
        setError(errorMessage)
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
      setIsStreaming(false)
      abortControllerRef.current = null
    }
  }

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsLoading(false)
    setIsStreaming(false)
    toast({
      title: "Request cancelled",
      description: "You've cancelled the oracle's response",
    })
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = "/login"
  }

  return (
    <div className="space-y-8">
      <Card className="p-6 bg-black/20 backdrop-blur-sm border-white/10">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            placeholder="Ask the oracle a question..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="min-h-24 bg-black/20 border-white/20 text-white placeholder:text-white/50"
            disabled={isLoading}
          />
          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handleSignOut}
              className="text-white/70 border-white/20 hover:bg-white/10 hover:text-white"
              disabled={isLoading}
            >
              Sign Out
            </Button>
            <div className="flex gap-2">
              {isLoading && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleCancel}
                  className="bg-red-900/50 hover:bg-red-900/70 border-none"
                >
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={isLoading} className="bg-white/10 hover:bg-white/20 text-white">
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                ) : (
                  <>
                    <SendIcon className="mr-2 h-4 w-4" /> Ask Oracle
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </Card>

      {(response || isStreaming || error) && (
        <OracleResponse response={response} isStreaming={isStreaming} error={error} />
      )}
    </div>
  )
}
