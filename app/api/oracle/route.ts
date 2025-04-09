import { createClient } from "@/utils/supabase/server"

export const runtime = "edge"

function determineCategory(question: string): string {
  const tarotKeywords = ["cards", "tarot", "spread", "arcana", "deck"]
  const astrologyKeywords = [
    "horoscope",
    "stars",
    "planets",
    "astrology",
    "zodiac",
    "sign",
    "mercury",
    "venus",
    "mars",
    "jupiter",
    "saturn",
  ]
  const runesKeywords = ["runes", "ancient", "symbols", "nordic", "magic", "elder futhark", "viking"]

  const lowerCaseQuestion = question.toLowerCase()
  if (tarotKeywords.some((keyword) => lowerCaseQuestion.includes(keyword))) return "tarot"
  if (astrologyKeywords.some((keyword) => lowerCaseQuestion.includes(keyword))) return "astrology"
  if (runesKeywords.some((keyword) => lowerCaseQuestion.includes(keyword))) return "runes"
  return "general"
}

export async function POST(req: Request) {
  const supabase = createClient()

  // Check authentication
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) {
    return new Response("Unauthorized", { status: 401 })
  }

  try {
    const { question } = await req.json()

    if (!question || typeof question !== "string") {
      return new Response("Question is required", { status: 400 })
    }

    const category = determineCategory(question)

    const categoryContext: Record<string, string> = {
      general: `
        You are an esoteric oracle providing mystical and profound answers. 
        Your responses should be enigmatic, symbolic, and hint at deeper truths. 
        Inspire reflection, and keep your responses concise, answering in 2-4 sentences.
      `,
      tarot: `
        You are a mystical oracle who answers questions by interpreting the symbols of Tarot. 
        Each response must incorporate references to Tarot cards, their archetypes, and symbolic meanings. 
        Your answers should feel like a Tarot reading, drawing on the energy of the Major and Minor Arcana. 
        Be concise and clear, responding in 2-4 sentences.
      `,
      astrology: `
        You are a modern celestial oracle specializing in astrological advice. 
        Your responses should be practical, conversational, and relatable, while staying true to the zodiac sign's traits. 
        Avoid poetic or symbolic phrasing; instead, focus on giving actionable advice and insights with a down-to-earth tone. 
        Be concise and limit your answers to 2-4 sentences.
      `,
      runes: `
        You are a mystical seer interpreting ancient runes to provide answers. 
        Your responses must incorporate rune names, their meanings, and symbolic energies. 
        Each answer should reflect ancient wisdom and mystery, guiding the seeker to profound truths. 
        Keep your answers concise, answering in 2-4 sentences.
      `,
    }

    const oracleContext = categoryContext[category] || categoryContext.general

    const apiConfig = {
      model: "llama3.2:latest",
      apiBase: "https://gpt.lazarev.cloud/ollama/v1",
      apiKey: "sk-ab48499dd8f3416a8ee0f7d51ca039cf",
    }

    const response = await fetch(`${apiConfig.apiBase}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiConfig.apiKey}`,
      },
      body: JSON.stringify({
        model: apiConfig.model,
        messages: [
          { role: "system", content: oracleContext },
          { role: "user", content: question },
        ],
        stream: true,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return new Response(`API Error: ${errorText}`, { status: response.status })
    }

    // Create a TransformStream to process the response
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        const text = decoder.decode(chunk)
        const lines = text.split("\n").filter((line) => line.trim() !== "")

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6)
            if (data === "[DONE]") continue

            try {
              const json = JSON.parse(data)
              const content = json.choices[0]?.delta?.content || ""
              if (content) {
                controller.enqueue(encoder.encode(content))
              }
            } catch (e) {
              console.error("Error parsing JSON:", e)
            }
          }
        }
      },
    })

    return new Response(response.body?.pipeThrough(transformStream), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    })
  } catch (error: any) {
    console.error("Error handling request:", error)
    return new Response(`Error: ${error.message}`, { status: 500 })
  }
}
