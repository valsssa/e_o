"use client"

import { useEffect, useRef } from "react"
import { Loader2 } from "lucide-react"

interface ResponseDisplayProps {
  response: string
  isLoading: boolean
  isTyping: boolean
}

export function ResponseDisplay({ response, isLoading, isTyping }: ResponseDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [response])

  if (isLoading && !response) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center text-gray-400">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p>Consulting the cosmic forces...</p>
        <p className="text-sm mt-2">The oracle is contemplating your question</p>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="prose prose-invert max-w-none">
      <h3 className="text-xl font-semibold mb-4 text-purple-300">Oracle's Response</h3>
      <div className="oracle-text-appear">
        {response.split("\n").map((paragraph, index) => (
          <p key={index} className="mb-4 leading-relaxed">
            {paragraph}
          </p>
        ))}
        {isTyping && <span className="typing-cursor" />}
      </div>
    </div>
  )
}
