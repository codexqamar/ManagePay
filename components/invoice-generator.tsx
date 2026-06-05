"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import Link from "next/link"
import {
  AlertCircle,
  Building,
  CheckCircle,
  Eye,
  FileText,
  Loader2,
  Plus,
  Send,
  Trash2,
  User,
  History,
  ArrowUpRight,
  MoreVertical,
  Copy,
  Calendar,
  ExternalLink,
  Share2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { EmailInvoiceDialog } from "@/components/email-invoice-dialog"
import { InvoicePreview } from "@/components/invoice-preview"
import { ShareInvoiceDialog } from "@/components/share-invoice-dialog"
import { useToast } from "@/hooks/use-toast"
import { CURRENCIES, formatCurrency } from "@/lib/currencies"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import type { Client, Invoice } from "@/lib/supabase-types"
import { useAppStore } from "@/lib/store"

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  rate: number
  amount: number
}

const generateInvoiceNumber = () => `INV-${Date.now().toString().slice(-6)}`

function createLineItem(): InvoiceItem {
  return {
    id: crypto.randomUUID(),
    description: "",
    quantity: 1,
    rate: 0,
    amount: 0,
  }
}

function getInvoiceErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "Failed to create invoice."
  const normalized = message.toLowerCase()

  if (normalized.includes("clients") && normalized.includes("does not exist")) {
    return "The clients table is missing in Supabase. Apply migration 00003 first."
  }

  if (normalized.includes("invoices") && normalized.includes("does not exist")) {
    return "The invoices table is missing in Supabase. Apply the definitive migration 00004."
  }

  if (normalized.includes("row-level security") || normalized.includes("permission denied")) {
    return "Supabase blocked this request. Check the invoices RLS policy and your signed-in session."
  }

  return message
}

export function InvoiceGenerator() {
  const { toast } = useToast()
  const { companies, settings } = useAppStore()

  const [clients, setClients] = useState<Client[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCompanyId, setSelectedCompanyId] = useState("")
  const [selectedClientId, setSelectedClientId] = useState("")
  const [invoiceNumber, setInvoiceNumber] = useState("") // Start empty to avoid hydration mismatch
  const [dueDate, setDueDate] = useState("")
  const [selectedCurrency, setSelectedCurrency] = useState(settings.defaultCurrency)
  const [taxRate, setTaxRate] = useState<number>(settings.defaultTaxRate * 100)
  const [items, setItems] = useState<InvoiceItem[]>([]) // Start empty to avoid hydration mismatch
  const [notes, setNotes] = useState("")
  const [previewInvoice, setPreviewInvoice] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [savedInvoice, setSavedInvoice] = useState<Invoice | null>(null)
  const [activeTab, setActiveTab] = useState("generator")

  const selectedCompany = companies.find((company) => company.id === selectedCompanyId) || null
  const selectedClient = clients.find((client) => client.id === selectedClientId) || null

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = getSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()

      // Initialize defaults only on client mount
      if (!invoiceNumber) {
        setInvoiceNumber(generateInvoiceNumber())
      }
      if (items.length === 0) {
        setItems([createLineItem()])
      }

      if (!user) return

      // Parallel fetch clients and invoices
      const [clientsRes, invoicesRes] = await Promise.all([
        supabase.from("clients").select("*").eq("user_id", user.id).eq("is_active", true).order("name"),
        supabase.from("invoices").select("*").eq("seller_id", user.id).order("created_at", { ascending: false })
      ])

      if (clientsRes.error) throw clientsRes.error
      if (invoicesRes.error) throw invoicesRes.error

      setClients(clientsRes.data as Client[])
      setInvoices(invoicesRes.data as Invoice[])
    } catch (error) {
      toast({
        title: "Error loading data",
        description: getInvoiceErrorMessage(error),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadData()
  }, [loadData])

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.amount, 0), [items])
  const tax = subtotal * ((taxRate || 0) / 100)
  const total = subtotal + tax

  const invoiceData = {
    company: selectedCompany,
    client: {
      id: selectedClient?.id || "",
      name: selectedClient?.name || "",
      email: selectedClient?.email || "",
      address: selectedClient?.address || "",
      phone: selectedClient?.phone || "",
      companyName: selectedClient?.company_name || "",
    },
    invoiceNumber,
    dueDate,
    currency: selectedCurrency,
    items,
    subtotal,
    tax,
    taxRate: taxRate || 0,
    total,
    notes,
  }

  const addItem = () => {
    setItems((current) => [...current, createLineItem()])
    setSavedInvoice(null)
  }

  const removeItem = (id: string) => {
    setItems((current) => (current.length > 1 ? current.filter((item) => item.id !== id) : current))
    setSavedInvoice(null)
  }

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setItems((current) =>
      current.map((item) => {
        if (item.id !== id) return item
        const updated = { ...item, [field]: value }
        if (field === "quantity" || field === "rate") {
          updated.amount = Number(updated.quantity) * Number(updated.rate)
        }
        return updated
      }),
    )
    setSavedInvoice(null)
  }

  const resetInvoice = () => {
    setSelectedClientId("")
    setInvoiceNumber(generateInvoiceNumber())
    setDueDate("")
    setItems([createLineItem()])
    setNotes("")
    setPreviewInvoice(false)
    setSavedInvoice(null)
  }

  const validateForm = () => {
    if (!selectedCompany) {
      toast({ title: "Organisation required", description: "Select a company first.", variant: "destructive" })
      return false
    }
    if (!selectedClient) {
      toast({ title: "Client required", description: "Select a saved client first.", variant: "destructive" })
      return false
    }
    if (items.every((item) => !item.description.trim() || item.amount <= 0)) {
      toast({ title: "Line item required", description: "Add at least one billable item.", variant: "destructive" })
      return false
    }
    return true
  }

  const saveInvoice = async () => {
    if (!validateForm()) return

    setIsSaving(true)
    try {
      const supabase = getSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) throw new Error("Please sign in again.")

      const description = items.find((item) => item.description.trim())?.description.trim() || `Invoice ${invoiceNumber}`

      const { data, error } = await supabase
        .from("invoices")
        .insert({
          invoice_number: invoiceNumber,
          seller_id: user.id,
          client_id: selectedClient!.id,
          client_email: selectedClient!.email,
          amount_in_cents: Math.round(total * 100),
          currency: selectedCurrency.toLowerCase(),
          description,
          due_date: dueDate || null,
          status: "pending",
          metadata: {
            company: {
              ...selectedCompany!,
              logoUrl: selectedCompany!.logoUrl,
              paymentBaseUrl: selectedCompany!.paymentBaseUrl,
            },
            client: invoiceData.client,
            items,
            subtotal,
            tax,
            taxRate,
            total,
            notes,
          },
        })
        .select()
        .single()

      if (error) throw error

      setSavedInvoice(data as Invoice)
      setInvoices(prev => [data as Invoice, ...prev])
      setPreviewInvoice(false)
      toast({ title: "Invoice created", description: `${invoiceNumber} saved successfully.` })
    } catch (error) {
      toast({ title: "Error", description: getInvoiceErrorMessage(error), variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const activeCompanies = companies.filter((company) => company.isActive)

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 font-sans sm:px-6 lg:px-8 lg:py-8">
      <div className="flex flex-col gap-5 border-b border-hairline pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-display-md font-bold tracking-tight text-ink">Invoicing</h1>
          <p className="text-body-md font-medium text-ink-mute">Generate and manage professional payment requests.</p>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full lg:w-auto">
          <TabsList className="grid w-full grid-cols-2 bg-canvas-soft p-1 lg:w-[400px]">
            <TabsTrigger value="generator" className="data-[state=active]:bg-canvas data-[state=active]:shadow-sm">
              <FileText className="mr-2 h-4 w-4" />
              Generator
            </TabsTrigger>
            <TabsTrigger value="invoices" className="data-[state=active]:bg-canvas data-[state=active]:shadow-sm">
              <History className="mr-2 h-4 w-4" />
              Saved Invoices
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsContent value="generator" className="m-0 focus-visible:outline-none">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Card className="rounded-lg border-hairline bg-canvas shadow-sm">
                  <CardHeader className="border-b border-hairline pb-4">
                    <CardTitle className="flex items-center gap-3 text-heading-sm text-ink">
                      <div className="rounded-lg bg-primary/5 p-2">
                        <Building className="h-5 w-5 text-primary" />
                      </div>
                      Issuing Company
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-5">
                    {activeCompanies.length > 0 ? (
                      <Select value={selectedCompanyId} onValueChange={(value) => { setSelectedCompanyId(value); setSavedInvoice(null) }}>
                        <SelectTrigger className="h-11 rounded-md border-hairline">
                          <SelectValue placeholder="Select company" />
                        </SelectTrigger>
                        <SelectContent>
                          {activeCompanies.map((company) => (
                            <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-800">
                        Add an active company first.
                      </div>
                    )}
                    {selectedCompany && (
                      <div className="rounded-md border border-hairline bg-canvas-soft p-3 text-sm">
                        <p className="font-bold text-ink">{selectedCompany.name}</p>
                        <p className="text-ink-mute">{selectedCompany.email}</p>
                      </div>
                    )}
                    <Link href="/companies" className="text-xs font-bold text-primary hover:underline">Manage companies</Link>
                  </CardContent>
                </Card>

                <Card className="rounded-lg border-hairline bg-canvas shadow-sm">
                  <CardHeader className="border-b border-hairline pb-4">
                    <CardTitle className="flex items-center gap-3 text-heading-sm text-ink">
                      <div className="rounded-lg bg-primary/5 p-2">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      Target Client
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-5">
                    {loading ? (
                      <div className="flex h-11 items-center gap-2 rounded-md border border-hairline px-3 text-sm text-ink-mute">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading clients
                      </div>
                    ) : clients.length > 0 ? (
                      <Select value={selectedClientId} onValueChange={(value) => { setSelectedClientId(value); setSavedInvoice(null) }}>
                        <SelectTrigger className="h-11 rounded-md border-hairline">
                          <SelectValue placeholder="Select client" />
                        </SelectTrigger>
                        <SelectContent>
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                        Add a client first.
                      </div>
                    )}
                    {selectedClient && (
                      <div className="rounded-md border border-hairline bg-canvas-soft p-3 text-sm">
                        <p className="font-bold text-ink">{selectedClient.name}</p>
                        <p className="text-ink-mute">{selectedClient.email}</p>
                      </div>
                    )}
                    <Link href="/clients" className="text-xs font-bold text-primary hover:underline">Manage clients</Link>
                  </CardContent>
                </Card>
              </div>

              <Card className="rounded-lg border-hairline bg-canvas shadow-sm">
                <CardHeader className="border-b border-hairline pb-5">
                  <CardTitle className="flex items-center gap-3 text-heading-sm text-ink">
                    <div className="rounded-lg bg-primary/5 p-2">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    Invoice Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-7 pt-6">
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label className="text-micro-cap font-bold text-ink-mute uppercase tracking-widest">Reference</Label>
                      <Input value={invoiceNumber} onChange={(e) => { setInvoiceNumber(e.target.value); setSavedInvoice(null) }} className="h-11 font-mono" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-micro-cap font-bold text-ink-mute uppercase tracking-widest">Due Date</Label>
                      <Input type="date" value={dueDate} onChange={(e) => { setDueDate(e.target.value); setSavedInvoice(null) }} className="h-11" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-micro-cap font-bold text-ink-mute uppercase tracking-widest">Currency</Label>
                      <Select value={selectedCurrency} onValueChange={(v) => { setSelectedCurrency(v); setSavedInvoice(null) }}>
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CURRENCIES.map((c) => <SelectItem key={c.code} value={c.code}>{c.code} ({c.symbol})</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="grid grid-cols-12 gap-3 px-1 text-micro-cap font-black text-ink-mute uppercase tracking-widest">
                      <span className="col-span-12 md:col-span-5">Description</span>
                      <span className="col-span-4 md:col-span-2">Qty</span>
                      <span className="col-span-4 md:col-span-2">Rate</span>
                      <span className="col-span-3 md:col-span-2 text-right">Amount</span>
                    </div>
                    {items.map((item) => (
                      <div key={item.id} className="grid grid-cols-12 items-end gap-3">
                        <div className="col-span-12 md:col-span-5">
                          <Input value={item.description} onChange={(e) => updateItem(item.id, "description", e.target.value)} placeholder="Service description" className="h-11" />
                        </div>
                        <div className="col-span-4 md:col-span-2">
                          <Input type="number" min="0" value={item.quantity} onChange={(e) => updateItem(item.id, "quantity", Number(e.target.value) || 0)} className="h-11 text-tabular" />
                        </div>
                        <div className="col-span-4 md:col-span-2">
                          <Input type="number" min="0" step="0.01" value={item.rate} onChange={(e) => updateItem(item.id, "rate", Number(e.target.value) || 0)} className="h-11 text-tabular" />
                        </div>
                        <div className="col-span-3 md:col-span-2">
                          <div className="flex h-11 items-center justify-end rounded-md border border-hairline bg-canvas-soft px-3 text-sm font-bold text-ink text-tabular">
                            {formatCurrency(item.amount, selectedCurrency)}
                          </div>
                        </div>
                        <div className="col-span-1">
                          <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} disabled={items.length <= 1} className="h-11 w-11 hover:text-ruby">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button onClick={addItem} variant="outline" size="sm" className="font-bold">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Line Item
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
                    <div className="space-y-2">
                      <Label className="text-micro-cap font-bold text-ink-mute uppercase tracking-widest">Notes</Label>
                      <Textarea value={notes} onChange={(e) => { setNotes(e.target.value); setSavedInvoice(null) }} placeholder="Payment terms or notes" rows={5} />
                    </div>
                    <div className="space-y-4 rounded-lg border border-hairline bg-canvas-soft p-4">
                      <div className="flex justify-between text-body-md text-ink-mute">
                        <span>Subtotal</span>
                        <span className="font-bold text-ink text-tabular">{formatCurrency(subtotal, selectedCurrency)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3 text-body-md text-ink-mute">
                        <span className="flex items-center gap-2">Tax <Input type="number" value={taxRate} onChange={(e) => { setTaxRate(Number(e.target.value)); setSavedInvoice(null) }} className="h-8 w-16 p-1 text-center text-xs" /> %</span>
                        <span className="font-bold text-ink text-tabular">{formatCurrency(tax, selectedCurrency)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-heading-md font-bold text-ink">
                        <span>Total</span>
                        <span className="text-primary text-tabular">{formatCurrency(total, selectedCurrency)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="rounded-lg border-hairline bg-canvas shadow-sm">
                <CardHeader className="border-b border-hairline pb-4">
                  <CardTitle className="text-heading-sm text-ink">Invoice Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-5">
                  {savedInvoice ? (
                    <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
                      <div className="flex items-center gap-2 font-bold"><CheckCircle className="h-4 w-4" /> Saved Successfully</div>
                      <p className="mt-2 text-sm">Payment link is now active and ready for sharing.</p>
                    </div>
                  ) : (
                    <div className="rounded-md border border-hairline bg-canvas-soft p-4 text-ink-mute">
                      <div className="flex items-center gap-2 font-bold text-ink"><AlertCircle className="h-4 w-4" /> Draft not saved</div>
                      <p className="mt-2 text-sm">Create the invoice to generate a shareable payment link.</p>
                    </div>
                  )}

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-ink-mute">Reference</span><span className="font-bold text-ink">{invoiceNumber}</span></div>
                    <div className="flex justify-between"><span className="text-ink-mute">Total</span><span className="font-bold text-primary">{formatCurrency(total, selectedCurrency)}</span></div>
                  </div>

                  <div className="space-y-3 pt-2">
                    {!savedInvoice ? (
                      <Button className="w-full h-11 font-bold" onClick={saveInvoice} disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                        Create Invoice
                      </Button>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <EmailInvoiceDialog
                            invoiceId={savedInvoice.id}
                            invoiceNumber={invoiceNumber}
                            clientEmail={selectedClient?.email}
                            amount={total}
                            invoiceData={invoiceData}
                            trigger={<Button className="h-11 w-full font-bold">Email</Button>}
                          />
                          <ShareInvoiceDialog
                            invoiceId={savedInvoice.id}
                            invoiceNumber={invoiceNumber}
                            amount={total}
                            currency={selectedCurrency}
                            clientEmail={selectedClient?.email || ""}
                            trigger={<Button variant="outline" className="h-11 w-full font-bold">Share</Button>}
                          />
                        </div>
                        <Button variant="outline" className="w-full h-11 font-bold" onClick={() => setPreviewInvoice(!previewInvoice)}>
                          <Eye className="mr-2 h-4 w-4" />
                          {previewInvoice ? "Hide Preview" : "Show Preview"}
                        </Button>
                        <Button variant="ghost" className="w-full h-11 font-bold text-ink-mute" onClick={resetInvoice}>New Draft</Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
              {previewInvoice && (
                <div className="rounded-lg border border-hairline bg-canvas-soft p-3">
                  <InvoicePreview invoiceData={invoiceData} />
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="invoices" className="m-0 focus-visible:outline-none">
          <Card className="rounded-lg border-hairline bg-canvas shadow-sm">
            <CardHeader className="border-b border-hairline pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-heading-sm text-ink">Recent Invoices</CardTitle>
                <Button variant="ghost" size="sm" onClick={loadData} className="text-ink-mute">
                  <Loader2 className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-ink-mute">
                  <Loader2 className="h-8 w-8 animate-spin mb-4" />
                  <p className="font-medium">Fetching your invoices...</p>
                </div>
              ) : invoices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-ink-mute">
                  <FileText className="h-12 w-12 mb-4 opacity-20" />
                  <p className="font-medium">No invoices found</p>
                  <Button variant="link" onClick={() => setActiveTab("generator")} className="mt-2">Create your first invoice</Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-hairline bg-canvas-soft text-micro-cap font-black text-ink-mute uppercase tracking-widest">
                        <th className="px-6 py-4">Reference</th>
                        <th className="px-6 py-4">Client</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Amount</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-hairline">
                      {invoices.map((invoice) => (
                        <tr key={invoice.id} className="hover:bg-canvas-soft transition-colors group">
                          <td className="px-6 py-4 font-mono font-bold text-ink">{invoice.invoice_number}</td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-ink">{invoice.client_email}</div>
                            <div className="text-xs text-ink-mute">{invoice.description}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-ink-mute">
                            {new Date(invoice.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 font-bold text-ink">
                            {formatCurrency(invoice.amount_in_cents / 100, invoice.currency)}
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant={invoice.status === 'paid' ? 'success' : 'secondary'} className="rounded-md capitalize">
                              {invoice.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <ShareInvoiceDialog
                                invoiceId={invoice.id}
                                invoiceNumber={invoice.invoice_number}
                                amount={invoice.amount_in_cents / 100}
                                currency={invoice.currency}
                                clientEmail={invoice.client_email}
                                invoiceData={invoice.metadata} // Pass metadata for PDF generation
                                trigger={
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-ink-mute hover:text-primary">
                                    <Share2 className="h-4 w-4" />
                                  </Button>
                                }
                              />
                              <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-ink-mute hover:text-primary">
                                <Link href={`/pay/${invoice.id}`} target="_blank">
                                  <ExternalLink className="h-4 w-4" />
                                </Link>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}