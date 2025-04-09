"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { Session, User, AuthError } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";
import * as AuthService from "@/lib/auth-service";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isInitializing: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | AuthError | null; success: boolean }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | AuthError | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | AuthError | null }>;
  updatePassword: (password: string) => Promise<{ error: Error | AuthError | null }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Initialize auth state from service
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        if (process.env.NODE_ENV === "development") {
          console.log("AuthProvider: Initializing auth state");
        }

        // Get initial session
        const { session: initialSession, error } = await AuthService.getSession();

        if (!isMounted) return;

        if (error) {
          console.error("AuthProvider: Error getting initial session:", error);
          setIsInitializing(false);
          return;
        }

        setSession(initialSession);
        setUser(initialSession?.user || null);

        if (process.env.NODE_ENV === "development") {
          console.log("AuthProvider: Initialized with session", { hasSession: !!initialSession });
          AuthService.debugAuthStorage();
        }
      } catch (error) {
        console.error("AuthProvider: Error initializing:", error);
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    };

    initializeAuth();

    // Set up auth state change listener
    const { unsubscribe } = AuthService.onAuthStateChange((event, newSession) => {
      if (process.env.NODE_ENV === "development") {
        console.log("AuthProvider: Auth state changed", { event, user: newSession?.user?.email });
      }

      setSession(newSession);
      setUser(newSession?.user || null);

      if (event === "SIGNED_IN") {
        if (process.env.NODE_ENV === "development") {
          console.log("AuthProvider: User signed in", { email: newSession?.user?.email });
        }
        
        // Force a full page reload to ensure all components re-render with the new auth state
        window.location.href = "/";
      } else if (event === "SIGNED_OUT") {
        if (process.env.NODE_ENV === "development") {
          console.log("AuthProvider: User signed out");
        }

        // Reset client and force reload
        window.location.href = "/";
      }
    });

    return () => {
      isMounted = false;
      unsubscribe?.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);

    try {
      if (process.env.NODE_ENV === "development") {
        console.log("AuthProvider: Signing in user", { email });
      }

      const { error, success, user } = await AuthService.signIn(email, password);

      if (error) {
        if (process.env.NODE_ENV === "development") {
          console.log("AuthProvider: Sign in error", { error: error.message });
        }
        return { error, success: false };
      }

      if (process.env.NODE_ENV === "development") {
        console.log("AuthProvider: Sign in successful", { email: user?.email });
      }

      // Don't navigate here - let the auth state change listener handle it
      return { error: null, success: true };
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.log("AuthProvider: Unexpected sign in error", { error });
      }
      return { error: error as Error, success: false };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    setIsLoading(true);

    try {
      if (process.env.NODE_ENV === "development") {
        console.log("AuthProvider: Signing up user", { email });
      }

      const { error } = await AuthService.signUp(email, password);

      if (error) {
        if (process.env.NODE_ENV === "development") {
          console.log("AuthProvider: Sign up error", { error: error.message });
        }
      } else {
        if (process.env.NODE_ENV === "development") {
          console.log("AuthProvider: Sign up successful", { email });
        }
      }

      return { error };
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.log("AuthProvider: Unexpected sign up error", { error });
      }
      return { error: error as Error };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);

    try {
      if (process.env.NODE_ENV === "development") {
        console.log("AuthProvider: Signing out user");
      }

      await AuthService.signOut();

      // Let the auth state change listener handle navigation
    } catch (error) {
      console.error("AuthProvider: Error signing out:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      if (process.env.NODE_ENV === "development") {
        console.log("AuthProvider: Sending password reset", { email });
      }

      return await AuthService.resetPassword(email);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.log("AuthProvider: Error resetting password", { error });
      }
      return { error: error as Error };
    }
  };

  const updatePassword = async (password: string) => {
    try {
      if (process.env.NODE_ENV === "development") {
        console.log("AuthProvider: Updating password");
      }

      return await AuthService.updatePassword(password);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.log("AuthProvider: Error updating password", { error });
      }
      return { error: error as Error };
    }
  };

  const value = {
    user,
    session,
    isLoading,
    isInitializing,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
  };

  // Show loading indicator while initializing
  if (isInitializing) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
        <div className="bg-black/70 p-4 rounded-lg flex items-center space-x-2">
          <Loader2 className="h-6 w-6 text-purple-500 animate-spin" />
          <span className="text-white">Initializing authentication...</span>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}