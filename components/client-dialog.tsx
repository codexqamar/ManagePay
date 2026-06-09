"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { getSupabaseBrowserClient } from "@/lib/supabase"
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

export function getClientErrorMessage(error: unknown) {
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

export async function getSignedInUserId() {
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

interface ClientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingClient?: Client | null
  onSaved: (client: Client) => void
}

export function ClientDialog({ open, onOpenChange, editingClient = null, onSaved }: ClientDialogProps) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<ClientFormValues>(emptyForm)

  useEffect(() => {
    if (!open) return
    setForm(editingClient ? toFormValues(editingClient) : emptyForm)
  }, [editingClient, open])

  const updateForm = (field: keyof ClientFormValues, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }))
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
      onSaved(data)
      onOpenChange(false)
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            onClick={() => onOpenChange(false)}
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
  )
}
