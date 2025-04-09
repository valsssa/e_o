// middleware.ts
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Session timeout in seconds (default: 7 days)
const SESSION_TIMEOUT = 60 * 60 * 24 * 7;

// Security headers to protect against common attacks
const securityHeaders = {
  // Content Security Policy
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self' https://cdnjs.cloudflare.com 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; img-src 'self' data: blob:; font-src 'self'; connect-src 'self' https://*.supabase.co; frame-ancestors 'none'; upgrade-insecure-requests;",
  // Prevent MIME type sniffing
  "X-Content-Type-Options": "nosniff",
  // Clickjacking protection
  "X-Frame-Options": "DENY",
  // XSS protection
  "X-XSS-Protection": "1; mode=block",
  // Referrer policy
  "Referrer-Policy": "strict-origin-when-cross-origin",
  // Permissions policy
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), interest-cohort=()",
};

export async function middleware(req: NextRequest) {
  try {
    // Create a response object that we'll manipulate
    const res = NextResponse.next();
    
    // Add security headers to all responses
    Object.entries(securityHeaders).forEach(([key, value]) => {
      res.headers.set(key, value);
    });
    
    // Create the Supabase middleware client
    const supabase = createMiddlewareClient({ req, res });

    // Get the session (this will verify the session cookie)
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // Define route patterns for different access controls
    const isProtectedRoute = req.nextUrl.pathname.startsWith("/profile");
    const isHomeRoute = req.nextUrl.pathname === "/";
    const isAuthRoute = req.nextUrl.pathname.startsWith("/auth") && 
                       !req.nextUrl.pathname.includes("/callback");
    const isCallbackRoute = req.nextUrl.pathname.includes("/auth/callback");
    const isApiRoute = req.nextUrl.pathname.startsWith("/api/");

    // Always allow access to callback routes (needed for auth flow)
    if (isCallbackRoute) {
      return res;
    }

    // For protected routes: redirect to login if not authenticated
    if (isProtectedRoute && !session) {
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = "/";
      redirectUrl.searchParams.set("redirectTo", req.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // For auth routes: redirect to home if already authenticated
    if (isAuthRoute && session) {
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = "/";
      return NextResponse.redirect(redirectUrl);
    }

    // For API routes: check if authenticated when required
    if (isApiRoute && req.nextUrl.pathname.startsWith("/api/oracle") && !session) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }

    // Check for session timeout or expiry
    if (session) {
      const tokenExpiry = session.expires_at;
      const now = Math.floor(Date.now() / 1000);
      
      // If session is expired but we still have it, force renewal or logout
      if (tokenExpiry && tokenExpiry < now) {
        if (process.env.NODE_ENV === "development") {
          console.log("[Middleware] Session expired, forcing renewal");
        }
        
        try {
          // Try to refresh the session
          const { data, error } = await supabase.auth.refreshSession();
          
          if (error || !data.session) {
            // If refresh fails, sign out user and redirect to login
            if (isProtectedRoute || isApiRoute) {
              await supabase.auth.signOut();
              const redirectUrl = req.nextUrl.clone();
              redirectUrl.pathname = "/";
              redirectUrl.searchParams.set("session", "expired");
              return NextResponse.redirect(redirectUrl);
            }
          }
        } catch (error) {
          console.error("[Middleware] Error refreshing session:", error);
        }
      }
      
      // Check for inactivity timeout (optional, using Last-Activity header or cookie)
      const lastActivity = req.cookies.get("last-activity");
      if (lastActivity) {
        const lastActivityTime = parseInt(lastActivity.value, 10);
        const inactiveTime = Math.floor(Date.now() / 1000) - lastActivityTime;
        
        // If user has been inactive for too long (e.g., 1 hour), force logout
        // This is optional and depends on your application's security requirements
        if (inactiveTime > 3600) {
          if (process.env.NODE_ENV === "development") {
            console.log("[Middleware] User inactive too long, logging out");
          }
          
          await supabase.auth.signOut();
          const redirectUrl = req.nextUrl.clone();
          redirectUrl.pathname = "/";
          redirectUrl.searchParams.set("session", "timeout");
          return NextResponse.redirect(redirectUrl);
        }
      }
      
      // Update the last activity time
      res.cookies.set("last-activity", Math.floor(Date.now() / 1000).toString(), {
        path: "/",
        maxAge: SESSION_TIMEOUT,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });
    }
    
    // For home route: allow access (login page will be shown if not authenticated)
    return res;
  } catch (error) {
    console.error("[Middleware] Error in auth middleware:", error);
    
    // If middleware fails, default to allowing the request but redirect to home
    // to avoid security issues where auth failures grant access
    const isApiRoute = req.nextUrl.pathname.startsWith("/api/");
    if (isApiRoute) {
      return new Response(JSON.stringify({ error: "Authentication error" }), {
        status: 401,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/";
    return NextResponse.redirect(redirectUrl);
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};