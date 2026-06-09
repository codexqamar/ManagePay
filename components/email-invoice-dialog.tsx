"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Send, Copy, Link, Mail, Eye, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { InvoicePreview } from "@/components/invoice-preview"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCurrency } from "@/lib/currencies"
import { getInvoicePaymentUrl } from "@/lib/utils"

interface EmailInvoiceDialogProps {
  invoiceId: string
  invoiceNumber: string
  clientEmail?: string
  amount: number
  trigger?: React.ReactNode
  invoiceData: any // Add this prop to receive the full invoice data
}

export function EmailInvoiceDialog({
  invoiceId,
  invoiceNumber,
  clientEmail = "",
  amount,
  trigger,
  invoiceData, // Receive the invoice data
}: EmailInvoiceDialogProps) {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [email, setEmail] = useState(clientEmail)
  const [subject, setSubject] = useState(`Invoice ${invoiceNumber} - Payment Required`)
  const [message, setMessage] = useState(
    `Dear Client,\n\nPlease find your invoice ${invoiceNumber} for ${formatCurrency(amount, invoiceData?.currency)} attached. You can pay this invoice securely using the link below.\n\nThank you for your business!\n\nBest regards`,
  )
  const [includePaymentLink, setIncludePaymentLink] = useState(true)
  const [sendCopy, setSendCopy] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [activeTab, setActiveTab] = useState("compose")

  const paymentUrl = getInvoicePaymentUrl(invoiceId, invoiceData?.company)

  const sendEmail = async () => {
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter the client's email address",
        variant: "destructive",
      })
      return
    }

    setIsSending(true)

    try {
      const response = await fetch("/api/send-invoice-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
        to: email,
        subject,
        message,
        invoiceId,
        paymentUrl: includePaymentLink ? paymentUrl : null,
        sendCopy,
        }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send invoice email")
      }

      toast({
        title: "Email Sent Successfully!",
        description: `Invoice ${invoiceNumber} has been sent to ${email}`,
      })

      setIsOpen(false)
    } catch (error) {
      toast({
        title: "Failed to Send Email",
        description: error instanceof Error ? error.message : "There was an error sending the invoice email",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  const copyPaymentLink = () => {
    navigator.clipboard.writeText(paymentUrl)
    toast({
      title: "Payment Link Copied!",
      description: "Share this link with your client",
    })
  }

  const downloadInvoice = () => {
    // Function to download invoice as PDF
    toast({
      title: "Download Started",
      description: "Invoice download will be implemented with PDF generation",
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Send className="h-4 w-4 mr-2" />
            Send Invoice
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Invoice via Email
          </DialogTitle>
          <DialogDescription>
            Send invoice {invoiceNumber} to your client with a secure payment link
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="compose">Compose Email</TabsTrigger>
            <TabsTrigger value="preview">Preview Invoice</TabsTrigger>
          </TabsList>

          <TabsContent value="compose" className="space-y-6 mt-4">
            {/* Email Details */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Client Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="client@example.co.uk"
                />
              </div>

              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
              </div>

              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  className="resize-none"
                />
              </div>
            </div>

            {/* Options */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Include Payment Link</Label>
                  <p className="text-sm text-muted-foreground">Add a secure payment link to the email</p>
                </div>
                <Switch checked={includePaymentLink} onCheckedChange={setIncludePaymentLink} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Send Copy to Me</Label>
                  <p className="text-sm text-muted-foreground">Receive a copy of this email</p>
                </div>
                <Switch checked={sendCopy} onCheckedChange={setSendCopy} />
              </div>
            </div>

            {/* Payment Link Preview */}
            {includePaymentLink && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium">Payment Link</Label>
                  <Button variant="ghost" size="sm" onClick={copyPaymentLink}>
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </Button>
                </div>
                <div className="flex items-center gap-2 p-2 bg-background rounded border">
                  <Link className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-mono truncate">{paymentUrl}</span>
                </div>
              </div>
            )}

            {/* Invoice Summary */}
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Invoice Summary</span>
                <Badge variant="outline">{invoiceNumber}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>Amount:</span>
                <span className="font-medium">{formatCurrency(amount, invoiceData?.currency)}</span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="mt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Invoice Preview</h3>
              <Button variant="outline" size="sm" onClick={downloadInvoice}>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
            <div className="overflow-x-auto">
              <div className="min-w-full">
                <InvoicePreview invoiceData={invoiceData} />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setIsOpen(false)} className="w-full sm:w-auto">
            Cancel
          </Button>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => setActiveTab(activeTab === "compose" ? "preview" : "compose")}
              className="w-full sm:w-auto"
            >
              <Eye className="h-4 w-4 mr-2" />
              {activeTab === "compose" ? "Preview Invoice" : "Back to Email"}
            </Button>
            <Button onClick={sendEmail} disabled={isSending || !email} className="w-full sm:w-auto">
              {isSending ? (
                <>
                  <Send className="h-4 w-4 mr-2 animate-pulse" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Invoice
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
