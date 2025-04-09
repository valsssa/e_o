"use client"

import { useEffect, useRef } from "react"
import { AlertCircle, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

interface OracleResponseProps {
  question: string
  response: string
  isStreaming: boolean
  error: string | null
  onClose: () => void
}

export default function OracleResponse({ question, response, isStreaming, error, onClose }: OracleResponseProps) {
  const responseRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (responseRef.current) {
      responseRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" })
    }
  }, [response, error])

  if (error) {
    return (
      <div className="bg-red-900/20 backdrop-blur-md rounded-xl border border-red-500/30 p-6 shadow-lg animate-fade-in">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center text-red-400">
            <AlertCircle className="h-5 w-5 mr-2" />
            <h3 className="font-semibold">Error</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white/60 hover:text-white hover:bg-white/10 -mt-1 -mr-1 h-8 w-8 p-0"
            aria-label="Close response"
          >
            <XIcon className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-white/90 mb-2">{error}</p>
        <p className="text-white/60 text-sm">Please try again with a different question or try later.</p>
      </div>
    )
  }

  return (
    <div className="bg-black/30 backdrop-blur-md rounded-xl border border-purple-500/20 p-6 shadow-lg shadow-purple-500/10 animate-fade-in">
      <div className="flex justify-between items-start mb-4">
        <h3 className="font-medium text-purple-300">Your Question</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-white/60 hover:text-white hover:bg-white/10 -mt-1 -mr-1 h-8 w-8 p-0"
          aria-label="Close response"
        >
          <XIcon className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-white/80 mb-6 italic">{question}</p>

      <h3 className="font-medium text-purple-300 mb-3">Oracle's Wisdom</h3>
      <div className="prose prose-invert max-w-none">
        <div className="whitespace-pre-wrap text-white/90 min-h-[50px]">
          {response}
          {isStreaming && (
            <div className="typing-indicator inline-block ml-1">
              <span></span>
              <span></span>
              <span></span>
            </div>
          )}
          {!response && !isStreaming && <div className="text-white/50 italic">Awaiting the oracle's response...</div>}
        </div>
      </div>
      <div ref={responseRef} />
    </div>
  )
}
