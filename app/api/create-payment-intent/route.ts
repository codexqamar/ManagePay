import { type NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe-server"

const supportedCurrencies = [
  "usd", "eur", "gbp", "jpy", "cad", "aud", "chf", "cny", "sek", "nok",
  "dkk", "pln", "czk", "huf", "ron", "bgn", "hrk", "rub", "uah", "aed",
  "sar", "qar", "kwd", "bhd", "omr", "jod", "lbp", "egp", "zar", "ngn",
  "kes", "ghs", "mad", "tnd", "mxn", "brl", "ars", "clp", "cop", "pen",
  "uyu", "bob", "pyg", "gtq", "crc", "dop", "try", "ils", "pkr", "bdt",
  "lkr", "npr", "mmk", "khr", "lak", "bnd", "fjd", "top", "wst", "vuv",
  "sbd", "pgk", "inr", "thb", "myr", "idr", "php", "vnd", "sgd", "hkd", "krw",
]

export async function POST(request: NextRequest) {
  try {
    const { amount, currency = "usd", description, customerEmail, metadata } = await request.json()

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
    }

    const normalizedCurrency = currency.toLowerCase()
    const finalCurrency = supportedCurrencies.includes(normalizedCurrency) ? normalizedCurrency : "usd"

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: finalCurrency,
      description,
      receipt_email: customerEmail,
      metadata: metadata || {},
      automatic_payment_methods: {
        enabled: true,
      },
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    })
  } catch (error) {
    console.error("Error creating payment intent:", error)
    return NextResponse.json({ error: "Failed to create payment intent" }, { status: 500 })
  }
}
