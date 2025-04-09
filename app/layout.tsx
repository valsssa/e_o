import type React from "react"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/components/auth-provider"
import { SessionManager } from "@/components/session-manager"
import { ActivityMonitor } from "@/components/activity-monitor"
import { cookies } from "next/headers"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Esoteric Oracle",
  description: "Seek wisdom from the mystical oracle",
  generator: 'v0.dev'
}

// Detect if the user requested a specific session preference
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get theme preference from cookies
  const cookieStore = cookies()
  const theme = cookieStore.get('theme-preference')?.value || 'dark'
  
  // Get session duration preference from cookies
  const sessionDuration = cookieStore.get('session-duration')?.value || 'medium'
  
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Add security headers and metadata */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        <meta name="creator" content="Esoteric Oracle" />
        <link rel="canonical" href="https://esoteric-oracle.example.com" />
        
        {/* CSP & security meta tags */}
        {process.env.NODE_ENV === "production" && (
          <>
            <meta
              httpEquiv="Content-Security-Policy"
              content="default-src 'self'; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; connect-src 'self' https://*.supabase.co; img-src 'self' data: blob:; font-src 'self'; frame-ancestors 'none'; form-action 'self';"
            />
            <meta name="referrer" content="strict-origin-when-cross-origin" />
          </>
        )}
        
        {/* CSRF and XSS protection */}
        <meta name="csrf-param" content="_csrf" />
        <meta name="csrf-token" content="random-csrf-token-for-demo" />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme={theme as 'dark' | 'light' | 'system'} enableSystem>
          <AuthProvider>
            {/* Session Manager handles automatic session refreshing and expiry warnings */}
            <SessionManager />
            
            {/* Activity Monitor for tracking user activity and session timeouts */}
            <ActivityMonitor />
            
            {children}
            <Toaster />
            
            {/* Debug components for development only */}
            {process.env.NODE_ENV === "development" && (
              <div id="debug-container">
                {/* Uncomment this for direct debugging 
                <DebugMonitor sessionDuration={sessionDuration} /> 
                */}
              </div>
            )}
          </AuthProvider>
        </ThemeProvider>
        
        {/* Add nonce for additional CSP protection */}
        <script nonce="random-nonce-for-demo" 
                dangerouslySetInnerHTML={{ 
                  __html: `
                    // Only execute on production
                    if (window.location.hostname !== 'localhost') {
                      // Prevent clickjacking
                      if (window.self !== window.top) {
                        window.top.location.href = window.self.location.href;
                      }
                      
                      // Record initial visit timestamp for session tracking
                      try {
                        if (!localStorage.getItem('session_start')) {
                          localStorage.setItem('session_start', Date.now().toString());
                        }
                      } catch (e) {
                        // Ignore localStorage errors
                      }
                    }
                  ` 
                }}>
        </script>
      </body>
    </html>
  )
}