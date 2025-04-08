import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateStars(count: number) {
  const stars = []
  for (let i = 0; i < count; i++) {
    const size = Math.random() * 2
    const x = Math.random() * 100
    const y = Math.random() * 100
    const duration = 3 + Math.random() * 7
    const delay = Math.random() * 5
    const opacity = 0.2 + Math.random() * 0.8

    stars.push({
      id: i,
      size,
      x,
      y,
      duration,
      delay,
      opacity,
    })
  }
  return stars
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date))
}

export const generateOracleResponse = async (question: string) => {
  // This would be replaced with your actual API call
  // For now, we'll simulate a streaming response
  const responses = [
    "The cosmic energies align with your inquiry...",
    "The ancient wisdom speaks through the veil of time...",
    "The oracle contemplates your question with deep insight...",
    "The mystical forces reveal patterns in the chaos...",
    "The ethereal plane resonates with your seeking...",
  ]

  return responses[Math.floor(Math.random() * responses.length)]
}
