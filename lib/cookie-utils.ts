// lib/cookie-utils.ts

/**
 * Secure cookie management utilities
 * These utilities provide a secure way to manage cookies with proper security measures
 */

// Cookie names
export const COOKIE_NAMES = {
    ACCESS_TOKEN: "sb-access-token",
    REFRESH_TOKEN: "sb-refresh-token",
    SESSION_STATE: "session-state",
    LAST_ACTIVITY: "last-activity",
    THEME: "theme-preference",
    PREFERENCES: "user-preferences",
  };
  
  // Cookie options with security defaults
  export type CookieOptions = {
    path?: string;
    domain?: string;
    maxAge?: number;
    expires?: Date | string;
    secure?: boolean;
    httpOnly?: boolean;
    sameSite?: "strict" | "lax" | "none";
  };
  
  // Default cookie security options
  export const DEFAULT_COOKIE_OPTIONS: CookieOptions = {
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    secure: process.env.NODE_ENV === "production", // Secure in production
    httpOnly: false, // Allow JS access for client-side cookies
    sameSite: "lax", // Prevent CSRF but allow normal navigation
  };
  
  // More secure options for auth cookies
  export const AUTH_COOKIE_OPTIONS: CookieOptions = {
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    secure: process.env.NODE_ENV === "production", // Secure in production
    httpOnly: true, // Prevent JS access for auth cookies
    sameSite: "lax", // Prevent CSRF but allow auth redirects
  };
  
  /**
   * Set a cookie with the provided options
   */
  export function setCookie(name: string, value: string, options: CookieOptions = {}): void {
    try {
      const mergedOptions = { ...DEFAULT_COOKIE_OPTIONS, ...options };
      
      let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
      
      if (mergedOptions.path) {
        cookieString += `; path=${mergedOptions.path}`;
      }
      
      if (mergedOptions.domain) {
        cookieString += `; domain=${mergedOptions.domain}`;
      }
      
      if (mergedOptions.maxAge !== undefined && mergedOptions.maxAge > 0) {
        cookieString += `; max-age=${mergedOptions.maxAge}`;
      }
      
      if (mergedOptions.expires) {
        const expiresValue = typeof mergedOptions.expires === "string" 
          ? mergedOptions.expires 
          : mergedOptions.expires.toUTCString();
        cookieString += `; expires=${expiresValue}`;
      }
      
      if (mergedOptions.secure) {
        cookieString += "; secure";
      }
      
      if (mergedOptions.httpOnly) {
        cookieString += "; httpOnly";
      }
      
      if (mergedOptions.sameSite) {
        cookieString += `; samesite=${mergedOptions.sameSite}`;
      }
      
      document.cookie = cookieString;
      
      if (process.env.NODE_ENV === "development") {
        console.log(`[Cookie Utils] Cookie set: ${name} (options: ${JSON.stringify(mergedOptions)})`);
      }
    } catch (error) {
      console.error(`[Cookie Utils] Error setting cookie ${name}:`, error);
    }
  }
  
  /**
   * Get a cookie value by name
   */
  export function getCookie(name: string): string | undefined {
    try {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        // Check if this cookie starts with the name we're looking for
        if (cookie.startsWith(`${encodeURIComponent(name)}=`)) {
          return decodeURIComponent(cookie.substring(name.length + 1));
        }
      }
      return undefined;
    } catch (error) {
      console.error(`[Cookie Utils] Error getting cookie ${name}:`, error);
      return undefined;
    }
  }
  
  /**
   * Delete a cookie by setting its expiration date to the past
   */
  export function deleteCookie(name: string, options: Partial<CookieOptions> = {}): void {
    try {
      // Merge with default options but override maxAge and expires
      const mergedOptions: CookieOptions = {
        ...DEFAULT_COOKIE_OPTIONS,
        ...options,
        maxAge: -1,
        expires: new Date(0), // Unix epoch - January 1, 1970
      };
      
      setCookie(name, "", mergedOptions);
      
      if (process.env.NODE_ENV === "development") {
        console.log(`[Cookie Utils] Cookie deleted: ${name}`);
      }
    } catch (error) {
      console.error(`[Cookie Utils] Error deleting cookie ${name}:`, error);
    }
  }
  
  /**
   * Check if a cookie exists
   */
  export function hasCookie(name: string): boolean {
    return getCookie(name) !== undefined;
  }
  
  /**
   * Set an object as a JSON cookie
   */
  export function setJSONCookie<T>(name: string, value: T, options: CookieOptions = {}): void {
    try {
      const jsonValue = JSON.stringify(value);
      setCookie(name, jsonValue, options);
    } catch (error) {
      console.error(`[Cookie Utils] Error setting JSON cookie ${name}:`, error);
    }
  }
  
  /**
   * Get and parse a JSON cookie
   */
  export function getJSONCookie<T>(name: string): T | undefined {
    try {
      const cookieValue = getCookie(name);
      if (!cookieValue) return undefined;
      
      return JSON.parse(cookieValue) as T;
    } catch (error) {
      console.error(`[Cookie Utils] Error parsing JSON cookie ${name}:`, error);
      return undefined;
    }
  }
  
  /**
   * Set user preferences in a cookie
   */
  export function setUserPreferences<T extends Record<string, any>>(preferences: T): void {
    setJSONCookie(COOKIE_NAMES.PREFERENCES, preferences);
  }
  
  /**
   * Get user preferences from cookie
   */
  export function getUserPreferences<T>(): T | undefined {
    return getJSONCookie<T>(COOKIE_NAMES.PREFERENCES);
  }
  
  /**
   * Update the last activity timestamp
   */
  export function updateLastActivity(): void {
    setCookie(COOKIE_NAMES.LAST_ACTIVITY, Date.now().toString(), {
      maxAge: 60 * 60 * 24, // 24 hours
    });
  }
  
  /**
   * Get the last activity timestamp
   */
  export function getLastActivity(): number | undefined {
    const value = getCookie(COOKIE_NAMES.LAST_ACTIVITY);
    return value ? parseInt(value, 10) : undefined;
  }
  
  /**
   * Set session auth cookies with enhanced security
   */
  export function setAuthCookies(accessToken: string, refreshToken: string, expiresIn: number = 3600): void {
    // Use the more secure options for auth cookies
    setCookie(COOKIE_NAMES.ACCESS_TOKEN, accessToken, {
      ...AUTH_COOKIE_OPTIONS,
      maxAge: expiresIn,
    });
    
    setCookie(COOKIE_NAMES.REFRESH_TOKEN, refreshToken, {
      ...AUTH_COOKIE_OPTIONS,
      maxAge: 60 * 60 * 24 * 30, // 30 days for refresh token
    });
    
    // Update last activity
    updateLastActivity();
  }
  
  /**
   * Clear auth cookies on logout
   */
  export function clearAuthCookies(): void {
    deleteCookie(COOKIE_NAMES.ACCESS_TOKEN, AUTH_COOKIE_OPTIONS);
    deleteCookie(COOKIE_NAMES.REFRESH_TOKEN, AUTH_COOKIE_OPTIONS);
    deleteCookie(COOKIE_NAMES.SESSION_STATE);
    deleteCookie(COOKIE_NAMES.LAST_ACTIVITY);
  }
  
  /**
   * Debug function to print all cookies (development only)
   */
  export function debugCookies(): void {
    if (process.env.NODE_ENV !== "development") return;
    
    try {
      console.group("[Cookie Utils] All Cookies:");
      const cookies = document.cookie.split(';');
      
      if (cookies.length === 0 || (cookies.length === 1 && cookies[0].trim() === "")) {
        console.log("No cookies found");
      } else {
        cookies.forEach(cookie => {
          const [name, value] = cookie.trim().split('=').map(part => decodeURIComponent(part.trim()));
          
          // Don't show full token values
          const displayValue = name.includes("token") 
            ? `${value.substring(0, 10)}...`
            : value;
            
          console.log(`${name}: ${displayValue}`);
        });
      }
      console.groupEnd();
    } catch (error) {
      console.error("[Cookie Utils] Error in debugCookies:", error);
    }
  }