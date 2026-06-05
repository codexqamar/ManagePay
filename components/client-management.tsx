"use client"

import { useEffect, useMemo, useState } from "react"
import { Building2, Edit, Mail, Phone, Plus, Search, Trash2, UserRound, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import type { Client } from "@/lib/supabase-types"

type ClientFormValues = {
  name: string
  email: string
  companyName: string
  phone: string
  address: string
  notes: string
  isActive: boolean
}

const emptyForm: ClientFormValues = {
  name: "",
  email: "",
  companyName: "",
  phone: "",
  address: "",
  notes: "",
  isActive: true,
}

function toFormValues(client: Client): ClientFormValues {
  return {
    name: client.name,
    email: client.email,
    companyName: client.company_name || "",
    phone: client.phone || "",
    address: client.address || "",
    notes: client.notes || "",
    isActive: client.is_active,
  }
}

function getClientErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "Client operation failed."
  const normalized = message.toLowerCase()

  if (
    normalized.includes("could not find the table") ||
    normalized.includes("relation") && normalized.includes("clients") && normalized.includes("does not exist")
  ) {
    return "The clients table does not exist in Supabase yet. Apply migration 00003_add_clients_table.sql, then try again."
  }

  if (normalized.includes("foreign key") || normalized.includes("violates foreign key constraint")) {
    return "Your profile row is missing in Supabase. Sign out and sign back in, then try adding the client again."
  }

  if (normalized.includes("row-level security") || normalized.includes("permission denied")) {
    return "Supabase blocked this request. Check that the clients RLS policy from migration 00003 is applied."
  }

  return message
}

async function getSignedInUserId() {
  const supabase = getSupabaseBrowserClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error("Please sign in again to manage clients.")
  }

  return user.id
}

export function ClientManagement() {
  const { toast } = useToast()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [search, setSearch] = useState("")
  const [form, setForm] = useState<ClientFormValues>(emptyForm)

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

  const loadClients = async () => {
    setLoading(true)
    try {
      const supabase = getSupabaseBrowserClient()
      const userId = await getSignedInUserId()
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (error) {
        throw new Error(error.message)
      }

      setClients((data ?? []) as Client[])
    } catch (error) {
      toast({
        title: "Clients unavailable",
        description: getClientErrorMessage(error),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadClients()
  }, [])

  const updateForm = (field: keyof ClientFormValues, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const openAddDialog = () => {
    setEditingClient(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEditDialog = (client: Client) => {
    setEditingClient(client)
    setForm(toFormValues(client))
    setDialogOpen(true)
  }

  const saveClient = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast({
        title: "Missing client details",
        description: "Client name and email are required.",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      const supabase = getSupabaseBrowserClient()
      const userId = await getSignedInUserId()
      const payload = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        company_name: form.companyName.trim() || null,
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        notes: form.notes.trim() || null,
        is_active: form.isActive,
      }

      const result = editingClient
        ? await supabase
            .from("clients")
            .update(payload)
            .eq("id", editingClient.id)
            .eq("user_id", userId)
            .select()
            .single()
        : await supabase
            .from("clients")
            .insert({
              ...payload,
              user_id: userId,
            })
            .select()
            .single()

      if (result.error) {
        throw new Error(result.error.message)
      }

      const data = result.data as Client
      if (editingClient) {
        setClients((current) =>
          current.map((client) => (client.id === data.id ? data : client)),
        )
      } else {
        setClients((current) => [data, ...current])
      }

      setDialogOpen(false)
      toast({
        title: editingClient ? "Client updated" : "Client added",
        description: `${data.name} is ready for invoice generation.`,
      })
    } catch (error) {
      toast({
        title: "Save failed",
        description: getClientErrorMessage(error),
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const toggleClientStatus = async (client: Client) => {
    const nextValue = !client.is_active
    try {
      const supabase = getSupabaseBrowserClient()
      const userId = await getSignedInUserId()
      const { data, error } = await supabase
        .from("clients")
        .update({ is_active: nextValue })
        .eq("id", client.id)
        .eq("user_id", userId)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

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
      const supabase = getSupabaseBrowserClient()
      const userId = await getSignedInUserId()
      const { error } = await supabase
        .from("clients")
        .delete()
        .eq("id", client.id)
        .eq("user_id", userId)

      if (error) {
        throw new Error(error.message)
      }

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
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="h-10 rounded-md font-bold" onClick={openAddDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto rounded-lg border-hairline sm:max-w-[560px]">
            <DialogHeader>
              <DialogTitle>{editingClient ? "Edit Client" : "Add Client"}</DialogTitle>
              <DialogDescription>
                Store the recipient details you reuse when creating invoices.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="client-name">Client Name *</Label>
                  <Input
                    id="client-name"
                    value={form.name}
                    onChange={(event) => updateForm("name", event.target.value)}
                    placeholder="Jane Smith"
                    className="border-hairline"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-email">Email *</Label>
                  <Input
                    id="client-email"
                    type="email"
                    value={form.email}
                    onChange={(event) => updateForm("email", event.target.value)}
                    placeholder="client@example.co.uk"
                    className="border-hairline"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="client-company">Company</Label>
                  <Input
                    id="client-company"
                    value={form.companyName}
                    onChange={(event) => updateForm("companyName", event.target.value)}
                    placeholder="Client company"
                    className="border-hairline"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-phone">Phone</Label>
                  <Input
                    id="client-phone"
                    value={form.phone}
                    onChange={(event) => updateForm("phone", event.target.value)}
                    placeholder="+44 20 0000 0000"
                    className="border-hairline"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="client-address">Billing Address</Label>
                <Textarea
                  id="client-address"
                  value={form.address}
                  onChange={(event) => updateForm("address", event.target.value)}
                  placeholder="Billing address"
                  rows={3}
                  className="border-hairline"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client-notes">Notes</Label>
                <Textarea
                  id="client-notes"
                  value={form.notes}
                  onChange={(event) => updateForm("notes", event.target.value)}
                  placeholder="Payment terms, contacts, or internal notes"
                  rows={3}
                  className="border-hairline"
                />
              </div>
              <div className="flex items-center justify-between rounded-md border border-hairline bg-canvas-soft p-3">
                <div>
                  <p className="text-sm font-bold text-ink">Active client</p>
                  <p className="text-xs font-medium text-ink-mute">Only active clients will appear in invoice pickers.</p>
                </div>
                <Switch checked={form.isActive} onCheckedChange={(checked) => updateForm("isActive", checked)} />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                className="rounded-md border-hairline"
                onClick={() => setDialogOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button className="rounded-md" onClick={saveClient} disabled={saving}>
                {saving ? "Saving..." : editingClient ? "Save Changes" : "Add Client"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

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
