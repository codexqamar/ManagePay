import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { stripe } from "@/lib/stripe-server"
import { getSupabaseServiceClient } from "@/lib/supabase-server"

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(request: NextRequest) {
  if (!endpointSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured")
    return NextResponse.json(
      { error: "Webhook secret is not configured" },
      { status: 500 },
    )
  }

  const payload = await request.text()
  const sig = request.headers.get("stripe-signature")

  if (!sig) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 },
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(payload, sig, endpointSecret)
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`)
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 },
    )
  }

  // Handle the event
  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent
    const invoiceId = paymentIntent.metadata?.invoiceId

    if (!invoiceId) {
      console.warn("No invoiceId found in payment intent metadata")
      return NextResponse.json({ received: true })
    }

    try {
      const supabase = getSupabaseServiceClient()

      const { error } = await supabase
        .from("invoices")
        .update({
          status: "paid",
          stripe_payment_intent_id: paymentIntent.id,
        })
        .eq("id", invoiceId)

      if (error) {
        console.error("Failed to update invoice status:", error)
        return NextResponse.json(
          { error: "Database update failed" },
          { status: 500 },
        )
      }

      console.log(`Invoice ${invoiceId} marked as paid via webhook`)
    } catch (dbError: any) {
      console.error("Database error in webhook handler:", dbError)
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      )
    }
  }

  return NextResponse.json({ received: true })
}
