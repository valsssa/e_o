"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useSupabase } from "@/components/supabase-provider"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Send, Star, StarOff } from "lucide-react"
import { ResponseDisplay } from "@/components/response-display"
import { FeedbackForm } from "@/components/feedback-form"
import { saveOracleInteraction, updateOracleInteractionFavorite } from "@/lib/db-utils"

export function OracleInterface() {
  const [question, setQuestion] = useState("")
  const [response, setResponse] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const { supabase, isLoading: isSupabaseLoading } = useSupabase()
  const { user } = useAuth()
  const { toast } = useToast()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const responseRef = useRef<string>("")
  const interactionIdRef = useRef<string>("")

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [])

  const askOracle = async () => {
    if (!supabase || isSupabaseLoading || !user) {
      toast({
        title: "Service unavailable",
        description: "The oracle service is currently unavailable. Please try again later.",
        variant: "destructive",
      })
      return
    }

    if (!question.trim()) {
      toast({
        title: "Question required",
        description: "Please enter a question for the oracle",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setResponse("")
    responseRef.current = ""
    setIsTyping(false)

    try {
      // Start the streaming response
      const response = await fetch("/api/oracle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to connect to the oracle")
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error("Stream not available")

      setIsTyping(true)

      // Read the stream
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        // Decode and append the chunk
        const chunk = new TextDecoder().decode(value)
        responseRef.current += chunk
        setResponse(responseRef.current)

        // Simulate typing delay for effect
        await new Promise((resolve) => setTimeout(resolve, 30))
      }

      // Save the interaction to the database
      const { data, error } = await saveOracleInteraction(supabase, user.id, question, responseRef.current)

      if (error) throw error

      if (data) {
        interactionIdRef.current = data.id
      }

      setShowFeedback(true)
    } catch (error: any) {
      console.error("[Oracle Interface] Error consulting oracle:", error)

      toast({
        title: "Oracle connection failed",
        description: error.message || "Could not receive a response",
        variant: "destructive",
      })
      setResponse("The cosmic connection was disrupted. Please try again later.")
    } finally {
      setIsLoading(false)
      setIsTyping(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      askOracle()
    }
  }

  const toggleFavorite = async () => {
    if (!supabase || !interactionIdRef.current) return

    const newFavoriteStatus = !isFavorite
    setIsFavorite(newFavoriteStatus)

    try {
      const { success, error } = await updateOracleInteractionFavorite(
        supabase,
        interactionIdRef.current,
        newFavoriteStatus,
      )

      if (!success) throw error

      toast({
        title: newFavoriteStatus ? "Added to favorites" : "Removed from favorites",
        description: newFavoriteStatus
          ? "This oracle response has been added to your favorites"
          : "This oracle response has been removed from your favorites",
      })
    } catch (error: any) {
      console.error("[Oracle Interface] Error updating favorite status:", error)

      toast({
        title: "Error updating favorites",
        description: error.message || "Please try again",
        variant: "destructive",
      })
      setIsFavorite(!newFavoriteStatus) // Revert on error
    }
  }

  if (isSupabaseLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 text-purple-500 animate-spin" />
        <span className="ml-2 text-purple-300">Connecting to the cosmic forces...</span>
      </div>
    )
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8">
      <Card className="bg-black/40 backdrop-blur-md border-purple-900/50 glow">
        <CardContent className="p-6">
          <div className="space-y-4">
            <Textarea
              ref={textareaRef}
              placeholder="Ask the oracle a question..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[100px] bg-black/30 border-purple-900/50 focus:border-purple-500 resize-none"
              disabled={isLoading}
            />
            <div className="flex justify-end">
              <Button
                onClick={askOracle}
                disabled={isLoading || !question.trim() || isSupabaseLoading}
                className="bg-purple-700 hover:bg-purple-600"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Consulting...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Consult Oracle
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {(response || isLoading) && (
        <Card className="bg-black/40 backdrop-blur-md border-purple-900/50 glow overflow-hidden">
          <CardContent className="p-6 relative">
            <ResponseDisplay response={response} isLoading={isLoading} isTyping={isTyping} />

            {!isLoading && response && (
              <div className="mt-6 flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleFavorite}
                  className={`text-gray-300 hover:text-yellow-400 ${isFavorite ? "text-yellow-400" : ""}`}
                >
                  {isFavorite ? (
                    <>
                      <Star className="mr-2 h-4 w-4 fill-yellow-400" />
                      Favorite
                    </>
                  ) : (
                    <>
                      <StarOff className="mr-2 h-4 w-4" />
                      Add to Favorites
                    </>
                  )}
                </Button>

                {showFeedback && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFeedback(false)}
                    className="text-gray-300 hover:text-purple-400"
                  >
                    Rate Response
                  </Button>
                )}
              </div>
            )}

            {showFeedback && !isLoading && (
              <div className="mt-4">
                <FeedbackForm interactionId={interactionIdRef.current} onComplete={() => setShowFeedback(false)} />
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
