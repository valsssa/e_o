"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { 
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { 
  Settings, 
  Moon, 
  Sun, 
  EyeOff,
  BellRing,
  BellOff,
  Save,
  RotateCcw
} from "lucide-react";
import { useTheme } from "next-themes";
import { 
  getUserPreferences, 
  setUserPreferences
} from "@/lib/cookie-utils";

// Define the structure of user preferences
interface UserPreferences {
  notifications: boolean;
  highContrastMode: boolean;
  saveHistory: boolean;
  sessionDuration: "short" | "medium" | "long";
  theme: "dark" | "light" | "system";
}

// Default preferences
const DEFAULT_PREFERENCES: UserPreferences = {
  notifications: true,
  highContrastMode: false,
  saveHistory: true,
  sessionDuration: "medium",
  theme: "dark"
};

export function UserPreferences() {
  const { user } = useAuth();
  const { setTheme } = useTheme();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(false);

  // Load preferences from cookies when component mounts
  useEffect(() => {
    if (!user) return;
    
    try {
      const savedPreferences = getUserPreferences<UserPreferences>();
      
      if (savedPreferences) {
        setPreferences({ ...DEFAULT_PREFERENCES, ...savedPreferences });
        
        // Apply theme from preferences
        if (savedPreferences.theme) {
          setTheme(savedPreferences.theme);
        }
      }
    } catch (error) {
      console.error("Error loading user preferences:", error);
    }
  }, [user, setTheme]);

  // When preferences change in this component, we update the theme
  // but save only when the user explicitly clicks "Save"
  useEffect(() => {
    setTheme(preferences.theme);
  }, [preferences.theme, setTheme]);

  // Handle saving preferences
  const handleSavePreferences = () => {
    setIsLoading(true);
    
    try {
      // Save to cookies
      setUserPreferences(preferences);
      
      // Apply theme
      setTheme(preferences.theme);
      
      toast({
        title: "Preferences saved",
        description: "Your preferences have been updated.",
      });
      
      // Close the sheet
      setOpen(false);
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast({
        title: "Error saving preferences",
        description: "There was a problem saving your preferences.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle resetting preferences to defaults
  const handleResetPreferences = () => {
    setPreferences(DEFAULT_PREFERENCES);
    
    toast({
      title: "Preferences reset",
      description: "Your preferences have been reset to defaults.",
    });
  };

  // Toggle a boolean preference
  const togglePreference = (key: keyof UserPreferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Set a specific preference value
  const setPreference = <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (!user) return null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="text-gray-300 hover:bg-purple-900/30 hover:text-white" title="User Preferences">
          <Settings className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="bg-black/90 border-purple-900/50 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>User Preferences</SheetTitle>
          <SheetDescription>
            Customize your experience with the Esoteric Oracle
          </SheetDescription>
        </SheetHeader>
        
        <div className="py-6 space-y-6">
          {/* Theme Settings */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-white">Appearance</h3>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Dark Mode</Label>
                <p className="text-sm text-gray-400">Toggle between light and dark themes</p>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant={preferences.theme === "light" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setPreference("theme", "light")}
                  title="Light Mode"
                  className="h-8 w-8"
                >
                  <Sun className="h-4 w-4" />
                </Button>
                <Button
                  variant={preferences.theme === "dark" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setPreference("theme", "dark")}
                  title="Dark Mode"
                  className="h-8 w-8"
                >
                  <Moon className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="high-contrast" className="text-base">High Contrast Mode</Label>
                <p className="text-sm text-gray-400">Increase contrast for better visibility</p>
              </div>
              <Switch
                id="high-contrast"
                checked={preferences.highContrastMode}
                onCheckedChange={() => togglePreference("highContrastMode")}
              />
            </div>
          </div>
          
          {/* Privacy Settings */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-white">Privacy</h3>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="save-history" className="text-base">Save Oracle History</Label>
                <p className="text-sm text-gray-400">Store your questions and the oracle's responses</p>
              </div>
              <Switch
                id="save-history"
                checked={preferences.saveHistory}
                onCheckedChange={() => togglePreference("saveHistory")}
              />
            </div>
          </div>
          
          {/* Notification Settings */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-white">Notifications</h3>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notifications" className="text-base">Enable Notifications</Label>
                <p className="text-sm text-gray-400">Receive notifications about oracle insights</p>
              </div>
              <Switch
                id="notifications"
                checked={preferences.notifications}
                onCheckedChange={() => togglePreference("notifications")}
              />
            </div>
          </div>
          
          {/* Session Settings */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-white">Session</h3>
            
            <div className="space-y-2">
              <Label className="text-base">Session Duration</Label>
              <p className="text-sm text-gray-400">Choose how long you stay signed in</p>
              
              <div className="grid grid-cols-3 gap-2 pt-1">
                <Button
                  variant={preferences.sessionDuration === "short" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPreference("sessionDuration", "short")}
                  className={preferences.sessionDuration === "short" ? "bg-purple-700 hover:bg-purple-600" : ""}
                >
                  Short (1 day)
                </Button>
                <Button
                  variant={preferences.sessionDuration === "medium" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPreference("sessionDuration", "medium")}
                  className={preferences.sessionDuration === "medium" ? "bg-purple-700 hover:bg-purple-600" : ""}
                >
                  Medium (7 days)
                </Button>
                <Button
                  variant={preferences.sessionDuration === "long" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPreference("sessionDuration", "long")}
                  className={preferences.sessionDuration === "long" ? "bg-purple-700 hover:bg-purple-600" : ""}
                >
                  Long (30 days)
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <SheetFooter className="pt-2 space-x-2">
          <Button 
            variant="outline" 
            onClick={handleResetPreferences}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
          <Button 
            onClick={handleSavePreferences} 
            disabled={isLoading}
            className="bg-purple-700 hover:bg-purple-600 gap-2"
          >
            <Save className="h-4 w-4" />
            {isLoading ? "Saving..." : "Save Preferences"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export default UserPreferences;