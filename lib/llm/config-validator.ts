/**
 * Utility to validate LLM configuration
 */

import { createLogger } from "./logger"

const logger = createLogger("ConfigValidator")

/**
 * Validates that all required environment variables are set
 * @returns Object containing validation results
 */
export function validateLLMConfig(): {
  isValid: boolean
  missingVars: string[]
  config: {
    apiBase: string | null
    apiKey: string | null
    model: string | null
  }
} {
  const requiredVars = ["LLM_API_KEY", "LLM_API_BASE", "LLM_MODEL"]
  const missingVars: string[] = []

  // Check each required variable
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missingVars.push(varName)
    }
  }

  const isValid = missingVars.length === 0

  // Log the validation results
  if (!isValid) {
    logger.warn(`Missing required environment variables: ${missingVars.join(", ")}`)
  } else {
    logger.info("All required environment variables are set")
  }

  return {
    isValid,
    missingVars,
    config: {
      apiBase: process.env.LLM_API_BASE || null,
      apiKey: process.env.LLM_API_KEY || null,
      model: process.env.LLM_MODEL || null,
    },
  }
}

/**
 * Logs the current LLM configuration (with sensitive data redacted)
 */
export function logLLMConfig(): void {
  logger.info("Current LLM configuration:", {
    apiBase: process.env.LLM_API_BASE || "(not set)",
    apiKey: process.env.LLM_API_KEY ? "********" : "(not set)",
    model: process.env.LLM_MODEL || "(not set)",
  })
}
