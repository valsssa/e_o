"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Home, User, Menu, X, Moon, Sun } from "lucide-react"
import { useState } from "react"
import { useTheme } from "next-themes"
import { AuthStatus } from "@/components/auth-status"

export function NavBar() {
  const pathname = usePathname()
  const { toast } = useToast()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  const navItems = [
    { href: "/", label: "Oracle", icon: <Home className="h-4 w-4 mr-2" /> },
    { href: "/profile", label: "Profile", icon: <User className="h-4 w-4 mr-2" /> },
  ]

  return (
    <nav className="fixed top-0 w-full z-50 bg-black/30 backdrop-blur-md border-b border-purple-900/30">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-white">
            Esoteric Oracle
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                  pathname === item.href
                    ? "bg-purple-900/50 text-white"
                    : "text-gray-300 hover:bg-purple-900/30 hover:text-white"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-gray-300 hover:bg-purple-900/30 hover:text-white"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            <AuthStatus />
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden text-gray-300 hover:text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden pt-4 pb-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                  pathname === item.href
                    ? "bg-purple-900/50 text-white"
                    : "text-gray-300 hover:bg-purple-900/30 hover:text-white"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}

            <button
              className="flex items-center w-full px-3 py-2 text-left rounded-md text-gray-300 hover:bg-purple-900/30 hover:text-white"
              onClick={toggleTheme}
            >
              {theme === "dark" ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </button>

            <div className="px-3 py-2">
              <AuthStatus />
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
