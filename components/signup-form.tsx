"use client"

import { useState, useCallback } from "react"
import { signOutUser, signUpWithEmail } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Eye, EyeOff, CheckCircle, XCircle, AlertCircle } from "lucide-react"

interface SignupFormProps {
  onSignup: () => void
  onSwitchToLogin: () => void
}

interface ValidationRules {
  minLength: boolean
  hasUpperCase: boolean
  hasLowerCase: boolean
  hasNumber: boolean
  hasSpecialChar: boolean
}

export function SignupForm({ onSignup, onSwitchToLogin }: SignupFormProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [emailError, setEmailError] = useState("")
  const [passwordErrors, setPasswordErrors] = useState<ValidationRules>({
    minLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false
  })

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
    const errors = {
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    }
    setPasswordErrors(errors)
    return Object.values(errors).every(Boolean)
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
    return formData.name && 
           formData.email && 
           !emailError && 
           formData.password && 
           Object.values(passwordErrors).every(Boolean) && 
           formData.confirmPassword && 
           formData.password === formData.confirmPassword
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Final validation
      if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
        toast({ title: "Error", description: "Please fill all fields" })
        return
      }

      if (emailError) {
        toast({ title: "Error", description: "Please enter a valid email address" })
        return
      }

      if (!Object.values(passwordErrors).every(Boolean)) {
        toast({ title: "Error", description: "Please fix password requirements" })
        return
      }

      if (formData.password !== formData.confirmPassword) {
        toast({ title: "Error", description: "Passwords don't match" })
        return
      }

      console.log("Starting signup process...")

      const user = await signUpWithEmail(formData.email, formData.password, formData.name)
      console.log("User created:", user?.email)

      // Sign out user immediately after signup
      await signOutUser()
      console.log("User signed out")

      toast({
        title: "Account Created Successfully! ✅",
        description: "Verification email sent to " + formData.email + ". Please check your inbox (and spam folder)."
      })

      // Switch to login page
      onSwitchToLogin()
      
    } catch (error: any) {
      console.error("Signup error:", error)
      
      let errorMessage = "Signup failed"
      if (error.message?.toLowerCase().includes("already registered")) {
        errorMessage = "Email already in use"
      } else if (error.message?.toLowerCase().includes("password")) {
        errorMessage = error.message
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Invalid email address"
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "Password is too weak"
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = "Network error. Please check your connection"
      }

      toast({
        title: "Signup Failed",
        description: errorMessage
      })
    } finally {
      setIsLoading(false)
    }
  }

  const ValidationItem = ({ valid, text }: { valid: boolean; text: string }) => (
    <div className={`flex items-center gap-2 text-xs ${valid ? 'text-green-600' : 'text-gray-500'}`}>
      {valid ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
      {text}
    </div>
  )

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Sign Up</CardTitle>
        <CardDescription>Create your account to get started</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
            />
          </div>

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
                placeholder="At least 8 characters"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Password Requirements */}
            {formData.password && (
              <div className="space-y-1 p-3 bg-gray-50 rounded-md">
                <div className="text-xs font-medium text-gray-700 mb-2">Password must contain:</div>
                <div className="grid grid-cols-1 gap-1">
                  <ValidationItem valid={passwordErrors.minLength} text="At least 8 characters" />
                  <ValidationItem valid={passwordErrors.hasUpperCase} text="One uppercase letter" />
                  <ValidationItem valid={passwordErrors.hasLowerCase} text="One lowercase letter" />
                  <ValidationItem valid={passwordErrors.hasNumber} text="One number" />
                  <ValidationItem valid={passwordErrors.hasSpecialChar} text="One special character" />
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <div className="flex items-center gap-2 text-red-600 text-xs">
                <AlertCircle className="w-3 h-3" />
                Passwords do not match
              </div>
            )}
          </div>
          
          <div className="text-xs text-muted-foreground p-2 bg-yellow-50 rounded-md">
            📧 After signup, check your email inbox AND spam folder for verification link.
          </div>
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading || !isFormValid()}
          >
            {isLoading ? "Creating Account..." : "Sign Up"}
          </Button>
        </form>
        
        <div className="mt-4 text-center">
          <button 
            onClick={onSwitchToLogin}
            className="w-full py-2 text-blue-600 hover:text-blue-800 hover:bg-gray-100 rounded-md transition-colors"
          >
            Already have an account? Login
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
