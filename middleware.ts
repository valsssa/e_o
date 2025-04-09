import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Check if the request is for a protected route
  const isProtectedRoute = req.nextUrl.pathname.startsWith("/profile") || req.nextUrl.pathname === "/"

  // Auth routes that should redirect to home if already logged in
  const isAuthRoute = req.nextUrl.pathname.startsWith("/auth") && !req.nextUrl.pathname.includes("/callback")

  // If accessing a protected route without being logged in
  if (isProtectedRoute && !session) {
    // If the route is the home page, allow access to show the login form
    if (req.nextUrl.pathname === "/") {
      return res
    }

    // For other protected routes, redirect to login with the return URL
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = "/"
    redirectUrl.searchParams.set("redirectTo", req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If accessing auth routes while logged in, redirect to home
  if (isAuthRoute && session) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = "/"
    return NextResponse.redirect(redirectUrl)
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes that don't require authentication
     */
    "/((?!_next/static|_next/image|favicon.ico|public|api/public).*)",
  ],
}
