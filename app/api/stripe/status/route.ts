import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe-server"

export async function GET() {
  try {
    // Make a lightweight API call to verify the secret key is valid.
    // retrieveBalance() is a safe, read-only check.
    await stripe.balance.retrieve()
    return NextResponse.json({ connected: true })
  } catch (error: any) {
    console.error("Stripe status check failed:", error.message)
    return NextResponse.json(
      { connected: false, message: error.message || "Invalid Stripe credentials" },
      { status: 200 }, // 200 so the frontend can read the JSON safely
    )
  }
}
