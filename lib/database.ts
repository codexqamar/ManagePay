import { getSupabaseBrowserClient } from "@/lib/supabase"
import type {
  Profile,
  Product,
  Order,
  InsertProfile,
  UpdateProfile,
  InsertProduct,
  UpdateProduct,
  InsertOrder,
  UpdateOrder,
} from "@/lib/supabase-types"

/* ============================================================
   PROFILES
   ============================================================ */

export async function getProfileById(id: string): Promise<Profile | null> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (error) {
    console.error("getProfileById error:", error.message)
    return null
  }
  return data as Profile | null
}

export async function upsertProfile(profile: InsertProfile): Promise<Profile | null> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("profiles")
    .upsert(profile, { onConflict: "id" })
    .select()
    .single()

  if (error) {
    console.error("upsertProfile error:", error.message)
    return null
  }
  return data as Profile
}

export async function updateProfile(id: string, values: UpdateProfile): Promise<Profile | null> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("profiles")
    .update(values)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("updateProfile error:", error.message)
    return null
  }
  return data as Profile
}

export async function setStripeAccountId(
  userId: string,
  stripeAccountId: string,
): Promise<Profile | null> {
  return updateProfile(userId, {
    stripe_account_id: stripeAccountId,
    stripe_account_enabled: false,
  })
}

export async function enableStripeAccount(userId: string): Promise<Profile | null> {
  return updateProfile(userId, { stripe_account_enabled: true })
}

/* ============================================================
   PRODUCTS
   ============================================================ */

export async function getProductsByUser(userId: string): Promise<Product[]> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("getProductsByUser error:", error.message)
    return []
  }
  return (data ?? []) as Product[]
}

export async function getProductById(id: string): Promise<Product | null> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (error) {
    console.error("getProductById error:", error.message)
    return null
  }
  return data as Product | null
}

export async function getActiveProducts(): Promise<Product[]> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("getActiveProducts error:", error.message)
    return []
  }
  return (data ?? []) as Product[]
}

export async function createProduct(product: InsertProduct): Promise<Product | null> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("products")
    .insert(product)
    .select()
    .single()

  if (error) {
    console.error("createProduct error:", error.message)
    return null
  }
  return data as Product
}

export async function updateProduct(id: string, values: UpdateProduct): Promise<Product | null> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("products")
    .update(values)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("updateProduct error:", error.message)
    return null
  }
  return data as Product
}

export async function deleteProduct(id: string): Promise<boolean> {
  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase.from("products").delete().eq("id", id)

  if (error) {
    console.error("deleteProduct error:", error.message)
    return false
  }
  return true
}

/* ============================================================
   ORDERS
   ============================================================ */

export async function getOrdersByUser(userId: string): Promise<Order[]> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("getOrdersByUser error:", error.message)
    return []
  }
  return (data ?? []) as Order[]
}

export async function getOrderById(id: string): Promise<Order | null> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (error) {
    console.error("getOrderById error:", error.message)
    return null
  }
  return data as Order | null
}

export async function getOrderByPaymentIntentId(paymentIntentId: string): Promise<Order | null> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("stripe_payment_intent_id", paymentIntentId)
    .maybeSingle()

  if (error) {
    console.error("getOrderByPaymentIntentId error:", error.message)
    return null
  }
  return data as Order | null
}

export async function createOrder(order: InsertOrder): Promise<Order | null> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("orders")
    .insert(order)
    .select()
    .single()

  if (error) {
    console.error("createOrder error:", error.message)
    return null
  }
  return data as Order
}

export async function updateOrder(id: string, values: UpdateOrder): Promise<Order | null> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("orders")
    .update(values)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("updateOrder error:", error.message)
    return null
  }
  return data as Order
}

export async function updateOrderStatus(
  id: string,
  status: Order["status"],
): Promise<Order | null> {
  return updateOrder(id, { status })
}

export async function setOrderPaymentIntent(
  id: string,
  paymentIntentId: string,
): Promise<Order | null> {
  return updateOrder(id, { stripe_payment_intent_id: paymentIntentId })
}

export async function setOrderTransferId(
  id: string,
  transferId: string,
): Promise<Order | null> {
  return updateOrder(id, { stripe_transfer_id: transferId })
}

/* ============================================================
   INVOICES
   ============================================================ */

import type { Invoice, InsertInvoice, UpdateInvoice } from "@/lib/supabase-types"

export async function getInvoicesBySeller(sellerId: string): Promise<Invoice[]> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("getInvoicesBySeller error:", error.message)
    return []
  }
  return (data ?? []) as Invoice[]
}

export async function getInvoicesByClient(clientId: string): Promise<Invoice[]> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("getInvoicesByClient error:", error.message)
    return []
  }
  return (data ?? []) as Invoice[]
}

export async function getInvoiceById(id: string): Promise<Invoice | null> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (error) {
    console.error("getInvoiceById error:", error.message)
    return null
  }
  return data as Invoice | null
}

export async function createInvoice(invoice: InsertInvoice): Promise<Invoice | null> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("invoices")
    .insert(invoice)
    .select()
    .single()

  if (error) {
    console.error("createInvoice error:", error.message)
    return null
  }
  return data as Invoice
}

export async function updateInvoice(id: string, values: UpdateInvoice): Promise<Invoice | null> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("invoices")
    .update(values)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("updateInvoice error:", error.message)
    return null
  }
  return data as Invoice
}

export async function updateInvoiceStatus(
  id: string,
  status: Invoice["status"],
): Promise<Invoice | null> {
  return updateInvoice(id, { status })
}

export async function setInvoicePaymentIntentId(
  id: string,
  paymentIntentId: string,
): Promise<Invoice | null> {
  return updateInvoice(id, { stripe_payment_intent_id: paymentIntentId })
}

/* ============================================================
   CLIENTS
   ============================================================ */

import type { Client, InsertClient, UpdateClient } from "@/lib/supabase-types"

export async function getClientsByUser(userId: string): Promise<Client[]> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("getClientsByUser error:", error.message)
    return []
  }
  return (data ?? []) as Client[]
}

export async function getActiveClientsByUser(userId: string): Promise<Client[]> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("name", { ascending: true })

  if (error) {
    console.error("getActiveClientsByUser error:", error.message)
    return []
  }
  return (data ?? []) as Client[]
}

export async function getClientById(id: string): Promise<Client | null> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (error) {
    console.error("getClientById error:", error.message)
    return null
  }
  return data as Client | null
}

export async function createClientRecord(client: InsertClient): Promise<Client | null> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("clients")
    .insert(client)
    .select()
    .single()

  if (error) {
    console.error("createClientRecord error:", error.message)
    return null
  }
  return data as Client
}

export async function updateClientRecord(id: string, values: UpdateClient): Promise<Client | null> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("clients")
    .update(values)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("updateClientRecord error:", error.message)
    return null
  }
  return data as Client
}

export async function deleteClientRecord(id: string): Promise<boolean> {
  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase.from("clients").delete().eq("id", id)

  if (error) {
    console.error("deleteClientRecord error:", error.message)
    return false
  }
  return true
}

/* ============================================================
   INVOICE SERVICES
   ============================================================ */

import type { InvoiceService, InsertInvoiceService, UpdateInvoiceService } from "@/lib/supabase-types"

export async function getInvoiceServices(): Promise<InvoiceService[]> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("invoice_services")
    .select("*")
    .order("name", { ascending: true })

  if (error) {
    console.error("getInvoiceServices error:", error.message)
    return []
  }
  return (data ?? []) as InvoiceService[]
}

export async function createInvoiceService(service: InsertInvoiceService): Promise<InvoiceService | null> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("invoice_services")
    .insert(service)
    .select()
    .single()

  if (error) {
    console.error("createInvoiceService error:", error.message)
    return null
  }
  return data as InvoiceService
}

export async function updateInvoiceService(id: string, values: UpdateInvoiceService): Promise<InvoiceService | null> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("invoice_services")
    .update(values)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("updateInvoiceService error:", error.message)
    return null
  }
  return data as InvoiceService
}

export async function deleteInvoiceServiceRecord(id: string): Promise<boolean> {
  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase.from("invoice_services").delete().eq("id", id)

  if (error) {
    console.error("deleteInvoiceServiceRecord error:", error.message)
    return false
  }
  return true
}
