"use client"

import { useState, useCallback } from "react"
import { isUserEmailVerified, signInWithEmail, signOutUser } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [emailError, setEmailError] = useState("")
  const [passwordError, setPasswordError] = useState("")

  // Email validation - useCallback to prevent recreating function
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

  // Password validation - useCallback to prevent recreating function
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

  // Handle input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Validate only after input change
    if (field === 'email') {
      validateEmail(value)
    } else if (field === 'password') {
      validatePassword(value)
    }
  }

  // Check if form is valid
  const isFormValid = () => {
    return formData.email && 
           !emailError && 
           formData.password && 
           !passwordError
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Final validation
      if (!formData.email || !formData.password) {
        toast({
          title: "Error",
          description: "Please fill all fields"
        })
        return
      }

      if (emailError) {
        toast({
          title: "Error",
          description: "Please enter a valid email address"
        })
        return
      }

      if (passwordError) {
        toast({
          title: "Error",
          description: "Please enter a valid password"
        })
        return
      }

      const user = await signInWithEmail(formData.email, formData.password)

      // Check if email is verified
      if (!isUserEmailVerified(user)) {
        await signOutUser()
        toast({
          title: "Email Not Verified",
          description: "Please verify your email before logging in. Check your inbox and spam folder."
        })
        return
      }

      toast({
        title: "Login Successful",
        description: "Welcome back!"
      })
      onLogin()
      
    } catch (error: any) {
      console.error("Login error:", error)
      
      let errorMessage = "Login failed"
      if (error.message?.toLowerCase().includes("invalid login credentials")) {
        errorMessage = "Invalid email or password"
      } else if (error.message?.toLowerCase().includes("email not confirmed")) {
        errorMessage = "Please verify your email before logging in"
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Invalid email address"
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = "No account found with this email address"
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = "Incorrect password"
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Too many attempts. Try again later"
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = "This account has been disabled"
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = "Network error. Please check your connection"
      }

      toast({
        title: "Login Failed",
        description: errorMessage
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Login</CardTitle>
        <CardDescription>Enter your credentials to access your account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              required
              className={emailError ? "border-red-500" : ""}
            />
            {emailError && (
              <div className="flex items-center gap-2 text-red-600 text-xs">
                <AlertCircle className="w-3 h-3" />
                {emailError}
              </div>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                required
                className={`pr-10 ${passwordError ? "border-red-500" : ""}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {passwordError && (
              <div className="flex items-center gap-2 text-red-600 text-xs">
                <AlertCircle className="w-3 h-3" />
                {passwordError}
              </div>
            )}
          </div>

          {/* Forgot Password Link */}
          <div className="text-right">
            <button 
              type="button"
              onClick={onSwitchToForgotPassword}
              className="p-0 h-auto text-sm text-blue-600 hover:text-blue-800 underline bg-transparent border-none cursor-pointer"
            >
              Forgot your password?
            </button>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading || !isFormValid()}
          >
            {isLoading ? "Logging in..." : "Login"}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <button 
            onClick={onSwitchToSignup}
            className="w-full py-2 text-blue-600 hover:text-blue-800 hover:bg-gray-100 rounded-md transition-colors"
          >
            Don't have an account? Sign up
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
