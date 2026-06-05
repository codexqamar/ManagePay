"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { isUserEmailVerified, signInWithEmail, signOutUser } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Eye, EyeOff, AlertCircle } from "lucide-react"

interface LoginFormProps {
  onLogin: () => void
  onSwitchToSignup: () => void
  onSwitchToForgotPassword: () => void
}

export function LoginForm({ onLogin, onSwitchToSignup, onSwitchToForgotPassword }: LoginFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [emailError, setEmailError] = useState("")
  const [passwordError, setPasswordError] = useState("")

  const validateEmail = useCallback((email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email) {
      setEmailError("")
      return false
    }
    if (!emailRegex.test(email)) {
      setEmailError("Please enter a valid email address")
      return false
    }
    setEmailError("")
    return true
  }, [])

  const validatePassword = useCallback((password: string) => {
    if (!password) {
      setPasswordError("")
      return false
    }
    if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters")
      return false
    }
    setPasswordError("")
    return true
  }, [])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (field === 'email') validateEmail(value)
    else if (field === 'password') validatePassword(value)
  }

  const isFormValid = () => {
    return formData.email && !emailError && formData.password && !passwordError
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (!formData.email || !formData.password) throw new Error("Please fill all fields")
      if (emailError) throw new Error("Please enter a valid email address")
      if (passwordError) throw new Error("Please enter a valid password")

      const user = await signInWithEmail(formData.email, formData.password)

      if (!isUserEmailVerified(user)) {
        await signOutUser()
        toast({
          title: "Email Not Verified",
          description: "Please verify your email before logging in."
        })
        return
      }

      toast({ title: "Login Successful", description: "Welcome back!" })
      onLogin()
      router.push("/dashboard")
      
    } catch (error: any) {
      toast({ title: "Login Failed", description: error.message || "Invalid credentials" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full space-y-6">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-body-md font-medium text-ink">Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="name@company.co.uk"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            required
            className={cn("h-11 rounded-sm border-hairline-input focus:ring-primary", emailError && "border-ruby")}
          />
          {emailError && (
            <div className="flex items-center gap-2 text-ruby text-xs font-medium">
              <AlertCircle className="w-3 h-3" />
              {emailError}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" title="Password" className="text-body-md font-medium text-ink">Password</Label>
            <button 
              type="button"
              onClick={onSwitchToForgotPassword}
              className="text-xs font-bold text-primary hover:text-primary-deep"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              required
              className={cn("h-11 pr-10 rounded-sm border-hairline-input focus:ring-primary", passwordError && "border-ruby")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-mute hover:text-ink transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {passwordError && (
            <div className="flex items-center gap-2 text-ruby text-xs font-medium">
              <AlertCircle className="w-3 h-3" />
              {passwordError}
            </div>
          )}
        </div>

        <Button 
          type="submit" 
          className="w-full h-11 text-base font-bold shadow-sm" 
          disabled={isLoading || !isFormValid()}
        >
          {isLoading ? "Signing in..." : "Continue"}
        </Button>
      </form>

      <div className="pt-4 border-t border-hairline">
        <button 
          onClick={onSwitchToSignup}
          className="w-full py-2 text-ink-secondary text-sm font-bold hover:text-ink transition-colors"
        >
          Don't have an account? <span className="text-primary hover:text-primary-deep">Sign up</span>
        </button>
      </div>
    </div>
  )
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ")
}
