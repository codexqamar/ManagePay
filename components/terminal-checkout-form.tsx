"use client"

import { useState } from "react"
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface TerminalCheckoutFormProps {
  onSuccess: (transactionId: string) => void
  onCancel: () => void
  amount: number
  currency: string
}

export function TerminalCheckoutForm({ onSuccess, onCancel, amount, currency }: TerminalCheckoutFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setIsLoading(true)

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    })

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      })
      setIsLoading(false)
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      toast({
        title: "Payment Successful",
        description: "The payment has been processed successfully.",
      })
      onSuccess(paymentIntent.id)
    } else {
      toast({
        title: "Payment Status Unknown",
        description: "Please check the dashboard for the payment status.",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} className="w-full">
          Cancel
        </Button>
        <Button type="submit" disabled={!stripe || isLoading} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            `Pay ${new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount)}`
          )}
        </Button>
      </div>
    </form>
  )
}
