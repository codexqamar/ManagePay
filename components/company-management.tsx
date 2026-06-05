"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Building2, Plus, Edit, Trash2, Settings, CreditCard, BarChart3, Users, Upload, X, Globe, Phone, MapPin, Hash, Link as LinkIcon, Loader2, Mail } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAppStore } from "@/lib/store"
import { formatCurrency } from "@/lib/currencies"
import { getSupabaseBrowserClient } from "@/lib/supabase"

export function CompanyManagement() {
  const { toast } = useToast()
  const { companies, settings, addCompany, updateCompany, deleteCompany, toggleCompanyStatus } = useAppStore()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    address: "",
    phone: "",
    website: "",
    logoUrl: "",
    paymentBaseUrl: "",
    taxId: "",
  })

  const [stripeStatus, setStripeStatus] = useState<"connected" | "disconnected" | "checking">("checking")

  useEffect(() => {
    checkStripeConnection()
  }, [])

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast({ title: "Invalid file", description: "Please upload an image file.", variant: "destructive" })
      return
    }

    setIsUploading(true)
    try {
      const supabase = getSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`
      
      const { error: uploadError, data } = await supabase.storage
        .from('company-logos')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('company-logos')
        .getPublicUrl(fileName)

      setFormData(prev => ({ ...prev, logoUrl: publicUrl }))
      toast({ title: "Logo uploaded", description: "Your company logo has been saved." })
    } catch (error) {
      toast({ title: "Upload failed", description: error instanceof Error ? error.message : "Failed to upload logo", variant: "destructive" })
    } finally {
      setIsUploading(false)
    }
  }

  const handleSaveCompany = () => {
    if (!formData.name || !formData.email) {
      toast({ title: "Required fields", description: "Name and Email are mandatory.", variant: "destructive" })
      return
    }

    if (editingCompanyId) {
      updateCompany(editingCompanyId, formData)
      toast({ title: "Company updated", description: `${formData.name} has been updated.` })
    } else {
      addCompany({ ...formData, isActive: true })
      toast({ title: "Company added", description: `${formData.name} is ready for use.` })
    }

    closeDialog()
  }

  const openAddDialog = () => {
    setEditingCompanyId(null)
    setFormData({
      name: "",
      email: "",
      address: "",
      phone: "",
      website: "",
      logoUrl: "",
      paymentBaseUrl: "",
      taxId: "",
    })
    setIsAddDialogOpen(true)
  }

  const openEditDialog = (company: any) => {
    setEditingCompanyId(company.id)
    setFormData({
      name: company.name,
      email: company.email,
      address: company.address,
      phone: company.phone || "",
      website: company.website || "",
      logoUrl: company.logoUrl || "",
      paymentBaseUrl: company.paymentBaseUrl || "",
      taxId: company.taxId || "",
    })
    setIsAddDialogOpen(true)
  }

  const closeDialog = () => {
    setIsAddDialogOpen(false)
    setEditingCompanyId(null)
  }

  const checkStripeConnection = async () => {
    try {
      const isConnected = await verifyStripeConnection()
      setStripeStatus(isConnected ? "connected" : "disconnected")
    } catch (error) {
      console.error("Failed to check Stripe connection:", error)
      setStripeStatus("disconnected")
    }
  }

  const verifyStripeConnection = async (): Promise<boolean> => {
    try {
      const res = await fetch("/api/stripe/status")
      const data = await res.json()
      return data.connected === true
    } catch {
      return false
    }
  }

  const formatCurrencyWithSettings = (amount: number) => {
    return formatCurrency(amount, settings.defaultCurrency)
  }

  const handleToggleStatus = (id: string) => {
    const company = companies.find((c) => c.id === id)
    toggleCompanyStatus(id)

    toast({
      title: `Company ${company?.isActive ? "Deactivated" : "Activated"}`,
      description: `${company?.name} is now ${company?.isActive ? "inactive" : "active"}`,
    })
  }

  const handleDeleteCompany = (id: string) => {
    const company = companies.find((c) => c.id === id)
    deleteCompany(id)

    toast({
      title: "Company Deleted",
      description: `${company?.name} has been removed`,
    })
  }

  const totalStats = companies.reduce(
    (acc, company) => ({
      revenue: acc.revenue + company.stats.totalRevenue,
      invoices: acc.invoices + company.stats.invoiceCount,
      clients: acc.clients + company.stats.clientCount,
    }),
    { revenue: 0, invoices: 0, clients: 0 },
  )

  return (
    <div className="max-w-7xl mx-auto space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-hairline pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-display-md font-bold tracking-tight text-ink">Companies</h1>
          <p className="text-body-md font-medium text-ink-mute">Manage your business entities and Stripe accounts.</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="h-10 rounded-md font-bold" onClick={openAddDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Company
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[640px] p-0 overflow-hidden border-none shadow-2xl rounded-2xl">
            <DialogHeader className="p-6 border-b border-hairline">
              <DialogTitle className="text-heading-lg text-ink">
                {editingCompanyId ? "Edit Company Profile" : "Create New Company"}
              </DialogTitle>
              <DialogDescription className="text-body-md font-medium text-ink-mute">
                {editingCompanyId 
                  ? "Update your business details and branding settings." 
                  : "Add a new business entity to manage invoices and payments."}
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Logo Section */}
              <div className="space-y-4">
                <Label className="text-micro-cap font-black uppercase tracking-widest text-ink-mute">Company Logo</Label>
                <div className="flex items-center gap-6">
                  <div className="relative group">
                    <div className="h-24 w-24 rounded-2xl border-2 border-dashed border-hairline bg-canvas-soft flex items-center justify-center overflow-hidden">
                      {formData.logoUrl ? (
                        <img src={formData.logoUrl} alt="Logo" className="h-full w-full object-contain" />
                      ) : (
                        <Building2 className="h-8 w-8 text-ink-mute" />
                      )}
                      {isUploading && (
                        <div className="absolute inset-0 bg-canvas/80 flex items-center justify-center">
                          <Loader2 className="h-6 w-6 text-primary animate-spin" />
                        </div>
                      )}
                    </div>
                    <label className="absolute -bottom-2 -right-2 h-8 w-8 bg-primary text-white rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:bg-primary-deep transition-colors">
                      <Upload className="h-4 w-4" />
                      <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={isUploading} />
                    </label>
                    {formData.logoUrl && (
                      <button 
                        onClick={() => setFormData(prev => ({ ...prev, logoUrl: "" }))}
                        className="absolute -top-2 -right-2 h-6 w-6 bg-ruby text-white rounded-full flex items-center justify-center shadow-md hover:bg-ruby/80"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-ink">Business Logo</p>
                    <p className="text-xs text-ink-mute max-w-[240px]">
                      Used on invoices and payment pages. Recommended size 400x400px, PNG or JPG.
                    </p>
                  </div>
                </div>
              </div>

              <Separator className="bg-hairline" />

              {/* General Info */}
              <div className="space-y-6">
                <h3 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  General Information
                </h3>
                
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-ink-mute">Legal Business Name</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-3 h-4 w-4 text-ink-mute" />
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Acme Corp"
                        className="pl-10 h-11 border-hairline focus:ring-primary"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-ink-mute">Billing Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-ink-mute" />
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="billing@acme.com"
                        className="pl-10 h-11 border-hairline"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-ink-mute">Business Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-ink-mute" />
                    <Textarea
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Full registered address..."
                      className="pl-10 min-h-[100px] border-hairline resize-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-ink-mute">Website</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-3 h-4 w-4 text-ink-mute" />
                      <Input
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        placeholder="https://acme.com"
                        className="pl-10 h-11 border-hairline"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-ink-mute">Tax / VAT ID</Label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-3 h-4 w-4 text-ink-mute" />
                      <Input
                        value={formData.taxId}
                        onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                        placeholder="GB123456789"
                        className="pl-10 h-11 border-hairline"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="bg-hairline" />

              {/* Whitelabel Info */}
              <div className="space-y-6">
                <h3 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Branding & Whitelabel
                </h3>

                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-ink-mute">Custom Payment Domain</Label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-ink-mute" />
                    <Input
                      value={formData.paymentBaseUrl}
                      onChange={(e) => setFormData({ ...formData, paymentBaseUrl: e.target.value })}
                      placeholder="pay.acme.com"
                      className="pl-10 h-11 border-hairline"
                    />
                  </div>
                  <p className="text-[11px] text-ink-mute mt-1">
                    Point a CNAME record from this domain to <span className="font-mono text-primary">pay.stratonally.com</span> for a trace-free experience.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-canvas-soft border-t border-hairline flex justify-end gap-3 rounded-b-2xl">
              <Button variant="outline" className="rounded-full px-6 border-hairline" onClick={closeDialog}>
                Discard
              </Button>
              <Button className="rounded-full px-8 font-bold" onClick={handleSaveCompany}>
                {editingCompanyId ? "Save Changes" : "Create Company"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="rounded-lg border-hairline bg-canvas shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-micro-cap uppercase tracking-widest text-ink-mute">Total Revenue</CardTitle>
            <BarChart3 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-display-sm font-bold text-ink text-tabular">{formatCurrencyWithSettings(totalStats.revenue)}</div>
            <p className="text-caption text-ink-mute">Across all companies</p>
          </CardContent>
        </Card>

        <Card className="rounded-lg border-hairline bg-canvas shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-micro-cap uppercase tracking-widest text-ink-mute">Total Invoices</CardTitle>
            <CreditCard className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-display-sm font-bold text-ink text-tabular">{totalStats.invoices}</div>
            <p className="text-caption text-ink-mute">Generated invoices</p>
          </CardContent>
        </Card>

        <Card className="rounded-lg border-hairline bg-canvas shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-micro-cap uppercase tracking-widest text-ink-mute">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-display-sm font-bold text-ink text-tabular">{totalStats.clients}</div>
            <p className="text-caption text-ink-mute">Active clients</p>
          </CardContent>
        </Card>
      </div>

      {/* Company List */}
      <Card className="rounded-lg border-hairline bg-canvas shadow-sm">
        <CardHeader>
          <CardTitle className="text-heading-lg text-ink">Your Companies</CardTitle>
          <CardDescription className="text-caption font-medium text-ink-mute">Manage your business entities and their settings</CardDescription>
        </CardHeader>
        <CardContent>
          {companies.length === 0 ? (
            <div className="text-center py-10">
              <Building2 className="h-12 w-12 text-ink-mute mx-auto mb-4" />
              <h3 className="text-heading-sm font-bold text-ink mb-2">No Companies Added</h3>
              <p className="text-body-md text-ink-mute mb-4">Add your first company to start generating invoices</p>
              <Button className="rounded-md" onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Company
              </Button>
            </div>
          ) : (
            <Tabs defaultValue="active" className="w-full">
              <TabsList className="grid w-full grid-cols-2 rounded-md border border-hairline bg-canvas-soft p-1">
                <TabsTrigger value="active">
                  Active Companies ({companies.filter((c) => c.isActive).length})
                </TabsTrigger>
                <TabsTrigger value="all">All Companies ({companies.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="active" className="mt-6">
                <div className="space-y-4">
                  {companies
                    .filter((company) => company.isActive)
                    .map((company) => (
                      <Card key={company.id} className="p-5 rounded-lg border-hairline shadow-none">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="flex min-w-0 items-start gap-4">
                            <div className="p-3 bg-primary/10 rounded-lg shrink-0">
                              <Building2 className="h-6 w-6 text-primary" />
                            </div>
                            <div className="min-w-0 space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-bold text-lg text-ink">{company.name}</h3>
                                <Badge variant={company.isActive ? "default" : "secondary"} className="rounded-full">
                                  {company.isActive ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                              <p className="text-sm text-ink-mute">{company.email}</p>
                              <p className="text-sm text-ink-mute">{company.address}</p>
                              {company.stripeAccountId && (
                                <p className="text-xs text-ink-mute">Stripe: {company.stripeAccountId}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Button variant="ghost" size="sm" className="rounded-md" onClick={() => openEditDialog(company)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="rounded-md">
                              <Settings className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="rounded-md font-bold text-ink-mute" onClick={() => handleToggleStatus(company.id)}>
                              {company.isActive ? "Deactivate" : "Activate"}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteCompany(company.id)}
                              className="rounded-md text-ruby hover:text-ruby hover:bg-ruby/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <Separator className="my-4" />

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-primary">
                              {formatCurrencyWithSettings(company.stats.totalRevenue)}
                            </div>
                            <p className="text-sm text-ink-mute">Revenue</p>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold">{company.stats.invoiceCount}</div>
                            <p className="text-sm text-ink-mute">Invoices</p>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold">{company.stats.clientCount}</div>
                            <p className="text-sm text-ink-mute">Clients</p>
                          </div>
                        </div>
                      </Card>
                    ))}
                </div>
              </TabsContent>

              <TabsContent value="all" className="mt-6">
                <div className="space-y-4">
                  {companies.map((company) => (
                    <Card key={company.id} className="p-5 rounded-lg border-hairline shadow-none">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex min-w-0 items-start gap-4">
                          <div className="p-3 bg-primary/10 rounded-lg shrink-0">
                            <Building2 className="h-6 w-6 text-primary" />
                          </div>
                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-bold text-lg text-ink">{company.name}</h3>
                              <Badge variant={company.isActive ? "default" : "secondary"} className="rounded-full">
                                {company.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            <p className="text-sm text-ink-mute">{company.email}</p>
                            <p className="text-sm text-ink-mute">{company.address}</p>
                            <p className="text-xs text-ink-mute">
                              Created: {new Date(company.createdAt).toLocaleDateString("en-GB")}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Button variant="ghost" size="sm" className="rounded-md" onClick={() => openEditDialog(company)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="rounded-md">
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="rounded-md font-bold text-ink-mute" onClick={() => handleToggleStatus(company.id)}>
                            {company.isActive ? "Deactivate" : "Activate"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCompany(company.id)}
                            className="rounded-md text-ruby hover:text-ruby hover:bg-ruby/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <Separator className="my-4" />

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary">
                            {formatCurrencyWithSettings(company.stats.totalRevenue)}
                          </div>
                          <p className="text-sm text-ink-mute">Revenue</p>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">{company.stats.invoiceCount}</div>
                          <p className="text-sm text-ink-mute">Invoices</p>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">{company.stats.clientCount}</div>
                          <p className="text-sm text-ink-mute">Clients</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Stripe Integration Info */}
      <Card className="rounded-lg border-hairline bg-canvas shadow-sm">
        <CardHeader>
          <CardTitle className="text-heading-sm flex items-center gap-2 text-ink">
            <CreditCard className="h-5 w-5" />
            Stripe Integration
          </CardTitle>
          <CardDescription className="text-caption font-medium text-ink-mute">All companies use your main Stripe account with separate tracking</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-canvas-soft border border-hairline rounded-lg">
              <h4 className="font-bold text-ink mb-2">How Multi-Company Works</h4>
              <ul className="text-sm text-ink-mute space-y-1">
                <li>• All payments go to your single Stripe account</li>
                <li>• Each company has separate invoice numbering and branding</li>
                <li>• Revenue is tracked separately for each company</li>
                <li>• Clients see the specific company information on invoices</li>
              </ul>
            </div>
            <div className="flex flex-col gap-3 p-4 border border-hairline rounded-lg sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-bold text-ink">Stripe Account Status</p>
                <p className="text-sm text-ink-mute">
                  {stripeStatus === "connected" 
                    ? "Connected and ready to accept payments" 
                    : stripeStatus === "disconnected"
                    ? "Not connected. Please check your Stripe settings."
                    : "Checking connection status..."}
                </p>
              </div>
              {stripeStatus === "checking" ? (
                <div className="h-2 w-2 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              ) : (
                <Badge variant={stripeStatus === "connected" ? "default" : "destructive"}>
                  {stripeStatus === "connected" ? "Connected" : "Disconnected"}
                </Badge>
              )}
            </div>
            {stripeStatus === "disconnected" && (
              <div className="p-4 bg-ruby/10 border border-ruby/20 rounded-lg">
                <h4 className="font-bold text-ruby mb-2">Action Required</h4>
                <p className="text-sm text-ruby mb-3">
                  Your Stripe account is not connected. Please configure your Stripe settings to accept payments.
                </p>
                <Button variant="outline" size="sm" className="rounded-md border-ruby/20 text-ruby hover:bg-ruby/10" onClick={checkStripeConnection}>
                  Check Again
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
