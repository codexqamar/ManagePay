"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  getUserDisplayName,
  isUserEmailVerified,
  onAuthStateChanged,
  signOutUser,
  type AppUser,
} from "@/lib/auth"
import { LoginForm } from "@/components/login-form"
import { SignupForm } from "@/components/signup-form"
import { ForgotPasswordForm } from "@/components/forgot-password-form"
import { useToast } from "@/hooks/use-toast"

export default function HomePage() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false)
  const [showSignup, setShowSignup] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [user, setUser] = useState<{ email?: string; name: string } | null>(null)
  const { toast } = useToast()

  // Simple auth check - run only once
  useEffect(() => {
    console.log("Auth check running...")
    const unsubscribe = onAuthStateChanged((user: AppUser | null) => {
      console.log("Auth state:", user ? "Logged in" : "Logged out")
      if (user && isUserEmailVerified(user)) {
        setIsLoggedIn(true)
        setUser({
          email: user.email,
          name: getUserDisplayName(user),
        })
      } else {
        setIsLoggedIn(false)
        setUser(null)
      }
    })

    return () => unsubscribe()
  }, [])

  // Redirect authenticated users to the dashboard
  useEffect(() => {
    if (isLoggedIn) {
      router.push("/dashboard")
    }
  }, [isLoggedIn, router])

  const handleLogin = () => {
    // Handled by auth state
  }

  const handleSignup = () => {
    // Handled by auth state  
  }

  const handleLogout = async () => {
    try {
      await signOutUser()
      toast({
        title: "Logged out",
        description: "You have been logged out successfully"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to logout"
      })
    }
  }

  // Show loading only briefly
  if (isLoggedIn === false && !showSignup && !showForgotPassword) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <LoginForm 
            onLogin={handleLogin}
            onSwitchToSignup={() => setShowSignup(true)}
            onSwitchToForgotPassword={() => setShowForgotPassword(true)}
          />
        </div>
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {showForgotPassword ? (
            <ForgotPasswordForm 
              onBackToLogin={() => setShowForgotPassword(false)}
              onSwitchToSignup={() => {
                setShowForgotPassword(false)
                setShowSignup(true)
              }}
            />
          ) : showSignup ? (
            <SignupForm 
              onSignup={handleSignup}
              onSwitchToLogin={() => setShowSignup(false)}
            />
          ) : (
            <LoginForm 
              onLogin={handleLogin}
              onSwitchToSignup={() => setShowSignup(true)}
              onSwitchToForgotPassword={() => setShowForgotPassword(true)}
            />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center h-full">
      <p className="text-muted-foreground">Redirecting to dashboard...</p>
    </div>
  )
}
