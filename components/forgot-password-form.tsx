"use client"

import { useState } from "react"
import { sendPasswordReset } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft } from "lucide-react"

interface ForgotPasswordFormProps {
  onBackToLogin: () => void
  onSwitchToSignup: () => void
}

export function ForgotPasswordForm({ onBackToLogin, onSwitchToSignup }: ForgotPasswordFormProps) {
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (!email) {
        toast({
          title: "Error",
          description: "Please enter your email address"
        })
        return
      }

      console.log("Sending password reset email to:", email)
      await sendPasswordReset(email)
      console.log("Password reset email sent successfully")
      setEmailSent(true)
      
      toast({
        title: "Email Sent Successfully!",
        description: "Check your inbox for password reset instructions"
      })
      
    } catch (error: any) {
      console.error("Password reset error:", error)
      
      let errorMessage = "Failed to send reset email"
      if (error.code === 'auth/user-not-found') {
        errorMessage = "No account found with this email address"
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Invalid email address"
      }

      toast({
        title: "Error",
        description: errorMessage
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (emailSent) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Check Your Email</CardTitle>
          <CardDescription>We sent password reset instructions to your email</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center p-4 bg-green-50 rounded-md">
            <div className="text-green-600 font-medium mb-2">
              Password reset email sent to:
            </div>
            <div className="text-sm text-gray-700">{email}</div>
          </div>
          
          <div className="text-xs text-muted-foreground p-2 bg-blue-50 rounded-md">
            📧 Didn't receive the email? Check your spam folder or try again.
          </div>

          <div className="space-y-2">
            <button 
              onClick={handleSubmit} 
              className="w-full py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? "Resending..." : "Resend Email"}
            </button>
            
            <Button 
              onClick={onBackToLogin} 
              className="w-full flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Reset Password</CardTitle>
        <CardDescription>Enter your email to receive reset instructions</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Sending..." : "Send Reset Instructions"}
          </Button>
        </form>

        <div className="mt-4 space-y-2">
          <button 
            onClick={onBackToLogin}
            className="w-full py-2 flex items-center justify-center gap-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </button>
          
          <div className="text-center">
            <button 
              onClick={onSwitchToSignup}
              className="text-blue-600 hover:text-blue-800 underline bg-transparent border-none cursor-pointer"
            >
              Don't have an account? Sign up
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
