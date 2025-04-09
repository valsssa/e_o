"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Clock, AlertCircle } from "lucide-react";
import * as AuthService from "@/lib/auth-service";

// Constants for session management
const SESSION_TIMEOUT_WARNING = 5 * 60; // Show warning 5 minutes before expiry
const SESSION_CHECK_INTERVAL = 60 * 1000; // Check session every minute
const SESSION_REFRESH_THRESHOLD = 30 * 60; // Refresh session if less than 30 minutes remaining

export function SessionManager() {
  const { session, signOut } = useAuth();
  const { toast } = useToast();
  const [showSessionWarning, setShowSessionWarning] = useState(false);
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Calculate and track session expiry
  useEffect(() => {
    if (!session) return;
    
    const checkSessionStatus = async () => {
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = session.expires_at;
      
      if (!expiresAt) return;
      
      const timeRemaining = expiresAt - now;
      setSessionTimeRemaining(timeRemaining);
      
      // If session is about to expire, show warning
      if (timeRemaining <= SESSION_TIMEOUT_WARNING && timeRemaining > 0) {
        setShowSessionWarning(true);
      } else {
        setShowSessionWarning(false);
      }
      
      // If session is nearing expiry but still valid, refresh it automatically
      if (timeRemaining <= SESSION_REFRESH_THRESHOLD && timeRemaining > 0 && !isRefreshing) {
        await refreshSession();
      }
    };
    
    // Check session status immediately
    checkSessionStatus();
    
    // Then set up interval to check periodically
    const intervalId = setInterval(checkSessionStatus, SESSION_CHECK_INTERVAL);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [session, isRefreshing]);
  
  // Handle session refresh
  const refreshSession = async () => {
    if (!session || isRefreshing) return;
    
    try {
      setIsRefreshing(true);
      
      // Get current Supabase client
      const supabase = AuthService.createClient();
      
      // Try to refresh the session
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error("Error refreshing session:", error);
        toast({
          title: "Session refresh failed",
          description: "Your session could not be refreshed. You may need to sign in again.",
          variant: "destructive",
        });
        return;
      }
      
      if (data && data.session) {
        if (process.env.NODE_ENV === "development") {
          console.log("Session refreshed successfully. New expiry:", new Date(data.session.expires_at * 1000));
        }
        
        // Hide warning if it was showing
        setShowSessionWarning(false);
        
        toast({
          title: "Session extended",
          description: "Your session has been refreshed.",
        });
      }
    } catch (error) {
      console.error("Unexpected error refreshing session:", error);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Format remaining time for display
  const formatTimeRemaining = (seconds: number): string => {
    if (seconds <= 0) return "Expired";
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes < 1) {
      return `${remainingSeconds} seconds`;
    }
    
    return `${minutes} minute${minutes !== 1 ? "s" : ""} ${remainingSeconds} second${remainingSeconds !== 1 ? "s" : ""}`;
  };
  
  // Handle session extension
  const handleExtendSession = async () => {
    await refreshSession();
  };
  
  // Handle session end/logout
  const handleEndSession = async () => {
    setShowSessionWarning(false);
    await signOut();
  };
  
  if (!session) return null;
  
  return (
    <>
      {/* Session Warning Dialog */}
      <Dialog open={showSessionWarning} onOpenChange={setShowSessionWarning}>
        <DialogContent className="bg-black/80 border-purple-900/50">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <AlertCircle className="h-5 w-5 text-amber-500 mr-2" />
              Your session is about to expire
            </DialogTitle>
            <DialogDescription>
              {sessionTimeRemaining !== null ? (
                <>
                  Your session will expire in {formatTimeRemaining(sessionTimeRemaining)}. 
                  Would you like to extend your session or sign out?
                </>
              ) : (
                "Your session is about to expire. Would you like to extend your session or sign out?"
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleEndSession}>
              Sign Out
            </Button>
            <Button 
              onClick={handleExtendSession} 
              className="bg-purple-700 hover:bg-purple-600"
              disabled={isRefreshing}
            >
              {isRefreshing ? "Extending..." : "Extend Session"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Optional: Session Status Indicator for admin/debug purposes */}
      {process.env.NODE_ENV === "development" && sessionTimeRemaining !== null && (
        <div className="fixed bottom-2 left-2 z-10 bg-black/60 text-white text-xs rounded p-1 flex items-center">
          <Clock className="h-3 w-3 mr-1" />
          Session: {formatTimeRemaining(sessionTimeRemaining)}
        </div>
      )}
    </>
  );
}

export default SessionManager;