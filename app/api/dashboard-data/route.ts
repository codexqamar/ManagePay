import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase-server"

async function getAuthenticatedContext(request: NextRequest) {
  const authClient = getSupabaseServerClient(request)
  const {
    data: { user },
    error,
  } = await authClient.auth.getUser()

  if (error || !user) {
    return { user: null, isAdmin: false, error }
  }

  const serviceClient = getSupabaseServiceClient()
  const { data: profile } = await serviceClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  return {
    user,
    isAdmin: profile?.role === "admin" || user.email === "admin@stratonally.com",
    error: null,
  }
}

export async function GET(request: NextRequest) {
  try {
    const { user, isAdmin, error } = await getAuthenticatedContext(request)

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = getSupabaseServiceClient()
    let invoicesQuery = supabase
      .from("invoices")
      .select("*")
      .order("created_at", { ascending: false })

    let clientsQuery = supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false })

    if (!isAdmin) {
      invoicesQuery = invoicesQuery.eq("seller_id", user.id)
      clientsQuery = clientsQuery.eq("user_id", user.id)
    }

    const [invoicesResult, clientsResult, companiesResult] = await Promise.all([
      invoicesQuery,
      clientsQuery,
      supabase.from("companies").select("*").order("name", { ascending: true }),
    ])

    if (invoicesResult.error) throw invoicesResult.error
    if (clientsResult.error) throw clientsResult.error
    if (companiesResult.error) throw companiesResult.error

    return NextResponse.json({
      invoices: invoicesResult.data ?? [],
      clients: clientsResult.data ?? [],
      companies: companiesResult.data ?? [],
    })
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 })
  }
}
