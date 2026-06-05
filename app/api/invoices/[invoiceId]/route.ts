import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServiceClient } from "@/lib/supabase-server"

interface RouteContext {
  params: Promise<{
    invoiceId: string
  }>
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { invoiceId } = await context.params

    if (!invoiceId) {
      return NextResponse.json({ error: "invoiceId is required" }, { status: 400 })
    }

    const supabase = getSupabaseServiceClient()
    
    // Attempt to fetch the invoice
    // We use service role to bypass RLS and ensure the payment page can always see the invoice
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", invoiceId)
      .maybeSingle()

    if (error) {
      console.error("Supabase error fetching invoice:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      // If not found by UUID, try fetching by invoice_number as a fallback
      const { data: byNumber, error: numberError } = await supabase
        .from("invoices")
        .select("*")
        .eq("invoice_number", invoiceId)
        .maybeSingle()

      if (numberError) {
        return NextResponse.json({ error: numberError.message }, { status: 500 })
      }

      if (!byNumber) {
        return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
      }
      
      return NextResponse.json(byNumber)
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Critical error fetching public invoice:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch invoice" },
      { status: 500 }
    )
  }
}
