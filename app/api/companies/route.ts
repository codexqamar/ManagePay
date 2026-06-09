import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase-server"

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function cleanNullableString(value: unknown) {
  const cleaned = cleanString(value)
  return cleaned || null
}

async function getAuthenticatedUser(request: NextRequest) {
  const supabase = getSupabaseServerClient(request)
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  return { user, error }
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

function companyPayload(body: any) {
  return {
    name: cleanString(body.name),
    email: cleanString(body.email).toLowerCase(),
    address: cleanNullableString(body.address),
    phone: cleanNullableString(body.phone),
    website: cleanNullableString(body.website),
    logo_url: cleanNullableString(body.logoUrl),
    payment_base_url: cleanNullableString(body.paymentBaseUrl),
    tax_id: cleanNullableString(body.taxId),
    logo_has_dark_bg: typeof body.logoHasDarkBg === 'boolean' ? body.logoHasDarkBg : false,
  }
}

export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(request)

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = getSupabaseServiceClient()
    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .order("name", { ascending: true })

    if (error) throw error

    return NextResponse.json(data ?? [])
  } catch (error) {
    console.error("Error fetching companies:", error)
    return NextResponse.json({ error: "Failed to fetch companies" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(request)

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!(await isAdminUser(user.id, user.email))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const payload = companyPayload(await request.json())

    if (!payload.name || !payload.email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 })
    }

    const supabase = getSupabaseServiceClient()
    const { data, error } = await supabase
      .from("companies")
      .insert({ ...payload, is_active: true })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error("Error creating company:", error)
    return NextResponse.json({ error: "Failed to create company" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(request)

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!(await isAdminUser(user.id, user.email))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const id = cleanString(body.id)

    if (!id) {
      return NextResponse.json({ error: "Company id is required" }, { status: 400 })
    }

    const payload =
      typeof body.isActive === "boolean"
        ? { is_active: body.isActive }
        : companyPayload(body)

    if ("name" in payload && (!payload.name || !payload.email)) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 })
    }

    const supabase = getSupabaseServiceClient()
    const { data, error } = await supabase
      .from("companies")
      .update(payload)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error updating company:", error)
    return NextResponse.json({ error: "Failed to update company" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(request)

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!(await isAdminUser(user.id, user.email))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const id = cleanString(new URL(request.url).searchParams.get("id"))

    if (!id) {
      return NextResponse.json({ error: "Company id is required" }, { status: 400 })
    }

    const supabase = getSupabaseServiceClient()
    const { error } = await supabase
      .from("companies")
      .delete()
      .eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting company:", error)
    return NextResponse.json({ error: "Failed to delete company" }, { status: 500 })
  }
}
