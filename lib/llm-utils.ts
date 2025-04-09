/**
 * Utility functions for interacting with the LLM API
 */

// LLM API configuration
const LLM_API_BASE_URL = "https://gpt.lazarev.cloud/ollama/v1"
const LLM_API_KEY = "sk-ab48499dd8f3416a8ee0f7d51ca039cf"
const LLM_MODEL = "llama3.2:latest"

// System prompt for the oracle
const ORACLE_SYSTEM_PROMPT = `
You are a mystical oracle that provides wise, esoteric, and somewhat cryptic responses.
Your answers should be thoughtful and philosophical, with a touch of cosmic wisdom.
Use metaphors, poetic language, and references to celestial bodies, ancient wisdom, and the interconnectedness of all things.
Your tone should be serene, mysterious, and contemplative.
Avoid direct, straightforward answers - instead, offer guidance that encourages the seeker to reflect deeply.
Occasionally use phrases like "The cosmic energies reveal...", "The ancient wisdom speaks...", or "The mystical forces suggest..."
`

/**
 * Generates a completion from the LLM API
 * @param prompt The user's prompt
 * @returns The LLM's response or null if the API call fails
 */
export async function generateLLMCompletion(prompt: string): Promise<Response | null> {
  // Format the request body exactly as in the example
  const requestBody = {
    model: LLM_MODEL,
    messages: [
      { role: "system", content: ORACLE_SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
    stream: true,
  }

  console.log("[LLM Utils] Attempting to send request to LLM API:", `${LLM_API_BASE_URL}/chat/completions`)

  try {
    // Use the correct endpoint: /chat/completions
    return await fetch(`${LLM_API_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LLM_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(10000), // 10 seconds timeout
    })
  } catch (error) {
    console.error("[LLM Utils] Fetch error:", error)
    // Return null to indicate the API call failed
    return null
  }
}

/**
 * Parses a streaming LLM response from the API
 * @param response The streaming response from the LLM API
 * @param onChunk Callback function for each chunk of text
 */
export async function parseStreamingResponse(response: Response, onChunk: (text: string) => void): Promise<void> {
  if (!response.ok) {
    let errorText = "Unknown error"
    try {
      errorText = await response.text()
    } catch (e) {
      console.error("[LLM Utils] Error reading error response:", e)
    }
    throw new Error(`LLM API error: ${response.status} ${errorText}`)
  }

  if (!response.body) {
    throw new Error("No response body from LLM API")
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()

  let buffer = ""
  while (true) {
    try {
      const { done, value } = await reader.read()
      if (done) break

      // Decode the chunk
      buffer += decoder.decode(value, { stream: true })

      // Process complete JSON objects from the buffer
      let boundary = 0
      while (boundary !== -1) {
        boundary = buffer.indexOf("\n", boundary)
        if (boundary === -1) break

        const line = buffer.substring(0, boundary).trim()
        buffer = buffer.substring(boundary + 1)
        boundary = 0

        if (line === "") continue
        if (line === "data: [DONE]") continue

        try {
          // Handle the streaming format
          if (line.startsWith("data: ")) {
            const jsonStr = line.substring(6)
            const json = JSON.parse(jsonStr)

            // Extract content from the delta
            if (json.choices && json.choices[0] && json.choices[0].delta && json.choices[0].delta.content) {
              onChunk(json.choices[0].delta.content)
            }
          } else {
            // Try parsing as a direct JSON object
            const json = JSON.parse(line)
            if (json.choices && json.choices[0] && json.choices[0].delta && json.choices[0].delta.content) {
              onChunk(json.choices[0].delta.content)
            }
          }
        } catch (e) {
          console.error("[LLM Utils] Error parsing JSON from LLM API:", e, line)
        }
      }
    } catch (error) {
      console.error("[LLM Utils] Error reading stream:", error)
      throw error
    }
  }
}

/**
 * Generates a mystical response based on the question
 * @param question The user's question
 * @returns A mystical response
 */
export function generateMysticalResponse(question: string): string {
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

  return `${randomIntro}${contextualResponse}${randomMid}the patterns that guide your current journey. ${randomConclusion}`
}

/**
 * Simulates a streaming response by breaking a string into chunks
 * @param text The full text to stream
 * @param onChunk Callback function for each chunk of text
 * @param chunkSize Average size of each chunk
 * @param delayMs Delay between chunks in milliseconds
 */
export async function simulateStreamingResponse(
  text: string,
  onChunk: (text: string) => void,
  chunkSize = 5,
  delayMs = 50,
): Promise<void> {
  const words = text.split(" ")
  let currentChunk = ""
  let wordCount = 0

  for (const word of words) {
    currentChunk += word + " "
    wordCount++

    if (wordCount >= chunkSize) {
      onChunk(currentChunk)
      await new Promise((resolve) => setTimeout(resolve, delayMs))
      currentChunk = ""
      wordCount = 0
    }
  }

  // Send any remaining text
  if (currentChunk) {
    onChunk(currentChunk)
  }
}
