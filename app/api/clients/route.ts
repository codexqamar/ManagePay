import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase-server"

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function cleanNullableString(value: unknown) {
  const cleaned = cleanString(value)
  return cleaned || null
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

async function getAuthenticatedUser(request: NextRequest) {
  const supabase = getSupabaseServerClient(request)
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  return { supabase, user, error }
}

async function isAdminUser(userId: string, email?: string | null) {
  const supabase = getSupabaseServiceClient()
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle()

  return data?.role === "admin" || email === "admin@stratonally.com"
}

export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(request)

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(request.url)
    const activeOnly = url.searchParams.get("active") === "true"

    const supabase = getSupabaseServiceClient()
    const isAdmin = await isAdminUser(user.id, user.email)

    let query = supabase
      .from("clients")
      .select("*")

    if (!isAdmin) {
      query = query.eq("user_id", user.id)
    }

    if (activeOnly) {
      query = query.eq("is_active", true)
    }

    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching clients:", error)
      return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 })
    }

    return NextResponse.json(data ?? [])
  } catch (error) {
    console.error("Error fetching clients:", error)
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(request)

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const name = cleanString(body.name)
    const email = cleanString(body.email).toLowerCase()

    if (!name || !email) {
      return NextResponse.json({ error: "Client name and email are required" }, { status: 400 })
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Please enter a valid client email" }, { status: 400 })
    }

    const client = {
      user_id: user.id,
      name,
      email,
      company_name: cleanNullableString(body.companyName),
      phone: cleanNullableString(body.phone),
      address: cleanNullableString(body.address),
      notes: cleanNullableString(body.notes),
      is_active: body.isActive === false ? false : true,
    }

    const supabase = getSupabaseServiceClient()
    const { data, error } = await supabase
      .from("clients")
      .insert(client)
      .select()
      .single()

    if (error) {
      console.error("Error creating client:", error)
      return NextResponse.json({ error: "Failed to create client" }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error("Error creating client:", error)
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(request)

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const id = cleanString(body.id)

    if (!id) {
      return NextResponse.json({ error: "Client id is required" }, { status: 400 })
    }

    const name = cleanString(body.name)
    const email = cleanString(body.email).toLowerCase()

    if (!name || !email) {
      return NextResponse.json({ error: "Client name and email are required" }, { status: 400 })
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Please enter a valid client email" }, { status: 400 })
    }

    const updates = {
      name,
      email,
      company_name: cleanNullableString(body.companyName),
      phone: cleanNullableString(body.phone),
      address: cleanNullableString(body.address),
      notes: cleanNullableString(body.notes),
      is_active: body.isActive === false ? false : true,
    }

    const supabase = getSupabaseServiceClient()
    const isAdmin = await isAdminUser(user.id, user.email)
    let query = supabase
      .from("clients")
      .update(updates)
      .eq("id", id)
      .select()

    if (!isAdmin) {
      query = query.eq("user_id", user.id)
    }

    const { data, error } = await query.single()

    if (error) {
      console.error("Error updating client:", error)
      return NextResponse.json({ error: "Failed to update client" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error updating client:", error)
    return NextResponse.json({ error: "Failed to update client" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(request)

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(request.url)
    const id = cleanString(url.searchParams.get("id"))

    if (!id) {
      return NextResponse.json({ error: "Client id is required" }, { status: 400 })
    }

    const supabase = getSupabaseServiceClient()
    const isAdmin = await isAdminUser(user.id, user.email)
    let query = supabase
      .from("clients")
      .delete()
      .eq("id", id)

    if (!isAdmin) {
      query = query.eq("user_id", user.id)
    }

    const { error } = await query

    if (error) {
      console.error("Error deleting client:", error)
      return NextResponse.json({ error: "Failed to delete client" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting client:", error)
    return NextResponse.json({ error: "Failed to delete client" }, { status: 500 })
  }
}
