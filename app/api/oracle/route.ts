import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { llmClient } from "@/lib/llm/client"
import { getOraclePrompt, generateFallbackResponse } from "@/lib/llm/oracle-context"
import { createLogger } from "@/lib/llm/logger"
import { generateRequestId } from "@/lib/llm/request-id"
import { validateLLMConfig, logLLMConfig } from "@/lib/llm/config-validator"

// Create a logger for this API route
const logger = createLogger("OracleAPI")

// Validate LLM configuration on module load
const configValidation = validateLLMConfig()
logLLMConfig()

// This is a streaming API endpoint
export async function POST(request: Request) {
  const requestId = generateRequestId()
  const routeLogger = logger.child(requestId)

  routeLogger.info("Oracle API request received")

  // Log configuration status
  if (!configValidation.isValid) {
    routeLogger.warn("LLM configuration is incomplete", { missingVars: configValidation.missingVars })
  }

  const supabase = createClient()

  // Check authentication
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError) {
    routeLogger.error("Session error", sessionError)
    return NextResponse.json({ error: "Authentication error" }, { status: 401 })
  }

  if (!session) {
    routeLogger.warn("No session found, authentication required")
    return NextResponse.json({ error: "Authentication required" }, { status: 401 })
  }

  try {
    let requestBody
    try {
      requestBody = await request.json()
    } catch (error) {
      routeLogger.error("Error parsing request body", error)
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const { question } = requestBody

    if (!question) {
      routeLogger.warn("No question provided in request")
      return NextResponse.json({ error: "Question is required" }, { status: 400 })
    }

    routeLogger.info("Processing question", { questionLength: question.length })

    // Create a streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Check if the user has remaining questions
          // This would be implemented with the user_question_limits table

          // Get the appropriate system prompt based on the question
          const systemPrompt = getOraclePrompt(question)

          // Prepare messages for the LLM
          const messages = [
            { role: "system", content: systemPrompt },
            { role: "user", content: question },
          ]

          routeLogger.debug("Prepared messages for LLM", {
            messageCount: messages.length,
            systemPromptLength: systemPrompt.length,
          })

          // Try to generate a completion from the LLM
          try {
            // No need to update config here as it's already using environment variables
            await llmClient.generateCompletion(
              messages,
              (chunk, done) => {
                if (!done && chunk) {
                  controller.enqueue(new TextEncoder().encode(chunk))
                }

                if (done) {
                  controller.close()
                }
              },
              {
                options: {
                  temperature: 0.7,
                  top_p: 0.9,
                  max_tokens: 500,
                  timeout: 30000,
                  retries: 1,
                },
              },
            )

            routeLogger.info("LLM completion generated successfully")
          } catch (error) {
            // Handle LLM errors
            routeLogger.error("Error generating LLM completion", error)

            // Generate a fallback response
            const fallbackResponse = generateFallbackResponse(question)
            routeLogger.info("Using fallback response", { responseLength: fallbackResponse.length })

            // Simulate streaming for a better UX
            const words = fallbackResponse.split(" ")
            for (let i = 0; i < words.length; i += 3) {
              const chunk = words.slice(i, i + 3).join(" ") + " "
              controller.enqueue(new TextEncoder().encode(chunk))
              await new Promise((resolve) => setTimeout(resolve, 100))
            }

            controller.close()
          }
        } catch (error) {
          routeLogger.error("Unexpected error in stream controller", error)

          // Send a fallback response instead of failing
          const fallbackResponse =
            "The cosmic forces are in flux. The oracle cannot provide a clear answer at this time."
          controller.enqueue(new TextEncoder().encode(fallbackResponse))
          controller.close()
        }
      },
    })

    routeLogger.debug("Returning streaming response")

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache, no-transform",
        "X-Request-ID": requestId,
      },
    })
  } catch (error) {
    routeLogger.error("Oracle API error", error)
    return NextResponse.json({ error: "Failed to process your question" }, { status: 500 })
  }
}
