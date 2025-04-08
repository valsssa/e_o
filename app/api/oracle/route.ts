import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// This is a streaming API endpoint
export async function POST(request: Request) {
  const supabase = createClient()

  // Check authentication
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError) {
    console.error("[Oracle API] Session error:", sessionError)
    return NextResponse.json({ error: "Authentication error" }, { status: 401 })
  }

  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 })
  }

  try {
    let requestBody
    try {
      requestBody = await request.json()
    } catch (error) {
      console.error("[Oracle API] Error parsing request body:", error)
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const { question } = requestBody

    if (!question) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 })
    }

    // Create a streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Generate a mystical response based on the question
          const responses = generateMysticalResponse(question)

          // Stream the response with delays for effect
          for (const chunk of responses) {
            const encoder = new TextEncoder()
            controller.enqueue(encoder.encode(chunk))

            // Add a delay between chunks for a typing effect
            await new Promise((resolve) => setTimeout(resolve, 100))
          }

          controller.close()
        } catch (error) {
          console.error("[Oracle API] Error generating response:", error)
          controller.error(error)
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache, no-transform",
      },
    })
  } catch (error) {
    console.error("[Oracle API] Oracle API error:", error)
    return NextResponse.json({ error: "Failed to process your question" }, { status: 500 })
  }
}

function generateMysticalResponse(question: string): string[] {
  // Analyze the question to generate a more contextual response
  const questionLower = question.toLowerCase()

  // Define some response templates
  const introductions = [
    "The cosmic energies align to reveal... ",
    "The ancient wisdom speaks through the veil of time... ",
    "The oracle contemplates your inquiry with deep insight... ",
    "The mystical forces unveil patterns in the cosmic tapestry... ",
    "The ethereal plane resonates with your seeking... ",
  ]

  const midSections = [
    "As the stars shift their celestial dance, they whisper of ",
    "The threads of fate intertwine, showing ",
    "The ancient symbols illuminate ",
    "The cosmic mirror reflects ",
    "The veil between worlds thins, revealing ",
  ]

  const conclusions = [
    "Trust in the journey that unfolds before you.",
    "Embrace the wisdom that resonates within your soul.",
    "The answer you seek is already within you, waiting to be discovered.",
    "Patience will reveal what is currently hidden from view.",
    "The path forward becomes clear when you listen to your intuition.",
  ]

  // Generate a contextual response based on question keywords
  let contextualResponse = ""

  if (questionLower.includes("future") || questionLower.includes("will") || questionLower.includes("going to")) {
    contextualResponse =
      "The future is a river with many branches. I see potential paths, but your choices will determine which one manifests. "
  } else if (questionLower.includes("love") || questionLower.includes("relationship")) {
    contextualResponse =
      "The heart's journey is complex and beautiful. The connections you seek are reflected in the cosmic patterns. "
  } else if (questionLower.includes("work") || questionLower.includes("career") || questionLower.includes("job")) {
    contextualResponse =
      "Your life's work is a reflection of your inner purpose. The cosmic forces suggest alignment between passion and action. "
  } else if (questionLower.includes("health") || questionLower.includes("healing")) {
    contextualResponse = "The body and spirit are interconnected vessels. Balance in one creates harmony in the other. "
  } else if (questionLower.includes("meaning") || questionLower.includes("purpose")) {
    contextualResponse =
      "Purpose is not found but created through the alchemy of intention and action. Your unique essence contributes to the cosmic symphony. "
  }

  // Construct the full response
  const randomIntro = introductions[Math.floor(Math.random() * introductions.length)]
  const randomMid = midSections[Math.floor(Math.random() * midSections.length)]
  const randomConclusion = conclusions[Math.floor(Math.random() * conclusions.length)]

  const fullResponse = `${randomIntro}${contextualResponse}${randomMid}the patterns that guide your current journey. ${randomConclusion}`

  // Split the response into chunks for streaming
  const words = fullResponse.split(" ")
  const chunks = []
  let currentChunk = ""

  for (const word of words) {
    currentChunk += word + " "

    // Create chunks of roughly similar size
    if (currentChunk.length > 15) {
      chunks.push(currentChunk)
      currentChunk = ""
    }
  }

  // Add any remaining words
  if (currentChunk) {
    chunks.push(currentChunk)
  }

  return chunks
}
