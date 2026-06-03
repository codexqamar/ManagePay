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
import { Building2, Plus, Edit, Trash2, Settings, CreditCard, BarChart3, Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAppStore } from "@/lib/store"
import { formatCurrency } from "@/lib/currencies"

interface Company {
  id: string
  name: string
  email: string
  address: string
  phone?: string
  website?: string
  taxId?: string
  stripeAccountId?: string
  isActive: boolean
  createdAt: string
  stats: {
    totalRevenue: number
    invoiceCount: number
    clientCount: number
  }
}

export function CompanyManagement() {
  const { toast } = useToast()
  const { companies, settings, addCompany, updateCompany, deleteCompany, toggleCompanyStatus } = useAppStore()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingCompany, setEditingCompany] = useState<any>(null)
  const [newCompany, setNewCompany] = useState({
    name: "",
    email: "",
    address: "",
    phone: "",
    website: "",
    taxId: "",
  })
  const [stripeStatus, setStripeStatus] = useState<"connected" | "disconnected" | "checking">("checking")

  useEffect(() => {
    checkStripeConnection()
  }, [])

  const checkStripeConnection = async () => {
    try {
      // Replace this with your actual Stripe connection check
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

  const handleAddCompany = () => {
    if (!newCompany.name || !newCompany.email) {
      toast({
        title: "Missing Information",
        description: "Please fill in company name and email",
        variant: "destructive",
      })
      return
    }

    addCompany({
      ...newCompany,
      isActive: true,
    })

    setNewCompany({
      name: "",
      email: "",
      address: "",
      phone: "",
      website: "",
      taxId: "",
    })
    setIsAddDialogOpen(false)

    toast({
      title: "Company Added!",
      description: `${newCompany.name} has been added successfully`,
    })
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
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Company Management</h1>
          <p className="text-muted-foreground">Manage your business entities and Stripe accounts</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Company
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Company</DialogTitle>
              <DialogDescription>Create a new company profile for invoice generation</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Company Name *</Label>
                  <Input
                    id="name"
                    value={newCompany.name}
                    onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                    placeholder="Tech Solutions Inc."
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newCompany.email}
                    onChange={(e) => setNewCompany({ ...newCompany, email: e.target.value })}
                    placeholder="billing@company.com"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={newCompany.address}
                  onChange={(e) => setNewCompany({ ...newCompany, address: e.target.value })}
                  placeholder="123 Business St, City, State 12345"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={newCompany.phone}
                    onChange={(e) => setNewCompany({ ...newCompany, phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={newCompany.website}
                    onChange={(e) => setNewCompany({ ...newCompany, website: e.target.value })}
                    placeholder="https://company.com"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="taxId">Tax ID</Label>
                <Input
                  id="taxId"
                  value={newCompany.taxId}
                  onChange={(e) => setNewCompany({ ...newCompany, taxId: e.target.value })}
                  placeholder="12-3456789"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddCompany}>Add Company</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrencyWithSettings(totalStats.revenue)}</div>
            <p className="text-xs text-muted-foreground">Across all companies</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.invoices}</div>
            <p className="text-xs text-muted-foreground">Generated invoices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.clients}</div>
            <p className="text-xs text-muted-foreground">Active clients</p>
          </CardContent>
        </Card>
      </div>

      {/* Company List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Companies</CardTitle>
          <CardDescription>Manage your business entities and their settings</CardDescription>
        </CardHeader>
        <CardContent>
          {companies.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Companies Added</h3>
              <p className="text-muted-foreground mb-4">Add your first company to start generating invoices</p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Company
              </Button>
            </div>
          ) : (
            <Tabs defaultValue="active" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
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
                      <Card key={company.id} className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className="p-3 bg-primary/10 rounded-lg">
                              <Building2 className="h-6 w-6 text-primary" />
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-lg">{company.name}</h3>
                                <Badge variant={company.isActive ? "default" : "secondary"}>
                                  {company.isActive ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{company.email}</p>
                              <p className="text-sm text-muted-foreground">{company.address}</p>
                              {company.stripeAccountId && (
                                <p className="text-xs text-muted-foreground">Stripe: {company.stripeAccountId}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Settings className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleToggleStatus(company.id)}>
                              {company.isActive ? "Deactivate" : "Activate"}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteCompany(company.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <Separator className="my-4" />

                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-primary">
                              {formatCurrencyWithSettings(company.stats.totalRevenue)}
                            </div>
                            <p className="text-sm text-muted-foreground">Revenue</p>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold">{company.stats.invoiceCount}</div>
                            <p className="text-sm text-muted-foreground">Invoices</p>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold">{company.stats.clientCount}</div>
                            <p className="text-sm text-muted-foreground">Clients</p>
                          </div>
                        </div>
                      </Card>
                    ))}
                </div>
              </TabsContent>

              <TabsContent value="all" className="mt-6">
                <div className="space-y-4">
                  {companies.map((company) => (
                    <Card key={company.id} className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-primary/10 rounded-lg">
                            <Building2 className="h-6 w-6 text-primary" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg">{company.name}</h3>
                              <Badge variant={company.isActive ? "default" : "secondary"}>
                                {company.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{company.email}</p>
                            <p className="text-sm text-muted-foreground">{company.address}</p>
                            <p className="text-xs text-muted-foreground">
                              Created: {new Date(company.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleToggleStatus(company.id)}>
                            {company.isActive ? "Deactivate" : "Activate"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCompany(company.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <Separator className="my-4" />

                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary">
                            {formatCurrencyWithSettings(company.stats.totalRevenue)}
                          </div>
                          <p className="text-sm text-muted-foreground">Revenue</p>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">{company.stats.invoiceCount}</div>
                          <p className="text-sm text-muted-foreground">Invoices</p>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">{company.stats.clientCount}</div>
                          <p className="text-sm text-muted-foreground">Clients</p>
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Stripe Integration
          </CardTitle>
          <CardDescription>All companies use your main Stripe account with separate tracking</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">How Multi-Company Works</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• All payments go to your single Stripe account</li>
                <li>• Each company has separate invoice numbering and branding</li>
                <li>• Revenue is tracked separately for each company</li>
                <li>• Clients see the specific company information on invoices</li>
              </ul>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Stripe Account Status</p>
                <p className="text-sm text-muted-foreground">
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
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <h4 className="font-medium text-destructive mb-2">Action Required</h4>
                <p className="text-sm text-destructive mb-3">
                  Your Stripe account is not connected. Please configure your Stripe settings to accept payments.
                </p>
                <Button variant="outline" size="sm" onClick={checkStripeConnection}>
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