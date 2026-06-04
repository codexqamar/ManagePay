"use client"

import { useState, useCallback } from "react"
import { signOutUser, signUpWithEmail } from "@/lib/auth"
import { Button } from "@/components/ui/button"
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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (field === 'email') validateEmail(value)
    else if (field === 'password') validatePassword(value)
  }

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
      if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) throw new Error("Please fill all fields")
      if (emailError) throw new Error("Please enter a valid email address")
      if (!Object.values(passwordErrors).every(Boolean)) throw new Error("Please fix password requirements")
      if (formData.password !== formData.confirmPassword) throw new Error("Passwords don't match")

      await signUpWithEmail(formData.email, formData.password, formData.name)
      await signOutUser()

      toast({
        title: "Account Created Successfully! ✅",
        description: "Check your email for the verification link."
      })
      onSwitchToLogin()
      
    } catch (error: any) {
      toast({ title: "Signup Failed", description: error.message || "Something went wrong" })
    } finally {
      setIsLoading(false)
    }
  }

  const ValidationItem = ({ valid, text }: { valid: boolean; text: string }) => (
    <div className={`flex items-center gap-2 text-[11px] font-bold ${valid ? 'text-emerald-600' : 'text-ink-mute'}`}>
      {valid ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3 opacity-30" />}
      {text}
    </div>
  )

  return (
    <div className="w-full space-y-8">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-body-md font-medium text-ink">Full Name</Label>
          <Input
            id="name"
            type="text"
            placeholder="Jane Doe"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            required
            className="h-11 rounded-sm border-hairline-input focus:ring-primary"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-body-md font-medium text-ink">Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="jane@company.com"
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
          <Label htmlFor="password" title="Password" className="text-body-md font-medium text-ink">Security Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              required
              className="h-11 pr-10 rounded-sm border-hairline-input focus:ring-primary"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-mute hover:text-ink transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {formData.password && (
            <div className="space-y-2 p-4 bg-canvas-soft rounded-md border border-hairline mt-2">
              <div className="text-[11px] font-black uppercase tracking-widest text-ink-mute opacity-70 mb-1">Security Requirements</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4">
                <ValidationItem valid={passwordErrors.minLength} text="8+ characters" />
                <ValidationItem valid={passwordErrors.hasUpperCase} text="Uppercase" />
                <ValidationItem valid={passwordErrors.hasLowerCase} text="Lowercase" />
                <ValidationItem valid={passwordErrors.hasNumber} text="Numbers" />
                <ValidationItem valid={passwordErrors.hasSpecialChar} text="Special Symbols" />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" title="Confirm Password" className="text-body-md font-medium text-ink">Confirm Password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              required
              className="h-11 pr-10 rounded-sm border-hairline-input focus:ring-primary"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-mute hover:text-ink transition-colors"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        
        <div className="text-xs text-ink-mute p-3 bg-canvas-soft rounded-lg border border-hairline/60 font-medium">
          Note: We will send a verification link to your inbox.
        </div>
        
        <Button 
          type="submit" 
          className="w-full h-11 text-base font-bold shadow-sm" 
          disabled={isLoading || !isFormValid()}
        >
          {isLoading ? "Provisioning..." : "Create Account"}
        </Button>
      </form>
      
      <div className="pt-4 border-t border-hairline">
        <button 
          onClick={onSwitchToLogin}
          className="w-full py-2 text-ink-secondary text-sm font-bold hover:text-ink transition-colors"
        >
          Already an entity member? <span className="text-primary hover:text-primary-deep transition-colors">Sign in</span>
        </button>
      </div>
    </div>
  )
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ")
}
