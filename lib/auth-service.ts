// lib/auth-service.ts
import { createBrowserClient } from "@supabase/ssr";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient, Session, User, AuthError } from "@supabase/supabase-js";

// Cookie constants
const ACCESS_TOKEN_COOKIE = "sb-access-token";
const REFRESH_TOKEN_COOKIE = "sb-refresh-token";
const SESSION_COOKIE_OPTIONS = {
  path: "/",
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  httpOnly: true, // Prevents JavaScript access
  maxAge: 60 * 60 * 24 * 7, // 7 days
};

// For debugging in development only
const isDev = process.env.NODE_ENV === "development";

// Singleton instance for browser client
let supabaseClientInstance: SupabaseClient | null = null;

/**
 * Create a browser Supabase client (for client components)
 */
export function createClient(): SupabaseClient {
  if (supabaseClientInstance) {
    return supabaseClientInstance;
  }

  if (isDev) {
    console.log("[Auth Service] Creating new browser client");
  }

  supabaseClientInstance = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const cookies = document.cookie.split(";").map((c) => c.trim());
          const cookie = cookies.find((c) => c.startsWith(`${name}=`));
          return cookie ? decodeURIComponent(cookie.split("=")[1]) : undefined;
        },
        set(name: string, value: string, options: any) {
          document.cookie = `${name}=${encodeURIComponent(value)}; ${Object.entries(options)
            .map(([key, value]) => `${key}=${value}`)
            .join("; ")}`;
        },
        remove(name: string, options: any) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; ${Object.entries(options)
            .map(([key, value]) => `${key}=${value}`)
            .join("; ")}`;
        },
      },
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
      cookieOptions: SESSION_COOKIE_OPTIONS,
      debug: isDev,
    }
  );

  // Listen for auth state changes
  supabaseClientInstance.auth.onAuthStateChange((event, session) => {
    if (isDev) {
      console.log(`[Auth Service] Auth state changed: ${event}`);
    }

    // Manually update cookies on auth events
    if (event === "SIGNED_IN" && session) {
      setCookies(session.access_token, session.refresh_token);
    } else if (event === "SIGNED_OUT") {
      clearCookies();
    } else if (event === "TOKEN_REFRESHED" && session) {
      setCookies(session.access_token, session.refresh_token);
    }
  });

  return supabaseClientInstance;
}

/**
 * Create a server Supabase client (for server components and API routes)
 */
export function createServerSupabaseClient(): SupabaseClient {
  if (isDev) {
    console.log("[Auth Service] Creating server client");
  }
  
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          try {
            return cookieStore.get(name)?.value;
          } catch (error) {
            if (isDev) {
              console.error(`[Auth Service] Error getting cookie: ${name}`, error);
            }
            return undefined;
          }
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            if (isDev) {
              console.error(`[Auth Service] Error setting cookie: ${name}`, error);
            }
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: "", ...options, maxAge: 0 });
          } catch (error) {
            if (isDev) {
              console.error(`[Auth Service] Error removing cookie: ${name}`, error);
            }
          }
        },
      },
    }
  );
}

/**
 * Check if a user is authenticated on the server
 */
export async function isAuthenticatedServer(): Promise<boolean> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error("[Auth Service] Error checking authentication:", error);
      return false;
    }

    return !!data.session;
  } catch (error) {
    console.error("[Auth Service] Unexpected error checking authentication:", error);
    return false;
  }
}

/**
 * Handle user sign-in
 */
export async function signIn(email: string, password: string): Promise<{ 
  error: AuthError | Error | null; 
  success: boolean;
  user: User | null;
}> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return { error, success: false, user: null };
    }

    // Manually set cookies to ensure they're available immediately
    if (data.session) {
      setCookies(data.session.access_token, data.session.refresh_token);
    }

    return { error: null, success: true, user: data.user };
  } catch (error) {
    return { error: error as Error, success: false, user: null };
  }
}

/**
 * Handle user sign-up
 */
export async function signUp(email: string, password: string, options?: { 
  redirectTo?: string 
}): Promise<{ error: AuthError | Error | null }> {
  try {
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: options?.redirectTo || `${window.location.origin}/auth/callback?verified=success`,
      },
    });

    return { error };
  } catch (error) {
    return { error: error as Error };
  }
}

/**
 * Handle user sign-out
 */
export async function signOut(): Promise<void> {
  try {
    const supabase = createClient();
    await supabase.auth.signOut();
    
    // Clear cookies and client
    clearCookies();
    clearClient();
  } catch (error) {
    console.error("[Auth Service] Error signing out:", error);
  }
}

/**
 * Handle password reset request
 */
export async function resetPassword(email: string): Promise<{ error: AuthError | Error | null }> {
  try {
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    });

    return { error };
  } catch (error) {
    return { error: error as Error };
  }
}

/**
 * Update user's password
 */
export async function updatePassword(password: string): Promise<{ error: AuthError | Error | null }> {
  try {
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    return { error };
  } catch (error) {
    return { error: error as Error };
  }
}

/**
 * Get current session
 */
export async function getSession(): Promise<{ session: Session | null; error: AuthError | null }> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.auth.getSession();

    return { session: data.session, error };
  } catch (error) {
    console.error("[Auth Service] Error getting session:", error);
    return { session: null, error: null };
  }
}

/**
 * Get current user
 */
export async function getUser(): Promise<{ user: User | null; error: AuthError | null }> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.auth.getUser();

    return { user: data.user, error };
  } catch (error) {
    console.error("[Auth Service] Error getting user:", error);
    return { user: null, error: null };
  }
}

/**
 * Listen for auth state changes
 */
export function onAuthStateChange(callback: (event: string, session: Session | null) => void) {
  const supabase = createClient();
  const { data } = supabase.auth.onAuthStateChange(callback);
  return data.subscription;
}

// Helper functions

/**
 * Set authentication cookies
 */
function setCookies(accessToken: string, refreshToken: string): void {
  try {
    if (isDev) {
      console.log("[Auth Service] Setting auth cookies");
    }

    // Set access token cookie
    document.cookie = `${ACCESS_TOKEN_COOKIE}=${encodeURIComponent(accessToken)}; path=${
      SESSION_COOKIE_OPTIONS.path
    }; max-age=${SESSION_COOKIE_OPTIONS.maxAge}; ${
      SESSION_COOKIE_OPTIONS.secure ? "secure; " : ""
    }samesite=${SESSION_COOKIE_OPTIONS.sameSite}`;

    // Set refresh token cookie
    document.cookie = `${REFRESH_TOKEN_COOKIE}=${encodeURIComponent(refreshToken)}; path=${
      SESSION_COOKIE_OPTIONS.path
    }; max-age=${SESSION_COOKIE_OPTIONS.maxAge}; ${
      SESSION_COOKIE_OPTIONS.secure ? "secure; " : ""
    }samesite=${SESSION_COOKIE_OPTIONS.sameSite}`;

    // Store in localStorage as fallback if cookies are blocked
    try {
      localStorage.setItem(`supabase-${ACCESS_TOKEN_COOKIE}`, accessToken);
      localStorage.setItem(`supabase-${REFRESH_TOKEN_COOKIE}`, refreshToken);
    } catch (e) {
      // Ignore localStorage errors (e.g., in incognito mode)
    }
  } catch (error) {
    console.error("[Auth Service] Error setting cookies:", error);
  }
}

/**
 * Clear authentication cookies
 */
function clearCookies(): void {
  try {
    if (isDev) {
      console.log("[Auth Service] Clearing auth cookies");
    }

    // Clear all Supabase cookies
    document.cookie = `${ACCESS_TOKEN_COOKIE}=; path=${SESSION_COOKIE_OPTIONS.path}; expires=Thu, 01 Jan 1970 00:00:00 GMT;`;
    document.cookie = `${REFRESH_TOKEN_COOKIE}=; path=${SESSION_COOKIE_OPTIONS.path}; expires=Thu, 01 Jan 1970 00:00:00 GMT;`;

    // Clear localStorage items related to Supabase
    try {
      localStorage.removeItem(`supabase-${ACCESS_TOKEN_COOKIE}`);
      localStorage.removeItem(`supabase-${REFRESH_TOKEN_COOKIE}`);
      
      // Also clear any other Supabase items
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith("supabase-") || key.startsWith("sb-"))) {
          localStorage.removeItem(key);
        }
      }
    } catch (e) {
      // Ignore localStorage errors
    }
  } catch (error) {
    console.error("[Auth Service] Error clearing cookies:", error);
  }
}

/**
 * Clear the Supabase client instance
 */
function clearClient(): void {
  supabaseClientInstance = null;
}

/**
 * Debug function to log all cookies and storage (only for development)
 */
export function debugAuthStorage(): void {
  if (!isDev) return;

  console.group("=== AUTH STORAGE DEBUG ===");

  // Log cookies
  console.log("--- Cookies ---");
  const cookies = document.cookie.split(";").map((cookie) => cookie.trim());
  if (cookies.length === 1 && cookies[0] === "") {
    console.log("No cookies found");
  } else {
    cookies.forEach((cookie) => console.log(cookie));
  }

  // Log localStorage
  console.log("--- LocalStorage ---");
  let hasAuthItems = false;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith("supabase-") || key.startsWith("sb-"))) {
      const value = localStorage.getItem(key);
      console.log(`${key}: ${value ? value.substring(0, 20) + "..." : "null"}`);
      hasAuthItems = true;
    }
  }

  if (!hasAuthItems) {
    console.log("No auth localStorage items found");
  }

  console.groupEnd();
}