import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase-server"

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient(request)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    const invoice = {
      seller_id: user.id,
      client_id: body.clientId || null,
      client_email: body.clientEmail || "",
      amount_in_cents: Math.round((body.amount || 0) * 100),
      currency: (body.currency || "usd").toLowerCase(),
      description: body.description || "",
      status: "pending",
      metadata: body.metadata || {},
    }

    const { data, error } = await supabase
      .from("invoices")
      .insert(invoice)
      .select()
      .single()

    if (error) {
      console.error("Error creating invoice:", error)
      return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error creating invoice:", error)
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient(request)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(request.url)
    const sellerId = url.searchParams.get("sellerId")

    let query = supabase.from("invoices").select("*")

    if (sellerId) {
      query = query.eq("seller_id", sellerId)
    } else {
      query = query.or(`seller_id.eq.${user.id},client_id.eq.${user.id}`)
    }

    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching invoices:", error)
      return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 })
    }

    return NextResponse.json(data ?? [])
  } catch (error) {
    console.error("Error fetching invoices:", error)
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 })
  }
}
