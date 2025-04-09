/**
 * Utility for generating unique request IDs
 */

// Generate a random string of specified length
function randomString(length: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let result = ""
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Generate a timestamp-based ID with random suffix
export function generateRequestId(): string {
  const timestamp = Date.now().toString(36)
  const random = randomString(6)
  return `req_${timestamp}_${random}`
}
