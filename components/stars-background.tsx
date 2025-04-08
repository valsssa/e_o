"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { generateStars } from "@/lib/utils"

export function StarsBackground() {
  const [stars, setStars] = useState<any[]>([])

  useEffect(() => {
    setStars(generateStars(150))

    // Regenerate stars periodically for a dynamic effect
    const interval = setInterval(() => {
      setStars(generateStars(150))
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="stars">
      {stars.map((star) => (
        <div
          key={star.id}
          className="star"
          style={
            {
              width: `${star.size}px`,
              height: `${star.size}px`,
              left: `${star.x}%`,
              top: `${star.y}%`,
              "--duration": `${star.duration}s`,
              "--delay": `${star.delay}s`,
              "--opacity": star.opacity,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  )
}
