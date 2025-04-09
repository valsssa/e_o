import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  try {
    // Create a response object that we'll manipulate
    const res = NextResponse.next()
    
    // Create the Supabase middleware client
    const supabase = createMiddlewareClient({ req, res })

    // Get the session (this will verify the session cookie)
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // Define route patterns for different access controls
    const isProtectedRoute = req.nextUrl.pathname.startsWith("/profile")
    const isHomeRoute = req.nextUrl.pathname === "/"
    const isAuthRoute = req.nextUrl.pathname.startsWith("/auth") && 
                       !req.nextUrl.pathname.includes("/callback")
    const isCallbackRoute = req.nextUrl.pathname.includes("/auth/callback")

    // Always allow access to callback routes (needed for auth flow)
    if (isCallbackRoute) {
      return res
    }

    // For protected routes: redirect to login if not authenticated
    if (isProtectedRoute && !session) {
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = "/"
      redirectUrl.searchParams.set("redirectTo", req.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // For auth routes: redirect to home if already authenticated
    if (isAuthRoute && session) {
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = "/"
      return NextResponse.redirect(redirectUrl)
    }

    // For home route: allow access (login page will be shown if not authenticated)
    return res
  } catch (error) {
    console.error("[Middleware] Error in auth middleware:", error)
    
    // If middleware fails, default to allowing the request but redirect to home
    // to avoid security issues where auth failures grant access
    const isApiRoute = req.nextUrl.pathname.startsWith("/api/")
    if (isApiRoute) {
      return new Response(JSON.stringify({ error: "Authentication error" }), {
        status: 401,
        headers: {
          "Content-Type": "application/json"
        }
      })
    }
    
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = "/"
    return NextResponse.redirect(redirectUrl)
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
}