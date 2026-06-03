"use client"

import { useState, useEffect } from "react"
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
import { InvoiceGenerator } from "@/components/invoice-generator"
import { Sidebar } from "@/components/sidebar"
import { useToast } from "@/hooks/use-toast"

export default function HomePage() {
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
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        
          <div className="px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Payemnet Terminal</h1>
                <p className="text-muted-foreground">Manage invoices,payments and track your business revenue</p>
              </div>
              
            
            </div>
          </div>
       

        <div className="p-6">
          <InvoiceGenerator />
        </div>
      </main>
    </div>
  )
}
