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
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { 
  Home, 
  User, 
  Menu, 
  X, 
  Moon, 
  Sun,
  LogOut,
  Clock,
  Loader2
} from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useAuth } from "@/components/auth-provider";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserPreferences } from "@/components/user-preferences";
import { updateLastActivity } from "@/lib/cookie-utils";

export function NavBar() {
  const pathname = usePathname();
  const { toast } = useToast();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { user, signOut, session } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState<string | null>(null);

  // Update last activity whenever the navigation occurs
  useEffect(() => {
    updateLastActivity();
  }, [pathname]);

  // Display session expiry only in development mode
  useEffect(() => {
    if (process.env.NODE_ENV !== "development" || !session) return;
    
    const updateSessionTime = () => {
      if (!session?.expires_at) return;
      
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = session.expires_at;
      const timeRemaining = expiresAt - now;
      
      if (timeRemaining <= 0) {
        setSessionTimeRemaining("Expired");
        return;
      }
      
      // Format remaining time
      const hours = Math.floor(timeRemaining / 3600);
      const minutes = Math.floor((timeRemaining % 3600) / 60);
      const seconds = timeRemaining % 60;
      
      if (hours > 0) {
        setSessionTimeRemaining(`${hours}h ${minutes}m`);
      } else if (minutes > 0) {
        setSessionTimeRemaining(`${minutes}m ${seconds}s`);
      } else {
        setSessionTimeRemaining(`${seconds}s`);
      }
    };
    
    updateSessionTime();
    const interval = setInterval(updateSessionTime, 1000);
    
    return () => clearInterval(interval);
  }, [session]);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleSignOut = async () => {
    setIsLoading(true);

    try {
      await signOut();

      toast({
        title: "Signed out",
        description: "You have been successfully signed out",
      });
    } catch (error: any) {
      console.error("Error signing out:", error);

      toast({
        title: "Error signing out",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const navItems = [
    { href: "/", label: "Oracle", icon: <Home className="h-4 w-4 mr-2" /> },
    { href: "/profile", label: "Profile", icon: <User className="h-4 w-4 mr-2" /> },
  ];

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

            {/* User session info - only in development */}
            {process.env.NODE_ENV === "development" && user && sessionTimeRemaining && (
              <div className="text-xs text-gray-400 px-2 py-1 bg-purple-900/20 rounded-md flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {sessionTimeRemaining}
              </div>
            )}

            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-gray-300 hover:bg-purple-900/30 hover:text-white"
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            {/* User Preferences */}
            <UserPreferences />

            {/* User Account Dropdown */}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative rounded-full h-8 w-8 bg-purple-900/30">
                    <span className="sr-only">Open user menu</span>
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {user.email?.charAt(0).toUpperCase() || "U"}
                      </span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-black/90 border-purple-900/50" align="end">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.email}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.id.substring(0, 8)}...
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleSignOut}
                    disabled={isLoading}
                    className="text-red-500 focus:text-red-500"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span>Signing out...</span>
                      </>
                    ) : (
                      <>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Sign out</span>
                      </>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
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

            {user && (
              <div className="px-3 py-2 space-y-3">
                <div className="flex items-center text-sm text-gray-300">
                  <User className="h-4 w-4 mr-2" />
                  {user.email}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                  disabled={isLoading}
                  className="w-full justify-center text-red-400 border-red-900/50 hover:bg-red-900/20"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Signing Out...
                    </>
                  ) : (
                    <>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}