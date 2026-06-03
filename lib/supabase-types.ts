/*
 * Supabase Database Type Definitions
 * Mirrors the SQL schema in supabase/migrations/00001_initial_schema.sql
 */

export type OrderStatus = "pending" | "succeeded" | "failed" | "refunded" | "canceled"

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  stripe_account_id: string | null
  stripe_account_enabled: boolean
  updated_at: string
}

export interface Product {
  id: string
  user_id: string
  title: string
  description: string | null
  price: number           // cents
  currency: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  buyer_id: string | null
  seller_id: string
  product_id: string | null
  amount: number          // cents
  currency: string
  stripe_payment_intent_id: string | null
  stripe_transfer_id: string | null
  status: OrderStatus
  metadata: Record<string, any> | null
  created_at: string
  updated_at: string
}

export type InsertProfile = Omit<Profile, "updated_at">
export type UpdateProfile = Partial<Omit<Profile, "id" | "updated_at">>

export type InsertProduct = Omit<Product, "id" | "created_at" | "updated_at">
export type UpdateProduct = Partial<Omit<Product, "id" | "user_id" | "created_at" | "updated_at">>

export type InsertOrder = Omit<Order, "id" | "created_at" | "updated_at">
export type UpdateOrder = Partial<Omit<Order, "id" | "created_at" | "updated_at">>

export type InvoiceStatus = "pending" | "paid" | "failed" | "canceled"

export interface Invoice {
  id: string
  seller_id: string
  client_id: string | null
  client_email: string
  amount_in_cents: number
  currency: string
  description: string | null
  status: InvoiceStatus
  stripe_payment_intent_id: string | null
  metadata: Record<string, any> | null
  created_at: string
  updated_at: string
}

export type InsertInvoice = Omit<Invoice, "id" | "created_at" | "updated_at">
export type UpdateInvoice = Partial<Omit<Invoice, "id" | "seller_id" | "created_at" | "updated_at">>
