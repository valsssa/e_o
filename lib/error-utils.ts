/**
 * Standard error handling utilities for consistent error management
 */

/**
 * Log an error and return a standardized error object
 */
export function handleError(
  error: unknown,
  context: string,
  userMessage?: string
): { message: string; error: Error | null } {
  const isDevelopment = process.env.NODE_ENV === "development"
  const defaultMessage = "An unexpected error occurred. Please try again."
  const message = userMessage || defaultMessage
  
  // Log error to console in development
  if (isDevelopment) {
    console.error(`[${context}]`, error)
  }
  
  // Return standardized error object
  if (error instanceof Error) {
    return { message: error.message || message, error }
  }
  
  return { message, error: null }
}

/**
 * Create a standardized API error response
 */
export function createErrorResponse(
  error: unknown,
  context: string,
  status = 500,
  userMessage?: string
) {
  const { message } = handleError(error, context, userMessage)
  
  return new Response(
    JSON.stringify({
      error: message
    }),
    {
      status,
      headers: {
        "Content-Type": "application/json"
      }
    }
  )
}
