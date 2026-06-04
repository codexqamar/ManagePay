"use client"

import { useState } from "react"
import { sendPasswordReset } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, MailCheck } from "lucide-react"

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
      if (!email) throw new Error("Please enter your email address")
      await sendPasswordReset(email)
      setEmailSent(true)
      toast({ title: "Email Sent", description: "Check your inbox for reset instructions." })
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to send reset email" })
    } finally {
      setIsLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="w-full space-y-8 text-center animate-in fade-in zoom-in-95 duration-500">
        <div className="mx-auto w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
          <MailCheck className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-ink">Check your inbox</h2>
          <p className="text-body-md text-ink-mute font-medium px-4">
            We sent a secure recovery link to <span className="text-ink font-bold">{email}</span>.
          </p>
        </div>
        
        <div className="space-y-4 pt-4 border-t border-hairline">
          <Button 
            onClick={handleSubmit} 
            variant="outline"
            className="w-full h-11 font-bold shadow-sm"
            disabled={isLoading}
          >
            {isLoading ? "Resending..." : "Resend Link"}
          </Button>
          
          <button 
            onClick={onBackToLogin} 
            className="w-full flex items-center justify-center gap-2 text-sm font-bold text-ink-mute hover:text-ink transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to sign in
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-body-md font-medium text-ink">Registered Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="jane@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-11 rounded-sm border-hairline-input focus:ring-primary"
          />
        </div>

        <Button type="submit" className="w-full h-11 text-base font-bold shadow-sm" disabled={isLoading}>
          {isLoading ? "Sending link..." : "Send Reset Link"}
        </Button>
      </form>

      <div className="pt-6 border-t border-hairline flex flex-col items-center gap-4">
        <button 
          onClick={onBackToLogin}
          className="flex items-center justify-center gap-2 text-sm font-bold text-ink-mute hover:text-ink transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to sign in
        </button>
        
        <button 
          onClick={onSwitchToSignup}
          className="text-xs font-bold text-primary hover:text-primary-deep transition-colors"
        >
          Don't have an account? Create one
        </button>
      </div>
    </div>
  )
}
