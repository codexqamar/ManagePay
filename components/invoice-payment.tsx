"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Building2, Mail, Calendar, CheckCircle, Lock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { BackButton } from "@/components/ui/back-button"
import { useAppStore } from "@/lib/store"
import { formatCurrency } from "@/lib/currencies"
import { getInvoiceById } from "@/lib/database"
import type { Invoice } from "@/lib/supabase-types"
import { StripePaymentForm } from "@/components/stripe-payment-form"
import { useSearchParams } from "next/navigation"

interface InvoicePaymentProps {
  invoiceId: string
}

export function InvoicePayment({ invoiceId }: InvoicePaymentProps) {
  const { toast } = useToast()
  const { companies, settings } = useAppStore()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const searchParams = useSearchParams()
  const successParam = searchParams.get("success")

  useEffect(() => {
    const loadInvoice = async () => {
      setIsLoading(true)
      try {
        const data = await getInvoiceById(invoiceId)
        if (data) {
          setInvoice(data)
        } else {
          toast({
            title: "Invoice Not Found",
            description: "This invoice does not exist or you do not have access to it.",
            variant: "destructive",
          })
        }
      } catch {
        toast({
          title: "Error",
          description: "Failed to load invoice",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadInvoice()
  }, [invoiceId, toast])

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <BackButton />
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-64 bg-muted rounded"></div>
          <div className="h-48 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <BackButton />
        <Card>
          <CardContent className="pt-6 text-center">
            <h2 className="text-2xl font-bold text-foreground mb-2">Invoice Not Found</h2>
            <p className="text-muted-foreground">The invoice you&apos;re looking for doesn&apos;t exist or has been removed.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (invoice.status === "paid" || successParam === "true") {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <BackButton />
        <Card className="text-center">
          <CardContent className="pt-6">
            <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Payment Successful!</h2>
            <p className="text-muted-foreground mb-4">
              Your payment has been processed successfully.
            </p>
            <div className="bg-muted p-4 rounded-lg mb-6">
              <p className="text-sm text-muted-foreground">Amount Paid</p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(invoice.amount_in_cents / 100, invoice.currency)}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">A receipt has been sent to your email address.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const company = companies.find((c) => c.id === invoice.seller_id) || {
    name: "Your Company",
    email: invoice.client_email || "billing@company.com",
    address: "",
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <BackButton />
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Pay Invoice</h1>
        <p className="text-muted-foreground">Complete your payment securely</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Invoice Details */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Invoice Details</span>
                <Badge variant={invoice.status === "pending" ? "secondary" : "default"}>
                  {invoice.status.toUpperCase()}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{company.name}</p>
                  <p className="text-sm text-muted-foreground">{company.address}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm">{company.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm">Invoice #{invoice.id.slice(0, 8)}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(invoice.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">{invoice.description || "Invoice payment"}</p>
              </div>
              <Separator className="my-4" />
              <div className="space-y-2">
                <div className="flex justify-between font-bold text-lg pt-2">
                  <span>Total:</span>
                  <span>{formatCurrency(invoice.amount_in_cents / 100, invoice.currency)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Secure Payment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StripePaymentForm invoiceId={invoiceId} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
