"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/components/ui/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { updateLastActivity, getLastActivity } from "@/lib/cookie-utils";
import * as AuthService from "@/lib/auth-service";

// Constants for activity monitoring
const INACTIVITY_WARNING_TIMEOUT = 15 * 60 * 1000; // 15 minutes of inactivity before warning
const INACTIVITY_LOGOUT_TIMEOUT = 20 * 60 * 1000;  // 20 minutes of inactivity before logout
const ACTIVITY_CHECK_INTERVAL = 60 * 1000;         // Check activity every minute

export function ActivityMonitor() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const [inactiveTime, setInactiveTime] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Track user activity
  useEffect(() => {
    if (!user) return;
    
    // Update last activity on various user interactions
    const activityEvents = [
      "mousedown",
      "keydown",
      "scroll",
      "mousemove",
      "touchstart",
      "click",
    ];
    
    const handleUserActivity = () => {
      updateLastActivity();
    };
    
    // Add event listeners for all activity events
    activityEvents.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true });
    });
    
    // Set initial last activity if not already set
    if (!getLastActivity()) {
      updateLastActivity();
    }
    
    // Clean up event listeners
    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleUserActivity);
      });
    };
  }, [user]);
  
  // Monitor for inactivity
  useEffect(() => {
    if (!user) return;
    
    const checkActivity = () => {
      const lastActivity = getLastActivity();
      
      if (!lastActivity) {
        updateLastActivity();
        return;
      }
      
      const currentTime = Date.now();
      const timeSinceLastActivity = currentTime - lastActivity;
      
      setInactiveTime(timeSinceLastActivity);
      
      // If inactive for too long, show warning
      if (timeSinceLastActivity >= INACTIVITY_WARNING_TIMEOUT && 
          timeSinceLastActivity < INACTIVITY_LOGOUT_TIMEOUT) {
        setShowInactivityWarning(true);
      }
      
      // If inactive for logout threshold, log the user out
      if (timeSinceLastActivity >= INACTIVITY_LOGOUT_TIMEOUT) {
        handleInactivityLogout();
      }
    };
    
    // Check activity periodically
    const intervalId = setInterval(checkActivity, ACTIVITY_CHECK_INTERVAL);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [user]);
  
  // Format the inactive time in minutes and seconds
  const formatInactiveTime = () => {
    const minutes = Math.floor(inactiveTime / 60000);
    const seconds = Math.floor((inactiveTime % 60000) / 1000);
    
    return `${minutes} minute${minutes !== 1 ? 's' : ''} and ${seconds} second${seconds !== 1 ? 's' : ''}`;
  };
  
  // Calculate time remaining before logout
  const getTimeRemaining = () => {
    const timeRemaining = INACTIVITY_LOGOUT_TIMEOUT - inactiveTime;
    const minutes = Math.floor(timeRemaining / 60000);
    const seconds = Math.floor((timeRemaining % 60000) / 1000);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Handle user activity refresh/continuation
  const handleContinueSession = () => {
    updateLastActivity();
    setShowInactivityWarning(false);
    
    toast({
      title: "Session extended",
      description: "Your session has been extended due to activity.",
    });
  };
  
  // Handle inactivity logout
  const handleInactivityLogout = async () => {
    setShowInactivityWarning(false);
    
    try {
      // Log the user out
      await signOut();
      
      // Show toast notification
      toast({
        title: "Session expired",
        description: "You have been logged out due to inactivity.",
        variant: "destructive",
      });
      
      // Redirect to login page with inactivity message
      window.location.href = "/?session=timeout";
    } catch (error) {
      console.error("Error during inactivity logout:", error);
    }
  };
  
  if (!user) return null;
  
  return (
    <>
      {/* Inactivity Warning Dialog */}
      <Dialog open={showInactivityWarning} onOpenChange={setShowInactivityWarning}>
        <DialogContent className="bg-black/80 border-purple-900/50">
          <DialogHeader>
            <DialogTitle>Session Inactivity Warning</DialogTitle>
            <DialogDescription>
              You've been inactive for {formatInactiveTime()}. Your session will automatically
              end in {getTimeRemaining()} unless you continue your session.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={handleInactivityLogout}
            >
              End Session
            </Button>
            <Button 
              onClick={handleContinueSession} 
              className="bg-purple-700 hover:bg-purple-600"
            >
              Continue Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Optional development activity display */}
      {process.env.NODE_ENV === "development" && (
        <div className="fixed bottom-20 left-2 z-10 bg-black/60 text-white text-xs rounded p-1 hidden">
          Inactive: {formatInactiveTime()}
        </div>
      )}
    </>
  );
}

export default ActivityMonitor;