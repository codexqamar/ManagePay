import Stripe from "stripe"

let stripeClient: Stripe | null = null

function getStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY

  if (!secretKey) {
    throw new Error(
      "STRIPE_SECRET_KEY is missing. Add it to your environment variables.",
    )
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey, {
      apiVersion: "2025-08-27.basil",
    })
  }

  return stripeClient
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, property: keyof Stripe) {
    return getStripeClient()[property]
  },
}) as Stripe
