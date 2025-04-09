import { NextResponse } from "next/server"
import { llmClient } from "@/lib/llm/client"
import { createLogger } from "@/lib/llm/logger"
import { validateLLMConfig } from "@/lib/llm/config-validator"

const logger = createLogger("OracleHealthAPI")

export async function GET() {
  logger.info("Health check requested")

  // Validate configuration
  const configValidation = validateLLMConfig()

  try {
    // Check if the LLM API is available
    const isAvailable = await llmClient.isAvailable()

    return NextResponse.json({
      status: "ok",
      llm: {
        configured: configValidation.isValid,
        available: isAvailable,
        config: {
          apiBase: configValidation.config.apiBase,
          model: configValidation.config.model,
          // Don't include the API key in the response
        },
        missingVars: configValidation.missingVars,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    logger.error("Health check failed", error)

    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
        llm: {
          configured: configValidation.isValid,
          available: false,
          missingVars: configValidation.missingVars,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
