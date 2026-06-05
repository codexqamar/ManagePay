import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase-server"

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
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

export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(request)

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!(await isAdminUser(user.id, user.email))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const supabase = getSupabaseServiceClient()
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("email", { ascending: true })

    if (error) throw error

    return NextResponse.json(data ?? [])
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
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
    const role = cleanString(body.role)

    if (!id || !["admin", "user"].includes(role)) {
      return NextResponse.json({ error: "Valid user id and role are required" }, { status: 400 })
    }

    if (id === user.id) {
      return NextResponse.json({ error: "You cannot change your own role" }, { status: 400 })
    }

    const supabase = getSupabaseServiceClient()
    const { data, error } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error updating user role:", error)
    return NextResponse.json({ error: "Failed to update user role" }, { status: 500 })
  }
}
