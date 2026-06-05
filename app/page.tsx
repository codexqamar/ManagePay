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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged((user: AppUser | null) => {
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

  useEffect(() => {
    if (isLoggedIn) {
      router.push("/dashboard")
    }
  }, [isLoggedIn, router])

  const handleLogin = () => {}
  const handleSignup = () => {}

  // Stripi guide: Gradient mesh backdrop logic
  const AuthLayout = ({ children, title, subtitle }: { children: React.ReactNode, title: string, subtitle: string }) => (
    <div className="min-h-screen bg-canvas flex flex-col relative overflow-hidden font-sans">
      {/* Dynamic Gradient Mesh Backdrop (Top portion) */}
      <div className="absolute top-0 left-0 right-0 h-[38vh] z-0 overflow-hidden pointer-events-none">
         <svg className="absolute inset-0 w-full h-full opacity-30 blur-[80px]" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="#ffffff"/>
            <circle cx="10%" cy="10%" r="30%" fill="#f5e9d4" />
            <circle cx="90%" cy="10%" r="30%" fill="#f96bee" />
            <circle cx="50%" cy="20%" r="40%" fill="#533afd" />
            <circle cx="20%" cy="80%" r="30%" fill="#ea2261" />
         </svg>
      </div>

      {/* Content Container */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-[460px] space-y-8">
          {/* Branding */}
          <div className="text-center space-y-5">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-white rounded-lg shadow-sm border border-hairline transition-transform hover:scale-105">
              <div className="w-10 h-10 bg-primary rounded-md flex items-center justify-center shadow-sm">
                <span className="text-white text-2xl font-black italic">P</span>
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-[32px] font-bold tracking-tight text-ink leading-tight">{title}</h1>
              <p className="text-body-lg text-ink-mute font-medium">{subtitle}</p>
            </div>
          </div>
          
          {/* Form Surface */}
          <div className="bg-white p-6 sm:p-8 rounded-lg border border-hairline shadow-sm pro-shadow">
            {children}
          </div>

          {/* Institutional Footer */}
          <div className="text-center space-y-5 pt-2">
            <p className="text-micro-cap font-bold text-ink-mute uppercase tracking-[0.2em] opacity-70">Securing payments for modern entities</p>
            <div className="flex justify-center items-center gap-4 text-caption text-ink-mute-2 font-medium">
              <span>© 2026 ManagePay</span>
              <span className="w-1 h-1 rounded-full bg-hairline" />
              <button className="hover:text-primary transition-colors">Privacy</button>
              <span className="w-1 h-1 rounded-full bg-hairline" />
              <button className="hover:text-primary transition-colors">Terms</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  if (isLoggedIn === false && !showSignup && !showForgotPassword) {
    return (
      <AuthLayout 
        title="Sign in to ManagePay" 
        subtitle="Access your financial orchestration platform."
      >
        <LoginForm 
          onLogin={handleLogin}
          onSwitchToSignup={() => setShowSignup(true)}
          onSwitchToForgotPassword={() => setShowForgotPassword(true)}
        />
      </AuthLayout>
    )
  }

  if (!isLoggedIn) {
    return (
      <AuthLayout 
        title={showForgotPassword ? "Reset Password" : showSignup ? "Create Account" : "Sign In"}
        subtitle={showForgotPassword ? "Enter your email to receive a recovery link." : "Join the infrastructure powering global finance."}
      >
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
      </AuthLayout>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-canvas">
      <div className="animate-pulse flex flex-col items-center gap-6">
        <div className="w-14 h-14 bg-primary rounded-md shadow-sm" />
        <p className="text-ink font-bold tracking-tight">Authenticating Enterprise Session...</p>
      </div>
    </div>
  )
}
