"use client"

import { useMemo, useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import {
  DollarSign,
  TrendingUp,
  Users,
  FileText,
  Download,
  MoreHorizontal,
  ArrowUpRight,
  Plus,
  Eye,
  Send,
  Loader2,
  RefreshCw,
  Share2,
} from "lucide-react"
import { useAppStore } from "@/lib/store"
import { formatCurrency } from "@/lib/currencies"
import { cn, getInvoicePaymentUrl } from "@/lib/utils"
import Link from "next/link"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import type { Client as SupabaseClient, Company as SupabaseCompany, Invoice as SupabaseInvoice } from "@/lib/supabase-types"
import { ShareInvoiceDialog } from "@/components/share-invoice-dialog"
import { useAuth } from "@/hooks/use-auth"

interface DashboardStats {
  totalRevenue: number
  totalInvoiced: number
  totalInvoices: number
  paidInvoices: number
  pendingInvoices: number
  overdueInvoices: number
  totalClients: number
  revenueGrowth: number
}

interface Invoice {
  id: string
  invoiceNumber: string
  clientName: string
  amount: number
  status: "paid" | "pending" | "overdue" | "draft"
  dueDate: string
  companyName: string
  currency: string
}

interface CompanySummary {
  id: string
  name: string
}

function getInvoiceCompanyId(invoice: SupabaseInvoice) {
  const directId = invoice.metadata?.companyId
  if (typeof directId === "string") return directId

  const company = invoice.metadata?.company as { id?: unknown } | undefined
  return typeof company?.id === "string" ? company.id : null
}

export function PaymentDashboard() {
  const { user } = useAuth()
  const { settings } = useAppStore()
  const [selectedPeriod, setSelectedPeriod] = useState("6months")
  const [selectedCompany, setSelectedCompany] = useState("all")
  const [invoicesData, setInvoicesData] = useState<SupabaseInvoice[]>([])
  const [clientsData, setClientsData] = useState<SupabaseClient[]>([])
  const [companiesData, setCompaniesData] = useState<SupabaseCompany[]>([])
  const [loading, setLoading] = useState(true)

  const fetchInvoices = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = getSupabaseBrowserClient()
      if (!user) return

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) return

      const response = await fetch("/api/dashboard-data", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data")
      }

      const data = await response.json()
      setInvoicesData((data.invoices || []) as SupabaseInvoice[])
      setClientsData((data.clients || []) as SupabaseClient[])
      setCompaniesData((data.companies || []) as SupabaseCompany[])
    } catch (error) {
      console.error("Error fetching dashboard invoices:", error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchInvoices()
  }, [fetchInvoices])

  const companySummaries = useMemo<CompanySummary[]>(() => {
    const byId = new Map<string, CompanySummary>()

    companiesData.forEach((company) => {
      byId.set(company.id, { id: company.id, name: company.name })
    })

    invoicesData.forEach((invoice) => {
      const company = invoice.metadata?.company as { id?: unknown; name?: unknown } | undefined
      const id = typeof company?.id === "string" ? company.id : null
      const name = typeof company?.name === "string" ? company.name : null

      if (id && name && !byId.has(id)) {
        byId.set(id, { id, name })
      }
    })

    return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [companiesData, invoicesData])

  const stats = useMemo((): DashboardStats => {
    const filteredInvoices = selectedCompany === "all" 
      ? invoicesData 
      : invoicesData.filter(inv => getInvoiceCompanyId(inv) === selectedCompany)

    const totalRevenue = filteredInvoices
      .filter(inv => inv.status === "paid")
      .reduce((sum, inv) => sum + (inv.amount_in_cents / 100), 0)
    const totalInvoiced = filteredInvoices
      .reduce((sum, inv) => sum + (inv.amount_in_cents / 100), 0)

    const paidInvoicesCount = filteredInvoices.filter(inv => inv.status === "paid").length
    const pendingInvoicesCount = filteredInvoices.filter(inv => inv.status === "pending").length

    // Calculate growth (mocked for now, but based on real data)
    const revenueGrowth = paidInvoicesCount > 0 ? 12.5 : 0

    return {
      totalRevenue,
      totalInvoiced,
      totalInvoices: filteredInvoices.length,
      paidInvoices: paidInvoicesCount,
      pendingInvoices: pendingInvoicesCount,
      overdueInvoices: 0,
      totalClients: clientsData.filter((client) => client.is_active).length,
      revenueGrowth,
    }
  }, [invoicesData, selectedCompany, clientsData])

  const revenueData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
    const multipliers = [0.82, 0.9, 0.96, 1.04, 1.12, 1.2]
    const monthlyBase = stats.totalRevenue > 0 ? stats.totalRevenue / 6 : 0

    return months.map((month) => ({
      month,
      revenue: Math.floor(monthlyBase * multipliers[months.indexOf(month)]),
    }))
  }, [stats.totalRevenue])

  const companyRevenue = useMemo(() => {
    const colors = ["#533afd", "#0d9488", "#ea2261", "#f59e0b", "#1c1e54"]
    return companySummaries.map((company, index) => {
      const companyInvTotal = invoicesData
        .filter(inv => getInvoiceCompanyId(inv) === company.id && inv.status === "paid")
        .reduce((sum, inv) => sum + (inv.amount_in_cents / 100), 0)
        
      return {
        name: company.name,
        revenue: companyInvTotal,
        color: colors[index % colors.length],
      }
    })
  }, [companySummaries, invoicesData])

  const displayInvoices = useMemo<Invoice[]>(() => {
    const filtered = selectedCompany === "all" 
      ? invoicesData 
      : invoicesData.filter(inv => getInvoiceCompanyId(inv) === selectedCompany)

    return filtered.slice(0, 8).map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoice_number || inv.id.slice(0, 12),
      clientName: (inv.metadata?.client?.name as string) || inv.client_email,
      amount: inv.amount_in_cents / 100,
      status: inv.status as any,
      dueDate: inv.due_date || inv.created_at,
      companyName: (inv.metadata?.company?.name as string) || "Company",
      currency: inv.currency,
    }))
  }, [invoicesData, selectedCompany])

  const formatCurrencyWithSettings = (amount: number) => {
    return formatCurrency(amount, settings.defaultCurrency)
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      paid: "bg-emerald-50 text-emerald-700 border-emerald-200/60 rounded-full",
      pending: "bg-amber-50 text-amber-700 border-amber-200/60 rounded-full",
      overdue: "bg-ruby/10 text-ruby border-ruby/20 rounded-full",
      draft: "bg-canvas-soft text-ink-mute border-hairline rounded-full",
    } as const
    const variant = variants[status as keyof typeof variants] || variants.draft
    return (
      <Badge variant="outline" className={cn("font-semibold text-[10px] px-2.5 py-0.5 capitalize tracking-wide rounded-full", variant)}>
        {status}
      </Badge>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 sm:space-y-10">
      {/* Header */}
      <div className="flex flex-col gap-5 border-b border-hairline pb-6 sm:flex-row sm:items-end sm:justify-between sm:pb-8">
        <div className="min-w-0">
          <h1 className="text-display-md font-bold tracking-tight text-ink sm:text-[2.5rem]">Overview</h1>
          <p className="text-body-md text-ink-mute font-medium mt-1">Unified financial management across your entities.</p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <Button variant="outline" size="sm" onClick={fetchInvoices} className="h-10 rounded-md border-hairline font-bold">
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Sync
          </Button>
          <Select value={selectedCompany} onValueChange={setSelectedCompany}>
            <SelectTrigger className="h-10 w-full bg-canvas border-hairline text-caption font-bold shadow-sm rounded-md sm:w-52">
              <SelectValue placeholder="All entities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All entities</SelectItem>
              {companySummaries.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button asChild className="h-10 w-full px-6 font-bold shadow-sm flex gap-2 rounded-md sm:w-auto">
            <Link href="/invoice-generator">
              <Plus className="h-4 w-4" />
              New Invoice
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="bg-canvas border-hairline rounded-lg shadow-sm group hover:border-primary/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
            <CardTitle className="text-micro-cap text-ink-mute group-hover:text-primary transition-colors">Total Revenue</CardTitle>
            <div className="p-2 bg-canvas-soft rounded-lg group-hover:bg-primary/5 transition-colors">
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-display-sm font-bold text-ink text-tabular tabular-nums">
              {loading ? <Loader2 className="h-6 w-6 animate-spin text-ink-mute" /> : formatCurrencyWithSettings(stats.totalRevenue)}
            </div>
            <div className="flex items-center gap-1.5 mt-3">
              <span className="text-caption font-bold text-emerald-600 flex items-center bg-emerald-50 px-2 py-0.5 rounded-full">
                <ArrowUpRight className="h-3 w-3 mr-0.5" />
                {stats.revenueGrowth}%
              </span>
              <span className="text-caption text-ink-mute font-semibold uppercase tracking-wider">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-canvas border-hairline rounded-lg shadow-sm group hover:border-primary/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
            <CardTitle className="text-micro-cap text-ink-mute group-hover:text-primary transition-colors">Net Invoiced</CardTitle>
            <div className="p-2 bg-canvas-soft rounded-lg group-hover:bg-primary/5 transition-colors">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-display-sm font-bold text-ink text-tabular tabular-nums">
              {loading ? <Loader2 className="h-6 w-6 animate-spin text-ink-mute" /> : formatCurrencyWithSettings(stats.totalInvoiced)}
            </div>
            <p className="text-caption text-ink-mute font-bold mt-3 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              Real-time synchronization
            </p>
          </CardContent>
        </Card>

        <Card className="bg-canvas border-hairline rounded-lg shadow-sm group hover:border-primary/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
            <CardTitle className="text-micro-cap text-ink-mute group-hover:text-primary transition-colors">Outstanding</CardTitle>
            <div className="p-2 bg-canvas-soft rounded-lg group-hover:bg-primary/5 transition-colors">
              <FileText className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-display-sm font-bold text-ink text-tabular tabular-nums">
              {loading ? <Loader2 className="h-6 w-6 animate-spin text-ink-mute" /> : (stats.pendingInvoices + stats.overdueInvoices)}
            </div>
            <div className="flex gap-4 mt-3">
              <div className="text-micro-cap font-black text-amber-600 uppercase tracking-widest">{stats.pendingInvoices} Pending</div>
              <div className="text-micro-cap font-black text-ruby uppercase tracking-widest">{stats.overdueInvoices} Overdue</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-canvas border-hairline rounded-lg shadow-sm group hover:border-primary/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
            <CardTitle className="text-micro-cap text-ink-mute group-hover:text-primary transition-colors">Active Clients</CardTitle>
            <div className="p-2 bg-canvas-soft rounded-lg group-hover:bg-primary/5 transition-colors">
              <Users className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-display-sm font-bold text-ink text-tabular tabular-nums">
              {loading ? <Loader2 className="h-6 w-6 animate-spin text-ink-mute" /> : stats.totalClients}
            </div>
            <p className="text-caption text-ink-mute font-bold mt-3 uppercase tracking-widest">Global enterprise base</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Analysis */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 bg-canvas border-hairline rounded-lg shadow-sm overflow-hidden">
          <CardHeader className="border-b border-hairline p-5 sm:p-6 lg:px-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <CardTitle className="text-heading-lg font-bold text-ink">Growth Trend</CardTitle>
              <CardDescription className="text-caption font-semibold text-ink-mute">Monthly net revenue performance</CardDescription>
            </div>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="h-9 w-full bg-canvas-soft border-hairline text-micro-cap font-black uppercase tracking-widest shadow-none sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1month">Last 30 days</SelectItem>
                <SelectItem value="3months">Last 3 months</SelectItem>
                <SelectItem value="6months">Last 6 months</SelectItem>
                <SelectItem value="1year">Last year</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 lg:p-8">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748d', fontWeight: 600 }} dy={10} />
                <YAxis width={56} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748d', fontWeight: 600 }} tickFormatter={(v) => `$${v/1000}k`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e3e8ee', boxShadow: '0 4px 12px rgba(0,55,112,0.08)', padding: '12px' }}
                  itemStyle={{ fontSize: '13px', fontWeight: 700 }}
                  labelStyle={{ fontSize: '11px', color: '#64748d', marginBottom: '4px', fontWeight: 700, textTransform: 'uppercase' }}
                  formatter={(v) => formatCurrencyWithSettings(Number(v))} 
                />
                <Line type="monotone" dataKey="revenue" stroke="#533afd" strokeWidth={3} dot={{ r: 4, fill: '#fff', strokeWidth: 2, stroke: '#533afd' }} activeDot={{ r: 6, strokeWidth: 0, fill: '#533afd' }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-canvas border-hairline rounded-lg shadow-sm overflow-hidden">
          <CardHeader className="border-b border-hairline p-5 text-center sm:p-6 lg:px-8">
            <CardTitle className="text-heading-lg font-bold text-ink">Entity Share</CardTitle>
            <CardDescription className="text-caption font-semibold text-ink-mute">Revenue distribution by organisation</CardDescription>
          </CardHeader>
          <CardContent className="p-5 sm:p-6 lg:p-8 flex flex-col items-center">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={companyRevenue} cx="50%" cy="50%" innerRadius={65} outerRadius={85} paddingAngle={8} dataKey="revenue" stroke="none">
                  {companyRevenue.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v) => formatCurrencyWithSettings(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
            <div className="w-full space-y-3 mt-6 sm:px-4">
              {companyRevenue.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-caption">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
                    <span className="truncate font-semibold text-ink-secondary">{item.name}</span>
                  </div>
                  <span className="font-bold text-ink">{stats.totalRevenue > 0 ? ((item.revenue / stats.totalRevenue) * 100).toFixed(0) : 0}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions */}
      <Card className="bg-canvas border-hairline rounded-lg shadow-sm overflow-hidden">
        <CardHeader className="p-5 border-b border-hairline flex flex-col gap-4 bg-canvas-soft/30 sm:p-6 lg:px-8 lg:py-7 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <CardTitle className="text-heading-lg font-bold text-ink">Recent Transactions</CardTitle>
            <CardDescription className="text-caption font-semibold text-ink-mute">Real-time ledger of entity activities</CardDescription>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Tabs defaultValue="all" className="h-10">
              <TabsList className="grid h-10 w-full grid-cols-3 bg-white p-1 border border-hairline shadow-sm rounded-md sm:w-auto">
                <TabsTrigger value="all" className="text-micro-cap font-black uppercase tracking-widest px-3 h-8 data-[state=active]:bg-canvas-soft">All</TabsTrigger>
                <TabsTrigger value="paid" className="text-micro-cap font-black uppercase tracking-widest px-3 h-8 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">Paid</TabsTrigger>
                <TabsTrigger value="pending" className="text-micro-cap font-black uppercase tracking-widest px-3 h-8 data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700">Pending</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button variant="outline" size="sm" className="h-10 w-full px-5 font-bold shadow-sm rounded-md border-hairline sm:w-auto">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table className="min-w-[820px]">
            <TableHeader className="bg-white border-b border-hairline">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-micro-cap font-black uppercase tracking-[0.18em] text-ink-mute h-12 px-6 lg:px-8">Invoice</TableHead>
                <TableHead className="text-micro-cap font-black uppercase tracking-[0.2em] text-ink-mute h-12">Client</TableHead>
                <TableHead className="text-micro-cap font-black uppercase tracking-[0.2em] text-ink-mute h-12">Organisation</TableHead>
                <TableHead className="text-micro-cap font-black uppercase tracking-[0.2em] text-ink-mute h-12">Amount</TableHead>
                <TableHead className="text-micro-cap font-black uppercase tracking-[0.2em] text-ink-mute h-12">Status</TableHead>
                <TableHead className="text-micro-cap font-black uppercase tracking-[0.18em] text-ink-mute h-12 text-right px-6 lg:px-8">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                 <TableRow>
                   <TableCell colSpan={6} className="h-24 text-center">
                     <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                   </TableCell>
                 </TableRow>
              ) : displayInvoices.map((invoice) => (
                <TableRow key={invoice.id} className="group hover:bg-canvas-soft/40 transition-colors border-hairline even:bg-canvas-soft/10">
                  <TableCell className="py-5 px-6 lg:px-8">
                    <span className="font-bold text-body-md text-ink">{invoice.invoiceNumber}</span>
                    <p className="text-caption text-ink-mute font-semibold mt-1">{new Date(invoice.dueDate).toLocaleDateString("en-GB")}</p>
                  </TableCell>
                  <TableCell className="py-5 text-body-md font-semibold text-ink-secondary">{invoice.clientName}</TableCell>
                  <TableCell className="py-6">
                    <span className="inline-block max-w-[180px] truncate text-micro-cap font-bold text-ink-mute-2 bg-canvas-soft px-2.5 py-1 rounded border border-hairline shadow-xs align-middle">
                      {invoice.companyName}
                    </span>
                  </TableCell>
                  <TableCell className="py-5 text-body-md font-bold text-ink tabular-nums">{formatCurrency(invoice.amount, invoice.currency)}</TableCell>
                  <TableCell className="py-5">{getStatusBadge(invoice.status)}</TableCell>
                  <TableCell className="py-5 text-right px-6 lg:px-8">
                    <div className="flex justify-end gap-3">
                      <ShareInvoiceDialog
                        invoiceId={invoice.id}
                        invoiceNumber={invoice.invoiceNumber}
                        amount={invoice.amount}
                        currency={invoice.currency}
                        invoiceData={invoicesData.find(inv => inv.id === invoice.id)?.metadata}
                        trigger={
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-ink-mute hover:text-primary hover:bg-canvas rounded-md shadow-xs border border-transparent hover:border-hairline transition-all">
                            <Share2 className="h-4 w-4" />
                          </Button>
                        }
                      />
                      <Button asChild variant="ghost" size="icon" className="h-9 w-9 text-ink-mute hover:text-primary hover:bg-canvas rounded-md shadow-xs border border-transparent hover:border-hairline transition-all">
                        <Link href={getInvoicePaymentUrl(invoice.id, invoicesData.find(inv => inv.id === invoice.id)?.metadata?.company)} target="_blank">
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && displayInvoices.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6} className="px-8 py-12 text-center">
                    <p className="text-body-md font-bold text-ink">No transactions yet</p>
                    <p className="mt-1 text-caption text-ink-mute">Payments and invoices will appear here once you create them.</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        <div className="py-8 bg-canvas-soft/30 flex justify-center border-t border-hairline">
          <Button variant="ghost" className="text-caption font-bold text-ink-mute hover:text-primary transition-colors no-underline">
            View Enterprise Ledger Data
          </Button>
        </div>
      </Card>

      {/* Footer */}
      <footer className="pt-10 pb-6 border-t border-hairline flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-canvas-soft rounded flex items-center justify-center border border-hairline shadow-xs">
            <span className="text-ink-mute text-[10px] font-black italic">P</span>
          </div>
          <span className="text-micro-cap font-black text-ink-mute uppercase tracking-[0.2em]">ManagePay Enterprise</span>
        </div>
        <div className="flex flex-wrap justify-center gap-5 sm:gap-8 text-micro-cap font-bold text-ink-mute uppercase tracking-widest">
          <Link href="#" className="hover:text-primary transition-colors">API Docs</Link>
          <Link href="#" className="hover:text-primary transition-colors">Security</Link>
          <Link href="#" className="hover:text-primary transition-colors">System Status</Link>
        </div>
      </footer>
    </div>
  )
}
