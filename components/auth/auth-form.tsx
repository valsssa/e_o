"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, Loader2, AlertCircle, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { z } from "zod";

// Session expiry times (in seconds)
const SESSION_DURATION = {
  REMEMBER_ME: 60 * 60 * 24 * 30, // 30 days
  DEFAULT: 60 * 60 * 24 * 7,      // 7 days
};

// Form validation schemas
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z
  .object({
    email: z.string().email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
    termsAccepted: z.boolean().refine((val) => val === true, {
      message: "You must accept the terms and conditions",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export function AuthForm() {
  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("signin");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [formKey, setFormKey] = useState(Date.now()); // Used to reset form state

  const { signIn, signUp, isLoading: isAuthLoading, user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  // Check for redirect parameter and handle URL params
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "signup" || tab === "signin") {
      setActiveTab(tab);
    }

    // Check for reset success message
    const resetSuccess = searchParams.get("reset") === "success";
    if (resetSuccess) {
      toast({
        title: "Password reset successful",
        description: "Your password has been reset. You can now sign in with your new password.",
      });
    }

    // Check for verification success
    const verificationSuccess = searchParams.get("verified") === "success";
    if (verificationSuccess) {
      toast({
        title: "Email verified",
        description: "Your email has been verified. You can now sign in.",
      });
    }

    // Check for session timeout/expiry
    const sessionStatus = searchParams.get("session");
    if (sessionStatus === "expired") {
      toast({
        title: "Session expired",
        description: "Your session has expired. Please sign in again.",
        variant: "destructive",
      });
    } else if (sessionStatus === "timeout") {
      toast({
        title: "Session timeout",
        description: "You have been logged out due to inactivity.",
        variant: "destructive",
      });
    }

    // Check for general error message
    const errorMsg = searchParams.get("error");
    if (errorMsg) {
      setGeneralError(decodeURIComponent(errorMsg));
    }
  }, [searchParams, toast]);

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      if (process.env.NODE_ENV === "development") {
        console.log("User already logged in, redirecting");
      }
      
      const redirectTo = searchParams.get("redirectTo") || "/";
      router.push(redirectTo);
    }
  }, [user, router, searchParams]);

  // Handle successful login
  useEffect(() => {
    if (loginSuccess) {
      const redirectTo = searchParams.get("redirectTo") || "/";
      
      if (process.env.NODE_ENV === "development") {
        console.log("Login successful, redirecting to", redirectTo);
      }

      // Show loading state while we wait for auth state to propagate
      setIsLoading(true);

      // Force a hard navigation to ensure proper page refresh
      window.location.href = redirectTo;
    }
  }, [loginSuccess, searchParams]);

  const validateForm = (type: "login" | "register") => {
    try {
      if (type === "login") {
        loginSchema.parse({ email, password });
      } else {
        registerSchema.parse({ 
          email, 
          password, 
          confirmPassword,
          termsAccepted 
        });
      }
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path) {
            newErrors[err.path[0]] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError("");

    if (!validateForm("login")) return;

    setIsLoading(true);

    try {
      if (process.env.NODE_ENV === "development") {
        console.log("Attempting to sign in", { email, rememberMe });
      }
      
      // Calculate session duration based on remember me checkbox
      const sessionDuration = rememberMe 
        ? SESSION_DURATION.REMEMBER_ME 
        : SESSION_DURATION.DEFAULT;
      
      // Store session preference in localStorage (for debugging/analytics)
      try {
        localStorage.setItem("session_duration", sessionDuration.toString());
        localStorage.setItem("remember_me", rememberMe.toString());
      } catch (e) {
        // Ignore localStorage errors
      }
      
      const { error, success } = await signIn(email, password);

      if (error) throw error;

      if (process.env.NODE_ENV === "development") {
        console.log("Sign in successful");
      }

      // Show success toast
      toast({
        title: "Welcome back",
        description: "You have successfully signed in",
      });

      // Set login success state to trigger redirect
      setLoginSuccess(true);
    } catch (error: any) {
      if (process.env.NODE_ENV === "development") {
        console.log("Sign in error", error);
      }

      // Handle specific error messages
      if (error.message?.includes("Invalid login credentials")) {
        setGeneralError("Invalid email or password. Please try again.");
      } else if (error.message?.includes("Email not confirmed")) {
        setGeneralError("Please verify your email before signing in.");
      } else {
        setGeneralError(error.message || "An error occurred during sign in. Please try again.");
      }

      toast({
        title: "Error signing in",
        description: "Please check your credentials and try again",
        variant: "destructive",
      });

      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError("");
    setSignupSuccess(false);

    if (!validateForm("register")) return;

    setIsLoading(true);

    try {
      if (process.env.NODE_ENV === "development") {
        console.log("Attempting to sign up", { email });
      }
      
      const { error } = await signUp(email, password);

      if (error) throw error;

      if (process.env.NODE_ENV === "development") {
        console.log("Sign up successful");
      }
      
      setSignupSuccess(true);

      toast({
        title: "Registration successful",
        description: "Please check your email to verify your account",
      });
      
      // Reset form state for next use
      setPassword("");
      setConfirmPassword("");
      setTermsAccepted(false);
      setFormKey(Date.now());
    } catch (error: any) {
      if (process.env.NODE_ENV === "development") {
        console.log("Sign up error", error);
      }

      if (error.message?.includes("already registered")) {
        setGeneralError("This email is already registered. Please sign in instead.");
      } else {
        setGeneralError(error.message || "An error occurred during registration. Please try again.");
      }

      toast({
        title: "Error signing up",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form when switching tabs
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setErrors({});
    setGeneralError("");
  };

  // If signup was successful, show a different UI
  if (signupSuccess) {
    return (
      <Card className="w-full max-w-md mx-auto bg-black/40 backdrop-blur-md border-purple-900/50 glow">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">Verification Required</CardTitle>
          <CardDescription className="text-center">Check your email to complete registration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="rounded-full bg-purple-900/30 p-3">
              <Info className="h-6 w-6 text-purple-300" />
            </div>
          </div>
          <p className="text-gray-300">
            We've sent a verification email to <span className="font-medium text-purple-300">{email}</span>
          </p>
          <p className="text-gray-400 text-sm">
            Please check your inbox and click the verification link to activate your account.
          </p>
          <p className="text-gray-400 text-sm">
            If you don't see the email, check your spam folder or try again with a different email address.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button
            onClick={() => {
              setSignupSuccess(false);
              setActiveTab("signin");
            }}
            className="w-full bg-purple-700 hover:bg-purple-600"
          >
            Return to Sign In
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Show loading state while Auth is initializing
  if (isAuthLoading) {
    return (
      <Card className="w-full max-w-md mx-auto bg-black/40 backdrop-blur-md border-purple-900/50 glow">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">Esoteric Oracle</CardTitle>
          <CardDescription className="text-center">Initializing...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 text-purple-500 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card key={formKey} className="w-full max-w-md mx-auto bg-black/40 backdrop-blur-md border-purple-900/50 glow">
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">Esoteric Oracle</CardTitle>
          <CardDescription className="text-center">Access the wisdom of the cosmos</CardDescription>
          <TabsList className="grid grid-cols-2 mt-4">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
        </CardHeader>

        {generalError && (
          <div className="px-6">
            <Alert variant="destructive" className="bg-red-900/20 border-red-800">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{generalError}</AlertDescription>
            </Alert>
          </div>
        )}

        <TabsContent value="signin">
          <form onSubmit={handleSignIn}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className={`bg-black/30 ${errors.email ? "border-red-500" : "border-purple-900/50"}`}
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link href="/auth/reset-password" className="text-xs text-purple-400 hover:text-purple-300">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className={`bg-black/30 pr-10 ${errors.password ? "border-red-500" : "border-purple-900/50"}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                />
                <label
                  htmlFor="remember"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Remember me for 30 days
                </label>
              </div>
            </CardContent>

            <CardFooter>
              <Button type="submit" className="w-full bg-purple-700 hover:bg-purple-600" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </CardFooter>
          </form>
        </TabsContent>

        <TabsContent value="signup">
          <form onSubmit={handleSignUp}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className={`bg-black/30 ${errors.email ? "border-red-500" : "border-purple-900/50"}`}
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <div className="relative">
                  <Input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className={`bg-black/30 pr-10 ${errors.password ? "border-red-500" : "border-purple-900/50"}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                <p className="text-xs text-gray-400 mt-1">
                  Password must be at least 8 characters and include uppercase, lowercase, and numbers
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className={`bg-black/30 pr-10 ${errors.confirmPassword ? "border-red-500" : "border-purple-900/50"}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={termsAccepted}
                  onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                  className={`data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600 ${
                    errors.termsAccepted ? "border-red-500" : ""
                  }`}
                />
                <label
                  htmlFor="terms"
                  className={`text-sm leading-none ${errors.termsAccepted ? "text-red-500" : ""}`}
                >
                  I accept the <Link href="#" className="underline text-purple-400">Terms of Service</Link> and{" "}
                  <Link href="#" className="underline text-purple-400">Privacy Policy</Link>
                </label>
              </div>
              {errors.termsAccepted && <p className="text-red-500 text-xs">{errors.termsAccepted}</p>}
            </CardContent>

            <CardFooter>
              <Button type="submit" className="w-full bg-purple-700 hover:bg-purple-600" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </CardFooter>
          </form>
        </TabsContent>
      </Tabs>
    </Card>
  );
}

export default AuthForm;