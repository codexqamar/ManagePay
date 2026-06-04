"use client"

import { useState } from "react"
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
} from "lucide-react"
import { useAppStore } from "@/lib/store"
import { formatCurrency } from "@/lib/currencies"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface DashboardStats {
  totalRevenue: number
  monthlyRevenue: number
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
}

export function PaymentDashboard() {
  const { companies, settings } = useAppStore()
  const [selectedPeriod, setSelectedPeriod] = useState("6months")
  const [selectedCompany, setSelectedCompany] = useState("all")

  const calculateStats = (): DashboardStats => {
    const totalStats = companies.reduce(
      (acc, company) => ({
        revenue: acc.revenue + company.stats.totalRevenue,
        invoices: acc.invoices + company.stats.invoiceCount,
        clients: acc.clients + company.stats.clientCount,
      }),
      { revenue: 0, invoices: 0, clients: 0 },
    )

    return {
      totalRevenue: totalStats.revenue,
      monthlyRevenue: totalStats.revenue * 0.15,
      totalInvoices: totalStats.invoices,
      paidInvoices: Math.floor(totalStats.invoices * 0.85),
      pendingInvoices: Math.floor(totalStats.invoices * 0.1),
      overdueInvoices: Math.floor(totalStats.invoices * 0.05),
      totalClients: totalStats.clients,
      revenueGrowth: 12.5,
    }
  }

  const stats = calculateStats()

  const generateRevenueData = () => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
    return months.map((month) => ({
      month,
      revenue: Math.floor((stats.totalRevenue / 6) * (0.8 + Math.random() * 0.4)),
    }))
  }

  const generateCompanyRevenue = () => {
    const colors = ["#533afd", "#4434d4", "#665efd", "#b9b9f9", "#1c1e54"]
    return companies.map((company, index) => ({
      name: company.name,
      revenue: company.stats.totalRevenue,
      color: colors[index % colors.length],
    }))
  }

  const generateInvoices = (): Invoice[] => {
    const statuses: Array<"paid" | "pending" | "overdue" | "draft"> = ["paid", "pending", "overdue"]
    return companies.flatMap((company, cIdx) => 
      Array.from({ length: 2 }, (_, i) => ({
        id: `${cIdx}-${i}`,
        invoiceNumber: `INV-2024-${cIdx}${i}`,
        clientName: "Enterprise Client",
        amount: 2500 + (cIdx * 500),
        status: statuses[Math.floor(Math.random() * statuses.length)],
        dueDate: "2024-06-30",
        companyName: company.name,
      }))
    ).slice(0, 8)
  }

  const revenueData = generateRevenueData()
  const companyRevenue = generateCompanyRevenue()
  const invoices = generateInvoices()

  const formatCurrencyWithSettings = (amount: number) => {
    return formatCurrency(amount, settings.defaultCurrency)
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      paid: "bg-emerald-50 text-emerald-700 border-emerald-200/60 rounded-full",
      pending: "bg-amber-50 text-amber-700 border-amber-200/60 rounded-full",
      overdue: "bg-ruby/10 text-ruby border-ruby/20 rounded-full",
      draft: "bg-slate-100 text-slate-700 border-slate-200 rounded-full",
    } as const
    const variant = variants[status as keyof typeof variants] || variants.draft
    return (
      <Badge variant="outline" className={cn("font-semibold text-[10px] px-2.5 py-0.5 capitalize tracking-wide rounded-full", variant)}>
        {status}
      </Badge>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 py-8 px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-hairline pb-10">
        <div>
          <h1 className="text-display-md font-bold tracking-tight text-ink">Overview</h1>
          <p className="text-body-md text-ink-mute font-medium mt-1">Unified financial management across your entities.</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedCompany} onValueChange={setSelectedCompany}>
            <SelectTrigger className="w-48 h-10 bg-canvas border-hairline text-caption font-bold shadow-sm rounded-md">
              <SelectValue placeholder="All Entities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Entities</SelectItem>
              {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button className="h-10 px-6 font-bold shadow-sm flex gap-2">
            <Plus className="h-4 w-4" />
            New Invoice
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <Card className="bg-canvas border-hairline rounded-lg shadow-sm group hover:border-primary/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
            <CardTitle className="text-micro-cap text-ink-mute group-hover:text-primary transition-colors">Total Revenue</CardTitle>
            <div className="p-2 bg-canvas-soft rounded-lg group-hover:bg-primary/5 transition-colors">
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-display-sm font-bold text-ink text-tabular tabular-nums">{formatCurrencyWithSettings(stats.totalRevenue)}</div>
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
            <div className="text-display-sm font-bold text-ink text-tabular tabular-nums">{formatCurrencyWithSettings(stats.monthlyRevenue)}</div>
            <p className="text-caption text-ink-mute font-bold mt-3 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              Projected +15% growth
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
            <div className="text-display-sm font-bold text-ink text-tabular tabular-nums">{stats.pendingInvoices + stats.overdueInvoices}</div>
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
            <div className="text-display-sm font-bold text-ink text-tabular tabular-nums">{stats.totalClients}</div>
            <p className="text-caption text-ink-mute font-bold mt-3 uppercase tracking-widest">Global enterprise base</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <Card className="lg:col-span-2 bg-canvas border-hairline rounded-lg shadow-sm overflow-hidden">
          <CardHeader className="border-b border-hairline py-6 px-8 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-heading-lg font-bold text-ink">Growth Trend</CardTitle>
              <CardDescription className="text-caption font-semibold text-ink-mute">Monthly net revenue performance</CardDescription>
            </div>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-36 h-9 bg-canvas-soft border-hairline text-micro-cap font-black uppercase tracking-widest shadow-none">
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
          <CardContent className="p-8">
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748d', fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748d', fontWeight: 600 }} tickFormatter={(v) => `$${v/1000}k`} />
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
          <CardHeader className="border-b border-hairline py-6 px-8 text-center">
            <CardTitle className="text-heading-lg font-bold text-ink">Entity Share</CardTitle>
            <CardDescription className="text-caption font-semibold text-ink-mute">Revenue distribution by organization</CardDescription>
          </CardHeader>
          <CardContent className="p-8 flex flex-col items-center">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={companyRevenue} cx="50%" cy="50%" innerRadius={65} outerRadius={85} paddingAngle={8} dataKey="revenue" stroke="none">
                  {companyRevenue.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v) => formatCurrencyWithSettings(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
            <div className="w-full space-y-3 mt-6 px-4">
              {companyRevenue.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-caption">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
                    <span className="font-semibold text-ink-secondary">{item.name}</span>
                  </div>
                  <span className="font-bold text-ink">{((item.revenue / stats.totalRevenue) * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions */}
      <Card className="bg-canvas border-hairline rounded-lg shadow-sm overflow-hidden">
        <CardHeader className="py-8 px-10 border-b border-hairline flex flex-row items-center justify-between bg-canvas-soft/30">
          <div>
            <CardTitle className="text-heading-lg font-bold text-ink">Recent Transactions</CardTitle>
            <CardDescription className="text-caption font-semibold text-ink-mute">Real-time ledger of entity activities</CardDescription>
          </div>
          <div className="flex items-center gap-6">
            <Tabs defaultValue="all" className="h-10">
              <TabsList className="bg-white p-1 border border-hairline h-10 shadow-sm rounded-md">
                <TabsTrigger value="all" className="text-micro-cap font-black uppercase tracking-widest px-4 h-8 data-[state=active]:bg-canvas-soft">All</TabsTrigger>
                <TabsTrigger value="paid" className="text-micro-cap font-black uppercase tracking-widest px-4 h-8 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">Paid</TabsTrigger>
                <TabsTrigger value="pending" className="text-micro-cap font-black uppercase tracking-widest px-4 h-8 data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700">Pending</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button variant="outline" size="sm" className="h-10 px-5 font-bold shadow-sm rounded-md border-hairline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-white border-b border-hairline">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-micro-cap font-black uppercase tracking-[0.2em] text-ink-mute h-12 px-10">Invoice</TableHead>
                <TableHead className="text-micro-cap font-black uppercase tracking-[0.2em] text-ink-mute h-12">Client</TableHead>
                <TableHead className="text-micro-cap font-black uppercase tracking-[0.2em] text-ink-mute h-12">Organization</TableHead>
                <TableHead className="text-micro-cap font-black uppercase tracking-[0.2em] text-ink-mute h-12">Amount</TableHead>
                <TableHead className="text-micro-cap font-black uppercase tracking-[0.2em] text-ink-mute h-12">Status</TableHead>
                <TableHead className="text-micro-cap font-black uppercase tracking-[0.2em] text-ink-mute h-12 text-right px-10">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id} className="group hover:bg-canvas-soft/40 transition-colors border-hairline even:bg-canvas-soft/10">
                  <TableCell className="py-6 px-10">
                    <span className="font-bold text-body-md text-ink">{invoice.invoiceNumber}</span>
                    <p className="text-caption text-ink-mute font-semibold mt-1">Due {new Date(invoice.dueDate).toLocaleDateString()}</p>
                  </TableCell>
                  <TableCell className="py-6 text-body-md font-semibold text-ink-secondary">{invoice.clientName}</TableCell>
                  <TableCell className="py-6">
                    <span className="text-micro-cap font-bold text-ink-mute-2 bg-canvas-soft px-2.5 py-1 rounded border border-hairline shadow-xs">
                      {invoice.companyName}
                    </span>
                  </TableCell>
                  <TableCell className="py-6 text-body-md font-bold text-ink tabular-nums">{formatCurrencyWithSettings(invoice.amount)}</TableCell>
                  <TableCell className="py-6">{getStatusBadge(invoice.status)}</TableCell>
                  <TableCell className="py-6 text-right px-10">
                    <div className="flex justify-end gap-3">
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-ink-mute hover:text-primary hover:bg-canvas rounded-xl shadow-xs border border-transparent hover:border-hairline transition-all">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-ink-mute hover:text-primary hover:bg-canvas rounded-xl shadow-xs border border-transparent hover:border-hairline transition-all">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
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
      <footer className="pt-16 pb-10 border-t border-hairline flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-canvas-soft rounded flex items-center justify-center border border-hairline shadow-xs">
            <span className="text-ink-mute text-[10px] font-black italic">P</span>
          </div>
          <span className="text-micro-cap font-black text-ink-mute uppercase tracking-[0.2em]">ManagePay Enterprise</span>
        </div>
        <div className="flex gap-10 text-micro-cap font-bold text-ink-mute uppercase tracking-widest">
          <Link href="#" className="hover:text-primary transition-colors">API Docs</Link>
          <Link href="#" className="hover:text-primary transition-colors">Security</Link>
          <Link href="#" className="hover:text-primary transition-colors">System Status</Link>
        </div>
      </footer>
    </div>
  )
}
