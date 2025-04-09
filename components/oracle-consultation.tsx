"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import type { User } from "@supabase/supabase-js"
import { SendIcon, XCircleIcon } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import OracleResponse from "@/components/oracle-response"

interface OracleConsultationProps {
  user: User
}

export default function OracleConsultation({ user }: OracleConsultationProps) {
  const [question, setQuestion] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [response, setResponse] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showResponse, setShowResponse] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { toast } = useToast()
  const supabase = createClient()
  const abortControllerRef = useRef<AbortController | null>(null)

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    const adjustHeight = () => {
      textarea.style.height = "auto"
      textarea.style.height = `${textarea.scrollHeight}px`
    }

    textarea.addEventListener("input", adjustHeight)
    adjustHeight() // Initial adjustment

    return () => {
      textarea.removeEventListener("input", adjustHeight)
    }
  }, [])

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
    setShowResponse(true)

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

  return (
    <div className="space-y-8">
      <div className="bg-black/30 backdrop-blur-md rounded-xl border border-purple-500/20 shadow-lg shadow-purple-500/10 overflow-hidden transition-all duration-300">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="relative">
            <textarea
              ref={textareaRef}
              placeholder="Ask the oracle a question..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full bg-black/30 border-0 rounded-lg p-4 text-white placeholder:text-white/40 focus:ring-2 focus:ring-purple-500/50 resize-none min-h-[100px] transition-all duration-200"
              disabled={isLoading}
              rows={3}
            />
            {question && !isLoading && (
              <button
                type="button"
                onClick={() => setQuestion("")}
                className="absolute right-3 top-3 text-white/40 hover:text-white/70 transition-colors"
                aria-label="Clear question"
              >
                <XCircleIcon className="h-5 w-5" />
              </button>
            )}
          </div>

          <div className="mt-4 flex justify-end">
            <Button
              type="submit"
              disabled={isLoading || !question.trim()}
              className={`
                relative overflow-hidden group px-6 py-3 rounded-lg font-medium text-white
                bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500
                shadow-md hover:shadow-lg hover:shadow-purple-500/20
                transition-all duration-300 ease-out
                ${isLoading ? "opacity-80" : ""}
              `}
            >
              {/* Background shine effect */}
              <span className="absolute top-0 left-0 w-full h-full bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-[150%] transition-transform duration-1000 ease-out" />

              {isLoading ? (
                <div className="flex items-center">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <span className="ml-2">Consulting...</span>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="ml-3 text-white/70 hover:text-white"
                    aria-label="Cancel request"
                  >
                    <XCircleIcon className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center">
                  <SendIcon className="mr-2 h-4 w-4" />
                  <span>Consult Oracle</span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>

      {showResponse && (
        <div
          className={`transition-all duration-500 ${response || error || isStreaming ? "opacity-100 transform translate-y-0" : "opacity-0 transform translate-y-4"}`}
        >
          <OracleResponse
            question={question}
            response={response}
            isStreaming={isStreaming}
            error={error}
            onClose={() => setShowResponse(false)}
          />
        </div>
      )}
    </div>
  )
}
