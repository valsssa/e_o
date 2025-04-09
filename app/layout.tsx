import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import Navbar from "@/components/navbar"
import StarfieldAnimation from "@/components/starfield-animation"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Esoteric Oracle",
  description: "Seek wisdom from the cosmic forces",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} bg-gradient-to-br from-indigo-950 via-purple-900 to-indigo-900 min-h-screen`}
      >
        <StarfieldAnimation />
        <Navbar />
        <main className="relative z-10">{children}</main>
        <Toaster />
      </body>
    </html>
  )
}


import './globals.css'