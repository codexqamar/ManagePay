import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Share2, Copy, Mail, MessageSquare, QrCode, Download, LinkIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { QRCodeCanvas } from "qrcode.react"
import { formatCurrency } from "@/lib/currencies"

interface ShareInvoiceDialogProps {
  invoiceId: string
  invoiceNumber: string
  amount: number
  trigger?: React.ReactNode
}

export function ShareInvoiceDialog({ invoiceId, invoiceNumber, amount, trigger }: ShareInvoiceDialogProps) {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [emailAddress, setEmailAddress] = useState("")
  const [whatsappNumber, setWhatsappNumber] = useState("")
  const [activeTab, setActiveTab] = useState("link")

  // 🔑 Main Change: paymentUrl ab /terminal hamesha
  const paymentUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/terminal`
  const shortUrl = `pay.ly/${invoiceId.slice(-8)}`

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: `${type} Copied!`,
      description: "Share this with your client",
    })
  }

  const sendSMS = () => {
    if (!phoneNumber) {
      toast({
        title: "Phone Number Required",
        description: "Please enter the client's phone number",
        variant: "destructive",
      })
      return
    }

    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
    if (!phoneRegex.test(phoneNumber.replace(/[\s\(\)\-]/g, ''))) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid phone number",
        variant: "destructive",
      })
      return
    }

    const smsText = `Invoice Payment Request\n\nInvoice #: ${invoiceNumber}\nAmount: ${formatCurrency(amount)}\n\nPlease pay securely here: ${paymentUrl}\n\nThank you!`

    const smsUrl = `sms:${phoneNumber}?body=${encodeURIComponent(smsText)}`
    window.location.href = smsUrl

    toast({
      title: "SMS Ready!",
      description: "Your messaging app will open with the payment details",
    })

    setPhoneNumber("")
  }

  const sendWhatsApp = () => {
  if (!whatsappNumber) {
    toast({
      title: "WhatsApp Number Required",
      description: "Please enter the client's WhatsApp number",
      variant: "destructive",
    })
    return
  }

  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
  const cleanedNumber = whatsappNumber.replace(/[\s\(\)\-]/g, '')

  if (!phoneRegex.test(cleanedNumber)) {
    toast({
      title: "Invalid WhatsApp Number",
      description: "Please enter a valid WhatsApp number",
      variant: "destructive",
    })
    return
  }

  // ✅ Link same line pe, no extra newline after it
  const whatsappText = `Invoice Payment Request

Invoice #: ${invoiceNumber}
Amount: ${formatCurrency(amount)}

Please pay securely here: ${paymentUrl} 
Thank you!`

  const whatsappUrl = `https://wa.me/${cleanedNumber}?text=${encodeURIComponent(whatsappText)}`
  window.location.href = whatsappUrl

  toast({
    title: "WhatsApp Opened!",
    description: "WhatsApp is open with your invoice template",
  })

  setWhatsappNumber("")
}


  const sendEmail = () => {
    if (!emailAddress) {
      toast({
        title: "Email Required",
        description: "Please enter the client's email address",
        variant: "destructive",
      })
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(emailAddress)) {
      toast({
        title: "Invalid Email Address",
        description: "Please enter a valid email address",
        variant: "destructive",
      })
      return
    }

    const subject = `Invoice ${invoiceNumber} - Payment Request of ${formatCurrency(amount)}`
    const body = `
Dear Client,

Invoice Details:
-------------------------------
Invoice Number: ${invoiceNumber}
Amount Due: ${formatCurrency(amount)}
Due Date: ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("en-GB")}
-------------------------------

Please make your payment using the following link:
${paymentUrl}

Payment Instructions:
1. Click the payment link above
2. Select your preferred payment method
3. Complete the payment process

If you have any questions, please don't hesitate to contact us.

Thank you for your business!

Sincerely
    `.trim()

    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
      emailAddress
    )}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.open(gmailUrl, "_blank")

    toast({
      title: "Gmail Opened!",
      description: "Gmail is open with your invoice template",
    })

    setEmailAddress("")
  }

  const downloadQRCode = () => {
    const canvas = document.querySelector<HTMLCanvasElement>("#invoice-qr")
    if (!canvas) return

    const link = document.createElement("a")
    link.download = `invoice-${invoiceNumber}-qrcode.png`
    link.href = canvas.toDataURL("image/png")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "QR Code Downloaded!",
      description: "QR code saved to your device",
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Share2 className="h-4 w-4" />
            Share Invoice
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden rounded-lg">
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Share2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl">Share Invoice</DialogTitle>
              <DialogDescription className="mt-1">
                Share invoice {invoiceNumber} with your client via multiple methods
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="link" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-4 rounded-none px-6 py-0 h-12 bg-background">
            <TabsTrigger value="link" className="py-3 flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Link</span>
            </TabsTrigger>
            <TabsTrigger value="email" className="py-3 flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">Email</span>
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="py-3 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">WhatsApp</span>
            </TabsTrigger>
            <TabsTrigger value="qr" className="py-3 flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              <span className="hidden sm:inline">QR Code</span>
            </TabsTrigger>
          </TabsList>

          <div className="px-6 pb-6 pt-4">
            {/* Link Tab */}
            <TabsContent value="link" className="space-y-4 mt-0">
              <div>
                <Label htmlFor="payment-link" className="text-sm font-medium mb-2 block">
                  Payment Link
                </Label>
                <div className="flex items-center gap-2">
                  <Input id="payment-link" value={paymentUrl} readOnly className="font-mono text-sm" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(paymentUrl, "Payment Link")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="short-link" className="text-sm font-medium mb-2 block">
                  Short Link
                </Label>
                <div className="flex items-center gap-2">
                  <Input id="short-link" value={shortUrl} readOnly className="font-mono text-sm" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(shortUrl, "Short Link")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Email Tab */}
            <TabsContent value="email" className="space-y-4 mt-0">
              <Label htmlFor="email" className="text-sm font-medium mb-2 block">
                Client Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                placeholder="client@example.co.uk"
              />

              <Button onClick={sendEmail} className="w-full gap-2 py-2 h-11">
                <Mail className="h-4 w-4" />
                Compose Email
              </Button>
            </TabsContent>

            {/* WhatsApp Tab */}
            <TabsContent value="whatsapp" className="space-y-4 mt-0">
              <Label htmlFor="whatsapp" className="text-sm font-medium mb-2 block">
                Client WhatsApp Number
              </Label>
              <Input
                id="whatsapp"
                type="tel"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="+44 20 0000 0000"
              />

              <Button onClick={sendWhatsApp} className="w-full gap-2 py-2 h-11">
                <MessageSquare className="h-4 w-4" />
                Send WhatsApp
              </Button>
            </TabsContent>

            {/* QR Tab */}
            <TabsContent value="qr" className="space-y-4 mt-0">
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div
                    className="w-48 h-48 bg-white rounded-lg border-2 flex items-center justify-center p-4 shadow-sm cursor-pointer"
                    onClick={() => (window.location.href = "/terminal")}
                    title="Click to open payment terminal"
                  >
                    <QRCodeCanvas id="invoice-qr" value={`${window.location.origin}/terminal`} size={160} />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button onClick={downloadQRCode} variant="outline" className="flex-1 gap-2 py-2 h-11">
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                  <Button
                    onClick={() => (window.location.href = "/terminal")}
                    className="flex-1 gap-2 py-2 h-11"
                  >
                    <QrCode className="h-4 w-4" />
                    Open Payment
                  </Button>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
