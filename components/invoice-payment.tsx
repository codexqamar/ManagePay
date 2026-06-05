"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Building2, Mail, Calendar, CheckCircle, Lock, FileText, ArrowLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { BackButton } from "@/components/ui/back-button"
import { formatCurrency } from "@/lib/currencies"
import type { Invoice } from "@/lib/supabase-types"
import { StripePaymentForm } from "@/components/stripe-payment-form"
import { useSearchParams } from "next/navigation"

interface InvoicePaymentProps {
  invoiceId: string
}

export function InvoicePayment({ invoiceId }: InvoicePaymentProps) {
  const { toast } = useToast()
  const invoiceRef = useRef<HTMLDivElement>(null)
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const searchParams = useSearchParams()
  const successParam = searchParams.get("success")

  useEffect(() => {
    const loadInvoice = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/invoices/${invoiceId}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "This invoice does not exist or has been removed.")
        }

        setInvoice(data)
      } catch (error) {
        toast({
          title: "Invoice Not Found",
          description: error instanceof Error ? error.message : "Failed to load invoice",
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
    const currency = invoice.currency.toUpperCase()

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
                {formatCurrency(invoice.amount_in_cents / 100, currency)}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">A receipt has been sent to your email address.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const metadata = (invoice.metadata || {}) as {
    invoiceNumber?: string
    dueDate?: string
    company?: {
      name?: string
      email?: string
      address?: string
      phone?: string
    }
    client?: {
      name?: string
      email?: string
      address?: string
      companyName?: string
    }
    items?: Array<{
      id?: string
      description?: string
      quantity?: number
      rate?: number
      amount?: number
    }>
    subtotal?: number
    tax?: number
    taxRate?: number
    notes?: string
  }

  const company = metadata.company || {
    name: "Your Company",
    email: "",
    address: "",
  }
  const client = metadata.client || {
    name: "Client",
    email: invoice.client_email,
    address: "",
  }
  const items = metadata.items || []
  const displayInvoiceNumber = invoice.invoice_number || metadata.invoiceNumber || invoice.id.slice(0, 8)
  const displayDueDate = invoice.due_date || metadata.dueDate
  const currency = invoice.currency.toUpperCase()

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 font-sans">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <BackButton />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
        {/* Main Invoice Content */}
        <div ref={invoiceRef} className="bg-canvas border border-hairline rounded-2xl shadow-sm overflow-hidden">
          {/* Header/Branding */}
          <div className="p-8 sm:p-12 border-b border-hairline bg-canvas-soft">
            <div className="flex flex-col sm:flex-row justify-between gap-8">
              <div className="space-y-4">
                {company.logoUrl ? (
                  <img src={company.logoUrl} alt={company.name} className="h-12 w-auto object-contain mb-4" />
                ) : (
                  <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-bold text-ink">{company.name}</h2>
                  <p className="text-ink-mute text-sm">{company.email}</p>
                  <p className="text-ink-mute text-sm whitespace-pre-line mt-1">{company.address}</p>
                </div>
              </div>
              <div className="text-left sm:text-right space-y-1">
                <Badge variant={invoice.status === "paid" ? "success" : "secondary"} className="mb-2 rounded-full px-4 py-1 uppercase tracking-wider text-[10px] font-black">
                  {invoice.status}
                </Badge>
                <h1 className="text-display-sm font-bold text-ink">Invoice</h1>
                <p className="text-ink-mute font-mono text-sm">#{displayInvoiceNumber}</p>
                <div className="pt-4 space-y-1 text-sm">
                  <p className="text-ink-mute">Date Issued: <span className="text-ink font-bold">{new Date(invoice.created_at).toLocaleDateString("en-GB")}</span></p>
                  {displayDueDate && (
                    <p className="text-ink-mute">Due Date: <span className="text-ink font-bold">{new Date(displayDueDate).toLocaleDateString("en-GB")}</span></p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Billing Info */}
          <div className="p-8 sm:p-12 grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="space-y-2">
              <p className="text-micro-cap font-black text-ink-mute uppercase tracking-widest">Bill To</p>
              <div className="space-y-1">
                <p className="font-bold text-ink text-lg">{client.name}</p>
                {client.companyName && <p className="text-ink-mute font-medium">{client.companyName}</p>}
                <p className="text-ink-mute">{client.email}</p>
                <p className="text-ink-mute text-sm whitespace-pre-line mt-2">{client.address}</p>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="px-8 sm:px-12 pb-8">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-hairline text-micro-cap font-black text-ink-mute uppercase tracking-widest">
                    <th className="py-4 font-black">Description</th>
                    <th className="py-4 text-center font-black">Qty</th>
                    <th className="py-4 text-right font-black">Rate</th>
                    <th className="py-4 text-right font-black">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {items.length > 0 ? (
                    items.map((item, index) => (
                      <tr key={item.id || index} className="text-sm">
                        <td className="py-5 font-medium text-ink">
                          {item.description || "Service item"}
                        </td>
                        <td className="py-5 text-center text-tabular text-ink-mute">
                          {item.quantity || 0}
                        </td>
                        <td className="py-5 text-right text-tabular text-ink-mute">
                          {formatCurrency(item.rate || 0, currency)}
                        </td>
                        <td className="py-5 text-right text-tabular font-bold text-ink">
                          {formatCurrency(item.amount || 0, currency)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-5 text-ink-mute italic">
                        {invoice.description || "General service payment"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals Section */}
          <div className="p-8 sm:p-12 bg-canvas-soft flex flex-col items-end border-t border-hairline">
            <div className="w-full sm:w-64 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-ink-mute font-medium">Subtotal</span>
                <span className="text-ink font-bold text-tabular">{formatCurrency(metadata.subtotal || (invoice.amount_in_cents / 100), currency)}</span>
              </div>
              {typeof metadata.tax === "number" && metadata.tax > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-ink-mute font-medium">Tax ({metadata.taxRate || 0}%)</span>
                  <span className="text-ink font-bold text-tabular">{formatCurrency(metadata.tax, currency)}</span>
                </div>
              )}
              <Separator className="bg-hairline" />
              <div className="flex justify-between items-baseline pt-2">
                <span className="text-lg font-bold text-ink">Total</span>
                <span className="text-2xl font-black text-primary text-tabular">
                  {formatCurrency(invoice.amount_in_cents / 100, currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Footer/Notes */}
          {metadata.notes && (
            <div className="p-8 sm:p-12 border-t border-hairline">
              <p className="text-micro-cap font-black text-ink-mute uppercase tracking-widest mb-3">Notes</p>
              <p className="text-sm text-ink-mute leading-relaxed whitespace-pre-line">
                {metadata.notes}
              </p>
            </div>
          )}
        </div>

        {/* Payment Sidebar */}
        <div className="space-y-6 lg:sticky lg:top-8">
          {invoice.status === "pending" && successParam !== "true" ? (
            <Card className="rounded-2xl border-hairline shadow-sm overflow-hidden">
              <CardHeader className="bg-canvas-soft border-b border-hairline">
                <CardTitle className="text-heading-sm flex items-center gap-2 text-ink">
                  <Lock className="h-4 w-4 text-primary" />
                  Secure Payment
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="mb-6">
                  <p className="text-xs text-ink-mute font-bold uppercase tracking-widest mb-1">Paying To</p>
                  <p className="font-bold text-ink">{company.name}</p>
                </div>
                <StripePaymentForm invoiceId={invoiceId} />
                <div className="mt-6 flex items-center justify-center gap-2 text-[10px] text-ink-mute font-bold uppercase tracking-widest">
                  <CheckCircle className="h-3 w-3 text-emerald-500" />
                  SSL Encrypted & Secure
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-2xl border-emerald-100 bg-emerald-50/50 shadow-none">
              <CardContent className="pt-8 text-center space-y-4">
                <div className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-emerald-900">Payment Received</h3>
                <p className="text-emerald-700/80 text-sm font-medium">
                  This invoice was paid on {new Date(invoice.updated_at).toLocaleDateString("en-GB")}.
                </p>
              </CardContent>
            </Card>
          )}

          <div className="text-center px-4">
            <p className="text-xs text-ink-mute font-medium">
              Having trouble? Contact support at <br />
              <span className="font-bold text-primary">{company.email}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

