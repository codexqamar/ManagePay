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
import { Share2, Copy, Mail, MessageSquare, QrCode, Download, LinkIcon, FileText, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { QRCodeCanvas } from "qrcode.react"
import { formatCurrency } from "@/lib/currencies"
import { getInvoicePaymentUrl } from "@/lib/utils"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"

interface ShareInvoiceDialogProps {
  invoiceId: string
  invoiceNumber: string
  amount: number
  currency?: string
  clientEmail?: string
  trigger?: React.ReactNode
  invoiceData?: any // Added to support PDF generation
}

export function ShareInvoiceDialog({ 
  invoiceId, 
  invoiceNumber, 
  amount, 
  currency = "GBP", 
  clientEmail = "", 
  trigger,
  invoiceData 
}: ShareInvoiceDialogProps) {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [emailAddress, setEmailAddress] = useState(clientEmail)
  const [whatsappNumber, setWhatsappNumber] = useState("")
  const [activeTab, setActiveTab] = useState("link")
  const [isExporting, setIsExporting] = useState(false)

  const paymentUrl = getInvoicePaymentUrl(invoiceId, invoiceData?.company)
  const shortUrl = `pay.ly/${invoiceId.slice(-8)}`

  const downloadPDF = async () => {
    // This requires the invoice preview to be rendered somewhere, 
    // but since this is a shared dialog, we'll implement a robust way 
    // to generate the PDF if invoiceData is provided.
    if (!invoiceData) {
      toast({
        title: "Data Missing",
        description: "Cannot generate PDF without invoice details.",
        variant: "destructive",
      })
      return
    }

    setIsExporting(true)
    try {
      // Create a hidden element to render the invoice for PDF generation
      const printElement = document.createElement("div")
      printElement.style.position = "absolute"
      printElement.style.left = "-9999px"
      printElement.style.top = "0"
      printElement.style.width = "800px" // Standard width for capture
      document.body.appendChild(printElement)

      // We'll use a highly professional, print-optimized version of the invoice layout
      printElement.innerHTML = `
        <div style="padding: 60px; font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif; background: white; color: #1c1e54; line-height: 1.5;">
          <!-- Header -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 60px; border-bottom: 2px solid #533afd; padding-bottom: 30px;">
            <div>
              ${invoiceData.company?.logoUrl ? 
                `<div style="background: ${invoiceData.company.logoHasDarkBg ? '#0d253d' : 'transparent'}; padding: 12px; border-radius: 12px; display: inline-block; margin-bottom: 20px; box-shadow: ${invoiceData.company.logoHasDarkBg ? '0 4px 6px rgba(0,0,0,0.1)' : 'none'};">
                   <img src="${invoiceData.company.logoUrl}" style="height: 50px; width: auto; object-fit: contain; display: block;" />
                 </div>` : 
                `<h1 style="font-size: 42px; font-weight: 800; margin: 0; color: #533afd; letter-spacing: -1px;">INVOICE</h1>`
              }
              <p style="font-size: 16px; color: #64748d; margin: 5px 0 0 0; font-family: monospace; font-weight: 600;">#${invoiceNumber}</p>
            </div>
            <div style="text-align: right;">
              <h2 style="font-size: 24px; font-weight: 700; color: #1e293b; margin: 0 0 5px 0;">${invoiceData.company?.name || 'Company Name'}</h2>
              <p style="font-size: 14px; color: #64748d; margin: 0 0 3px 0;">${invoiceData.company?.email || ''}</p>
              ${invoiceData.company?.phone ? `<p style="font-size: 14px; color: #64748d; margin: 0 0 3px 0;">${invoiceData.company.phone}</p>` : ''}
              <p style="font-size: 14px; color: #64748d; margin: 0; white-space: pre-line;">${invoiceData.company?.address || ''}</p>
            </div>
          </div>
          
          <!-- Info Grid -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 50px;">
            <div>
              <p style="font-size: 11px; font-weight: 800; color: #64748d; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px;">Bill To</p>
              <p style="font-size: 18px; font-weight: 700; margin: 0 0 4px 0;">${invoiceData.client?.name || 'Client'}</p>
              <p style="font-size: 14px; color: #64748d; margin: 0 0 4px 0;">${invoiceData.client?.email || ''}</p>
              <p style="font-size: 13px; color: #94a3b8; margin: 0; max-width: 280px; line-height: 1.4;">${invoiceData.client?.address || ''}</p>
            </div>
            <div style="text-align: right;">
              <p style="font-size: 11px; font-weight: 800; color: #64748d; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px;">Details</p>
              <div style="display: inline-block; text-align: left;">
                <div style="display: flex; justify-content: space-between; gap: 30px; margin-bottom: 6px;">
                  <span style="font-size: 13px; color: #64748d; font-weight: 600;">Issued:</span>
                  <span style="font-size: 13px; font-weight: 700;">${new Date().toLocaleDateString("en-GB")}</span>
                </div>
                <div style="display: flex; justify-content: space-between; gap: 30px;">
                  <span style="font-size: 13px; color: #64748d; font-weight: 600;">Due:</span>
                  <span style="font-size: 13px; font-weight: 700;">${invoiceData.dueDate ? new Date(invoiceData.dueDate).toLocaleDateString("en-GB") : 'Upon Receipt'}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Table -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 50px;">
            <thead>
              <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                <th style="padding: 15px 20px; text-align: left; font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 1px;">Description</th>
                <th style="padding: 15px 20px; text-align: center; font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 1px;">Qty</th>
                <th style="padding: 15px 20px; text-align: right; font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 1px;">Rate</th>
                <th style="padding: 15px 20px; text-align: right; font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 1px;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${(invoiceData.items || []).map((item: any) => `
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 20px;">
                    ${item.serviceName ? `<p style="font-size: 9px; font-weight: 800; color: #533afd; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 4px 0;">${item.serviceName}</p>` : ''}
                    <p style="font-size: 14px; font-weight: 600; color: #1e293b; margin: 0;">${item.description}</p>
                  </td>
                  <td style="padding: 20px; font-size: 14px; text-align: center; color: #64748d; font-weight: 500;">${item.quantity}</td>
                  <td style="padding: 20px; font-size: 14px; text-align: right; color: #64748d; font-weight: 500;">${formatCurrency(item.rate, currency)}</td>
                  <td style="padding: 20px; font-size: 14px; text-align: right; font-weight: 700; color: #0f172a;">${formatCurrency(item.amount, currency)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <!-- Totals -->
          <div style="display: flex; justify-content: flex-end;">
            <div style="width: 320px; background: #f8fafc; padding: 30px; border-radius: 12px; border: 1px solid #e2e8f0;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px;">
                <span style="color: #64748d; font-weight: 600;">Subtotal</span>
                <span style="font-weight: 700; color: #1e293b;">${formatCurrency(invoiceData.subtotal, currency)}</span>
              </div>
              ${invoiceData.tax > 0 ? `
                <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px;">
                  <span style="color: #64748d; font-weight: 600;">Tax (${invoiceData.taxRate}%)</span>
                  <span style="font-weight: 700; color: #1e293b;">${formatCurrency(invoiceData.tax, currency)}</span>
                </div>
              ` : ''}
              <div style="height: 2px; background: #e2e8f0; margin: 15px 0;"></div>
              <div style="display: flex; justify-content: space-between; align-items: baseline;">
                <span style="font-size: 18px; font-weight: 800; color: #1e293b;">Total</span>
                <span style="font-size: 24px; font-weight: 900; color: #533afd;">${formatCurrency(invoiceData.total, currency)}</span>
              </div>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="margin-top: 80px; padding-top: 30px; border-top: 1px solid #e2e8f0; text-align: center;">
            <p style="font-size: 13px; font-weight: 600; color: #1c1e54; margin-bottom: 20px;">Thank you for your business!</p>
            
            <!-- Professional Pay Button -->
            <div style="display: inline-block; padding: 16px 48px; background: #533afd; color: white; border-radius: 12px; font-size: 14px; font-weight: 800; text-decoration: none; text-transform: uppercase; letter-spacing: 2px; box-shadow: 0 4px 12px rgba(83, 58, 253, 0.25);">
              Pay Now
            </div>
            
            <p style="font-size: 11px; color: #94a3b8; margin-top: 15px; font-weight: 500;">
              Secure payment processed by Stripe
            </p>
          </div>
        </div>
      `

      const canvas = await html2canvas(printElement, {
        scale: 3, // High resolution for professional print look
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      })
      
      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })
      
      const imgProps = pdf.getImageProperties(imgData)
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width
      
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight)

      // Add a clickable link overlay on top of the "Pay Now" button area
      // Since the button is centered at the bottom, we add a link annotation
      const linkY = (pdfHeight > 250) ? 250 : pdfHeight - 40; // Approximate position
      pdf.link(pdfWidth / 4, linkY, pdfWidth / 2, 20, { url: paymentUrl })
      
      pdf.save(`Invoice-${invoiceNumber}.pdf`)
      
      document.body.removeChild(printElement)
      
      toast({
        title: "PDF Downloaded",
        description: "Invoice PDF generated successfully.",
      })
    } catch (error) {
      console.error("PDF generation failed:", error)
      toast({
        title: "Export Failed",
        description: "Could not generate PDF. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

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

    const smsText = `Invoice Payment Request\n\nInvoice #: ${invoiceNumber}\nAmount: ${formatCurrency(amount, currency)}\n\nPlease pay securely here: ${paymentUrl}\n\nThank you!`

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
Amount: ${formatCurrency(amount, currency)}

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

    const subject = `Invoice ${invoiceNumber} - Payment Request of ${formatCurrency(amount, currency)}`
    const body = `
Dear Client,

Invoice Details:
-------------------------------
Invoice Number: ${invoiceNumber}
Amount Due: ${formatCurrency(amount, currency)}
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
          <TabsList className="w-full grid grid-cols-5 rounded-none px-6 py-0 h-12 bg-background">
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
              <span className="hidden sm:inline">QR</span>
            </TabsTrigger>
            <TabsTrigger value="pdf" className="py-3 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">PDF</span>
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
                    onClick={() => (window.location.href = paymentUrl)}
                    title="Click to open payment page"
                  >
                    <QRCodeCanvas id="invoice-qr" value={paymentUrl} size={160} />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button onClick={downloadQRCode} variant="outline" className="flex-1 gap-2 py-2 h-11">
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                  <Button
                    onClick={() => (window.location.href = paymentUrl)}
                    className="flex-1 gap-2 py-2 h-11"
                  >
                    <QrCode className="h-4 w-4" />
                    Open Payment
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* PDF Tab */}
            <TabsContent value="pdf" className="space-y-4 mt-0">
              <div className="text-center space-y-4 py-4">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Generate PDF Invoice</h3>
                  <p className="text-sm text-ink-mute">
                    Download a professional PDF copy of this invoice to share offline.
                  </p>
                </div>
                <Button 
                  onClick={downloadPDF} 
                  disabled={isExporting}
                  className="w-full gap-2 py-2 h-11"
                >
                  {isExporting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {isExporting ? "Generating PDF..." : "Download PDF Invoice"}
                </Button>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
