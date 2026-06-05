import { type NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe-server"
import { getSupabaseServiceClient } from "@/lib/supabase-server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { invoiceId } = body

    if (!invoiceId) {
      return NextResponse.json({ error: "invoiceId is required" }, { status: 400 })
    }

    const supabase = getSupabaseServiceClient()

    // Fetch the invoice and verify ownership / client access
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", invoiceId)
      .single()

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    if (invoice.status !== "pending") {
      return NextResponse.json(
        { error: `Invoice is already ${invoice.status}` },
        { status: 400 },
      )
    }

    // Create the Payment Intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: invoice.amount_in_cents,
      currency: invoice.currency,
      description: invoice.description || `Invoice ${invoice.id}`,
      metadata: {
        invoiceId: invoice.id,
        sellerId: invoice.seller_id,
        clientId: invoice.client_id || "",
      },
      automatic_payment_methods: {
        enabled: true,
      },
    })

    // Store the payment intent ID in the invoice row
    const { error: updateError } = await supabase
      .from("invoices")
      .update({ stripe_payment_intent_id: paymentIntent.id })
      .eq("id", invoiceId)

    if (updateError) {
      console.error("Failed to update invoice with payment intent ID:", updateError)
      // We continue because the PI was already created; the webhook will handle it
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    })
  } catch (error: any) {
    console.error("Error creating payment intent:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create payment intent" },
      { status: 500 },
    )
  }
}
