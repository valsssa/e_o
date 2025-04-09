/**
 * DEPRECATED: This file is being phased out.
 * Please use the Supabase client directly for authentication.
 */

// Re-export the necessary functions to maintain compatibility
import { clearSupabaseClient } from "./supabase/client"

// Compatibility function that now delegates to clearSupabaseClient
export function clearAuthCookies(): void {
  return clearSupabaseClient()
}

// No-op functions for backward compatibility
export function setAuthCookies(): void {
  console.warn("setAuthCookies is deprecated and has no effect")
}

export function getAuthTokens() {
  console.warn("getAuthTokens is deprecated and has no effect")
  return { accessToken: null, refreshToken: null }
}

export function isAuthenticated(): boolean {
  console.warn("isAuthenticated is deprecated - use supabase.auth.getSession() instead")
  return false
}

export function debugAuthStorage(): void {
  console.warn("debugAuthStorage is deprecated - use supabase auth methods instead")
}