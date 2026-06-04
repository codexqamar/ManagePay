"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Plus, Trash2, Send, Eye, Copy, CheckCircle, Download, Building, User, FileText, List, FileEdit } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { EmailInvoiceDialog } from "@/components/email-invoice-dialog"
import { ShareInvoiceDialog } from "@/components/share-invoice-dialog"
import { useAppStore } from "@/lib/store"
import { CURRENCIES, formatCurrency } from "@/lib/currencies"
import { InvoicePreview } from "@/components/invoice-preview"
import { cn } from "@/lib/utils"

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  rate: number
  amount: number
}

const generateInvoiceNumber = () => `INV-${Date.now().toString().slice(-6)}`

export function InvoiceGenerator() {
  const { toast } = useToast()
  const { companies, settings } = useAppStore()
  const invoicePreviewRef = useRef<HTMLDivElement>(null)

  const [selectedCompany, setSelectedCompany] = useState<any>(null)
  const [clientName, setClientName] = useState("")
  const [clientEmail, setClientEmail] = useState("")
  const [clientAddress, setClientAddress] = useState("")
  const [invoiceNumber, setInvoiceNumber] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [selectedCurrency, setSelectedCurrency] = useState(settings.defaultCurrency)
  const [taxRate, setTaxRate] = useState<number>(settings.defaultTaxRate * 100)
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: "1", description: "", quantity: 1, rate: 0, amount: 0 },
  ])
  const [notes, setNotes] = useState("")
  const [showSharingOptions, setShowSharingOptions] = useState(false)
  const [previewInvoice, setPreviewInvoice] = useState(false)

  useEffect(() => {
    if (!invoiceNumber) {
      setInvoiceNumber(generateInvoiceNumber())
    }
  }, [invoiceNumber])

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: "",
      quantity: 1,
      rate: 0,
      amount: 0,
    }
    setItems([...items, newItem])
  }

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id))
    }
  }

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value }
          if (field === "quantity" || field === "rate") {
            updated.amount = Number(updated.quantity) * Number(updated.rate)
          }
          return updated
        }
        return item
      })
    )
  }

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0)
  const taxRateNumeric = taxRate || 0
  const tax = subtotal * (taxRateNumeric / 100)
  const total = subtotal + tax

  const invoiceData = {
    company: selectedCompany,
    client: { name: clientName, email: clientEmail, address: clientAddress },
    invoiceNumber,
    dueDate,
    currency: selectedCurrency,
    items,
    subtotal,
    tax,
    taxRate: taxRateNumeric,
    total,
    notes,
  }

  const validateForm = () => {
    if (!selectedCompany) {
      toast({ title: "Organization required", description: "Please select an entity for this invoice." })
      return false
    }
    if (!clientName.trim()) {
      toast({ title: "Client required", description: "Please enter a recipient name." })
      return false
    }
    return true
  }

  const generateInvoice = () => {
    if (!validateForm()) return
    toast({ title: "Invoice Generated", description: `Reference ${invoiceNumber} created.` })
    setShowSharingOptions(true)
  }

  const resetInvoice = () => {
    setSelectedCompany(null)
    setClientName("")
    setClientEmail("")
    setClientAddress("")
    setInvoiceNumber(generateInvoiceNumber())
    setDueDate("")
    setItems([{ id: "1", description: "", quantity: 1, rate: 0, amount: 0 }])
    setNotes("")
    setShowSharingOptions(false)
    setPreviewInvoice(false)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 py-10 px-6 font-sans">
      <div className="space-y-2 border-b border-hairline pb-8">
        <h1 className="text-display-md font-bold tracking-tight text-ink">Invoicing</h1>
        <p className="text-body-md text-ink-mute font-medium">Draft and dispatch enterprise-grade invoices.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Entity Section */}
        <Card className="bg-canvas border-hairline rounded-lg shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-heading-sm flex items-center gap-3 text-ink">
              <div className="p-2 bg-primary/5 rounded-lg">
                <Building className="w-5 h-5 text-primary" />
              </div>
              Issuing Organization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select onValueChange={(val) => setSelectedCompany(companies.find((c) => c.id === val) || null)}>
              <SelectTrigger className="h-11 rounded-sm border-hairline text-body-md">
                <SelectValue placeholder="Select issuing entity" />
              </SelectTrigger>
              <SelectContent>
                {companies.filter((c) => c.isActive).map((company) => (
                  <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Client Section */}
        <Card className="bg-canvas border-hairline rounded-lg shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-heading-sm flex items-center gap-3 text-ink">
              <div className="p-2 bg-primary/5 rounded-lg">
                <User className="w-5 h-5 text-primary" />
              </div>
              Recipient Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input 
              placeholder="Full Name" 
              value={clientName} 
              onChange={(e) => setClientName(e.target.value)} 
              className="h-11 rounded-sm border-hairline-input" 
            />
            <Input 
              type="email" 
              placeholder="Email address" 
              value={clientEmail} 
              onChange={(e) => setClientEmail(e.target.value)} 
              className="h-11 rounded-sm border-hairline-input" 
            />
          </CardContent>
        </Card>
      </div>

      {/* Invoice Particulars */}
      <Card className="bg-canvas border-hairline rounded-lg shadow-sm">
        <CardHeader className="pb-6 border-b border-hairline">
          <CardTitle className="text-heading-sm flex items-center gap-3 text-ink">
            <div className="p-2 bg-primary/5 rounded-lg">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            Invoice Particulars
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <Label className="text-micro-cap font-bold uppercase tracking-widest text-ink-mute">Reference Number</Label>
              <div className="h-11 flex items-center px-4 bg-canvas-soft rounded-sm border border-hairline font-mono text-sm text-ink-mute">
                {invoiceNumber}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-micro-cap font-bold uppercase tracking-widest text-ink-mute">Terms (Due Date)</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="h-11 rounded-sm border-hairline-input" />
            </div>
            <div className="space-y-2">
              <Label className="text-micro-cap font-bold uppercase tracking-widest text-ink-mute">Currency</Label>
              <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                <SelectTrigger className="h-11 rounded-sm border-hairline">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map(c => <SelectItem key={c.code} value={c.code}>{c.code} ({c.symbol})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator className="bg-hairline" />

          {/* Line Items */}
          <div className="space-y-6">
            <Label className="text-micro-cap font-bold uppercase tracking-widest text-ink-mute">Line Items</Label>
            {items.map((item) => (
              <div key={item.id} className="grid grid-cols-12 gap-4 items-end animate-in fade-in slide-in-from-top-1 duration-300">
                <div className="col-span-12 md:col-span-5">
                  <Input value={item.description} onChange={(e) => updateItem(item.id, "description", e.target.value)} placeholder="Service description" className="h-11 rounded-sm border-hairline-input" />
                </div>
                <div className="col-span-4 md:col-span-2">
                  <Input type="number" value={item.quantity} onChange={(e) => updateItem(item.id, "quantity", parseInt(e.target.value) || 0)} className="h-11 rounded-sm border-hairline-input text-tabular" />
                </div>
                <div className="col-span-4 md:col-span-2">
                  <Input type="number" value={item.rate} onChange={(e) => updateItem(item.id, "rate", parseFloat(e.target.value) || 0)} className="h-11 rounded-sm border-hairline-input text-tabular" />
                </div>
                <div className="col-span-3 md:col-span-2">
                  <div className="h-11 flex items-center justify-end px-4 bg-canvas-soft rounded-sm border border-hairline font-bold text-ink text-tabular">
                    {formatCurrency(item.amount, selectedCurrency)}
                  </div>
                </div>
                <div className="col-span-1">
                  <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} disabled={items.length <= 1} className="h-11 w-11 rounded-xl text-ink-mute hover:text-ruby hover:bg-ruby/5">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            <Button onClick={addItem} variant="outline" size="sm" className="font-bold gap-2">
              <Plus className="w-4 h-4" /> Add Line Item
            </Button>
          </div>

          <div className="flex justify-end pt-4">
            <div className="w-full max-w-[280px] space-y-4">
              <div className="flex justify-between text-body-md text-ink-mute font-medium">
                <span>Subtotal</span>
                <span className="text-ink text-tabular font-bold">{formatCurrency(subtotal, selectedCurrency)}</span>
              </div>
              <div className="flex justify-between items-center text-body-md text-ink-mute font-medium">
                <span className="flex items-center gap-2">Tax <Input type="number" value={taxRate} onChange={(e) => setTaxRate(Number(e.target.value))} className="w-16 h-8 text-xs p-1 text-center" />%</span>
                <span className="text-ink text-tabular font-bold">{formatCurrency(tax, selectedCurrency)}</span>
              </div>
              <Separator className="bg-hairline" />
              <div className="flex justify-between text-heading-md text-ink font-bold">
                <span>Total</span>
                <span className="text-primary text-tabular">{formatCurrency(total, selectedCurrency)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Execution Actions */}
      <Card className="bg-canvas border-hairline rounded-lg shadow-sm">
        <CardContent className="p-8">
          {!showSharingOptions ? (
            <div className="flex gap-4">
              <Button className="flex-1 h-12 text-base font-bold" onClick={generateInvoice}>
                <Send className="w-4 h-4 mr-2" /> Dispatch Invoice
              </Button>
              <Button variant="outline" className="flex-1 h-12 text-base font-bold" onClick={() => validateForm() && setPreviewInvoice(true)}>
                <Eye className="w-4 h-4 mr-2" /> Live Preview
              </Button>
            </div>
          ) : (
            <div className="text-center space-y-8 py-4 animate-in fade-in zoom-in-95 duration-500">
              <div className="mx-auto w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 border border-emerald-100">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-ink">Invoice finalized</h3>
                <p className="text-body-md text-ink-mute font-medium">Ledger entry {invoiceNumber} is ready for distribution.</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <EmailInvoiceDialog
                  invoiceId={invoiceNumber}
                  invoiceNumber={invoiceNumber}
                  clientEmail={clientEmail}
                  amount={total}
                  invoiceData={invoiceData}
                  trigger={<Button className="w-full h-11 font-bold shadow-sm">Email</Button>}
                />
                <ShareInvoiceDialog
                  invoiceId={invoiceNumber}
                  invoiceNumber={invoiceNumber}
                  amount={total}
                  trigger={<Button variant="outline" className="w-full h-11 font-bold">Get Link</Button>}
                />
                <Button variant="outline" className="h-11 font-bold" onClick={() => setPreviewInvoice(true)}>Preview</Button>
                <Button variant="ghost" className="h-11 font-bold text-ink-mute" onClick={resetInvoice}>New Draft</Button>
              </div>
            </div>
          )}

          {previewInvoice && (
            <div className="mt-12 animate-in fade-in duration-500">
              <div className="flex justify-between items-center mb-6 border-b border-hairline pb-4">
                <h3 className="text-heading-sm font-bold text-ink">Document Preview</h3>
                <Button variant="outline" size="sm" onClick={() => setPreviewInvoice(false)}>Close</Button>
              </div>
              <div className="bg-canvas-soft p-12 rounded-xl border border-hairline shadow-inner">
                <div className="bg-white shadow-xl max-w-2xl mx-auto ring-1 ring-hairline" ref={invoicePreviewRef}>
                  <InvoicePreview invoiceData={invoiceData} />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
