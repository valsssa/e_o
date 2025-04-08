// Add this to the global window object
declare global {
  interface Window {
    _supabaseClientCount: number
  }
}

// Initialize the counter
export function initializeClientCounter() {
  if (typeof window !== "undefined") {
    window._supabaseClientCount = window._supabaseClientCount || 0
  }
}

// Increment the counter
export function incrementClientCounter() {
  if (typeof window !== "undefined") {
    window._supabaseClientCount = (window._supabaseClientCount || 0) + 1
    console.log(`[Supabase Counter] Client count: ${window._supabaseClientCount}`)
  }
}

// Reset the counter
export function resetClientCounter() {
  if (typeof window !== "undefined") {
    window._supabaseClientCount = 0
    console.log("[Supabase Counter] Client count reset")
  }
}
