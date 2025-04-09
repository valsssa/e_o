/**
 * Utility functions for API operations
 */

/**
 * Checks if the LLM API is available
 * @returns True if the API is available, false otherwise
 */
export async function isLLMAPIAvailable(): Promise<boolean> {
  try {
    // Make a simple HEAD request to check if the API is available
    const response = await fetch("https://gpt.lazarev.cloud/ollama/v1", {
      method: "HEAD",
      signal: AbortSignal.timeout(5000), // 5 seconds timeout
    })

    return response.ok
  } catch (error) {
    console.error("[API Utils] Error checking LLM API availability:", error)
    return false
  }
}
