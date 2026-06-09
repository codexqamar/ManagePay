"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Building2, Edit, Mail, Phone, Plus, Search, Trash2, UserRound, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import type { Client } from "@/lib/supabase-types"
import { useAuth } from "@/hooks/use-auth"
import { ClientDialog, getClientErrorMessage } from "@/components/client-dialog"

async function getAccessToken() {
  const supabase = getSupabaseBrowserClient()
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error || !session?.access_token) {
    throw new Error("Please sign in again to manage clients.")
  }

  return session.access_token
}

async function fetchClientApi(path: string, init: RequestInit = {}) {
  const token = await getAccessToken()
  const headers = new Headers(init.headers)
  headers.set("Authorization", `Bearer ${token}`)

  const response = await fetch(path, {
    ...init,
    headers,
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.error || "Client operation failed.")
  }

  return response
}

export function ClientManagement() {
  const { toast } = useToast()
  const { user, loading: authLoading } = useAuth()

  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [search, setSearch] = useState("")

  const activeClients = clients.filter((client) => client.is_active)
  const inactiveClients = clients.filter((client) => !client.is_active)

  const filteredClients = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return clients

    return clients.filter((client) =>
      [
        client.name,
        client.email,
        client.company_name,
        client.phone,
        client.address,
      ]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query)),
    )
  }, [clients, search])

  const loadClients = useCallback(async () => {
    if (!user) {
      setClients([])
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const response = await fetchClientApi("/api/clients")
      setClients((await response.json()) as Client[])
    } catch (error) {
      toast({
        title: "Clients unavailable",
        description: getClientErrorMessage(error),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast, user])

  useEffect(() => {
    if (authLoading) return
    loadClients()
  }, [authLoading, loadClients])

  const openAddDialog = () => {
    setEditingClient(null)
    setDialogOpen(true)
  }

  const openEditDialog = (client: Client) => {
    setEditingClient(client)
    setDialogOpen(true)
  }

  const handleClientSaved = (client: Client) => {
    setClients((current) =>
      editingClient
        ? current.map((item) => (item.id === client.id ? client : item))
        : [client, ...current],
    )
  }

  const toggleClientStatus = async (client: Client) => {
    const nextValue = !client.is_active
    try {
      const response = await fetchClientApi("/api/clients", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: client.id,
          name: client.name,
          email: client.email,
          companyName: client.company_name,
          phone: client.phone,
          address: client.address,
          notes: client.notes,
          isActive: nextValue,
        }),
      })
      const data = (await response.json()) as Client

      setClients((current) =>
        current.map((item) => (item.id === client.id ? data : item)),
      )
      toast({
        title: nextValue ? "Client activated" : "Client archived",
        description: `${client.name} is now ${nextValue ? "active" : "inactive"}.`,
      })
    } catch (error) {
      toast({
        title: "Status update failed",
        description: getClientErrorMessage(error),
        variant: "destructive",
      })
    }
  }

  const deleteClient = async (client: Client) => {
    const confirmed = window.confirm(`Delete ${client.name}? This cannot be undone.`)
    if (!confirmed) return

    try {
      await fetchClientApi(`/api/clients?id=${encodeURIComponent(client.id)}`, {
        method: "DELETE",
      })

      setClients((current) => current.filter((item) => item.id !== client.id))
      toast({
        title: "Client deleted",
        description: `${client.name} has been removed.`,
      })
    } catch (error) {
      toast({
        title: "Delete failed",
        description: getClientErrorMessage(error),
        variant: "destructive",
      })
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="flex flex-col gap-4 border-b border-hairline pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-display-md font-bold tracking-tight text-ink">Clients</h1>
          <p className="text-body-md font-medium text-ink-mute">Save invoice recipients and billing details.</p>
        </div>
        <Button className="h-10 rounded-md font-bold" onClick={openAddDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Client
        </Button>
      </div>
      <ClientDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingClient={editingClient}
        onSaved={handleClientSaved}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="rounded-lg border-hairline bg-canvas shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-micro-cap uppercase tracking-widest text-ink-mute">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-display-sm font-bold text-ink text-tabular">{clients.length}</div>
            <p className="text-caption text-ink-mute">Saved recipients</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg border-hairline bg-canvas shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-micro-cap uppercase tracking-widest text-ink-mute">Active</CardTitle>
            <UserRound className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-display-sm font-bold text-ink text-tabular">{activeClients.length}</div>
            <p className="text-caption text-ink-mute">Ready for invoices</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg border-hairline bg-canvas shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-micro-cap uppercase tracking-widest text-ink-mute">Archived</CardTitle>
            <Building2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-display-sm font-bold text-ink text-tabular">{inactiveClients.length}</div>
            <p className="text-caption text-ink-mute">Hidden from invoice pickers</p>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden rounded-lg border-hairline bg-canvas shadow-sm">
        <CardHeader className="border-b border-hairline bg-canvas-soft/30 p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-heading-lg text-ink">Client Directory</CardTitle>
              <p className="mt-1 text-caption font-medium text-ink-mute">Manage recipients before generating invoices.</p>
            </div>
            <div className="relative w-full lg:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search clients"
                className="h-10 border-hairline pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table className="min-w-[900px]">
            <TableHeader className="bg-white">
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-6 text-micro-cap font-black uppercase tracking-[0.18em] text-ink-mute lg:px-8">Client</TableHead>
                <TableHead className="text-micro-cap font-black uppercase tracking-[0.18em] text-ink-mute">Contact</TableHead>
                <TableHead className="text-micro-cap font-black uppercase tracking-[0.18em] text-ink-mute">Address</TableHead>
                <TableHead className="text-micro-cap font-black uppercase tracking-[0.18em] text-ink-mute">Status</TableHead>
                <TableHead className="px-6 text-right text-micro-cap font-black uppercase tracking-[0.18em] text-ink-mute lg:px-8">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={5} className="px-8 py-12 text-center">
                    <p className="text-body-md font-bold text-ink">Loading clients...</p>
                    <p className="mt-1 text-caption text-ink-mute">Fetching your saved recipients.</p>
                  </TableCell>
                </TableRow>
              ) : filteredClients.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={5} className="px-8 py-12 text-center">
                    <p className="text-body-md font-bold text-ink">{search ? "No matching clients" : "No clients yet"}</p>
                    <p className="mt-1 text-caption text-ink-mute">
                      {search ? "Try another search term." : "Add your first client to prepare invoice generation."}
                    </p>
                    {!search && (
                      <Button className="mt-5 rounded-md font-bold" onClick={openAddDialog}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Client
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.map((client) => (
                  <TableRow key={client.id} className="border-hairline hover:bg-canvas-soft/40">
                    <TableCell className="px-6 py-5 lg:px-8">
                      <div className="min-w-0">
                        <p className="truncate text-body-md font-bold text-ink">{client.name}</p>
                        {client.company_name && (
                          <p className="mt-1 truncate text-caption font-semibold text-ink-mute">{client.company_name}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm font-semibold text-ink-secondary">
                          <Mail className="h-3.5 w-3.5 text-ink-mute" />
                          <span className="max-w-[220px] truncate">{client.email}</span>
                        </div>
                        {client.phone && (
                          <div className="flex items-center gap-2 text-xs font-medium text-ink-mute">
                            <Phone className="h-3.5 w-3.5" />
                            <span>{client.phone}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[280px] py-5">
                      <p className="line-clamp-2 text-sm font-medium text-ink-mute">{client.address || "Not set"}</p>
                    </TableCell>
                    <TableCell className="py-5">
                      <Badge
                        variant="outline"
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                          client.is_active
                            ? "border-emerald-200/60 bg-emerald-50 text-emerald-700"
                            : "border-hairline bg-canvas-soft text-ink-mute",
                        )}
                      >
                        {client.is_active ? "Active" : "Archived"}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-5 text-right lg:px-8">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-md text-ink-mute hover:text-primary"
                          onClick={() => openEditDialog(client)}
                          title="Edit client"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          className="h-9 rounded-md px-3 text-xs font-bold text-ink-mute hover:text-primary"
                          onClick={() => toggleClientStatus(client)}
                        >
                          {client.is_active ? "Archive" : "Activate"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-md text-ruby hover:bg-ruby/10 hover:text-ruby"
                          onClick={() => deleteClient(client)}
                          title="Delete client"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
