"use client"

import type React from "react"

import { useState } from "react"
import { useSupabase } from "@/components/supabase-provider"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Star } from "lucide-react"

interface FeedbackFormProps {
  interactionId: string
  onComplete: () => void
}

export function FeedbackForm({ interactionId, onComplete }: FeedbackFormProps) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { supabase } = useSupabase()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (rating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a rating before submitting",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // In a real app, you would create a feedback table and store the feedback
      // For this demo, we'll just show a success message

      await new Promise((resolve) => setTimeout(resolve, 500)) // Simulate API call

      toast({
        title: "Feedback submitted",
        description: "Thank you for your feedback!",
      })

      onComplete()
    } catch (error: any) {
      toast({
        title: "Error submitting feedback",
        description: error.message || "Please try again",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">Rate this response</label>
        <div className="flex space-x-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button key={star} type="button" onClick={() => setRating(star)} className="focus:outline-none">
              <Star
                className={`h-6 w-6 ${
                  rating >= star ? "text-yellow-400 fill-yellow-400" : "text-gray-500"
                } hover:text-yellow-400 transition-colors`}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">Comments (optional)</label>
        <Textarea
          placeholder="Share your thoughts about this response..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="bg-black/30 border-purple-900/50 focus:border-purple-500 resize-none"
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onComplete} className="border-purple-900/50 text-gray-300">
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || rating === 0} className="bg-purple-700 hover:bg-purple-600">
          {isSubmitting ? "Submitting..." : "Submit Feedback"}
        </Button>
      </div>
    </form>
  )
}
