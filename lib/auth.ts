import type { User } from "@supabase/supabase-js"
import { getSupabaseBrowserClient } from "@/lib/supabase"

export type AppUser = User

export function getUserDisplayName(user: AppUser | null) {
  if (!user) return ""

  return (
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email ||
    "Not set"
  )
}

export function getUserPhotoUrl(user: AppUser | null) {
  if (!user) return null

  return (
    user.user_metadata?.avatar_url ||
    user.user_metadata?.picture ||
    null
  )
}

export function isUserEmailVerified(user: AppUser | null) {
  return Boolean(user?.email_confirmed_at || user?.confirmed_at)
}

export async function getCurrentUser() {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.auth.getUser()

  if (error) {
    return null
  }

  return data.user
}

export async function signUpWithEmail(email: string, password: string, name: string) {
  const supabase = getSupabaseBrowserClient()
  const origin = typeof window !== "undefined" ? window.location.origin : undefined

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
        name,
      },
      emailRedirectTo: origin,
    },
  })

  if (error) {
    throw error
  }

  return data.user
}

export async function signInWithEmail(email: string, password: string) {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw error
  }

  return data.user
}

export async function sendPasswordReset(email: string) {
  const supabase = getSupabaseBrowserClient()
  const redirectTo =
    typeof window !== "undefined" ? `${window.location.origin}/` : undefined

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  })

  if (error) {
    throw error
  }
}

export async function updateUserProfile(values: { name?: string; email?: string }) {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.auth.updateUser({
    email: values.email,
    data: values.name
      ? {
          full_name: values.name,
          name: values.name,
        }
      : undefined,
  })

  if (error) {
    throw error
  }

  return data.user
}

export async function signOutUser() {
  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase.auth.signOut()

  if (error) {
    throw error
  }
}

export function onAuthStateChanged(callback: (user: AppUser | null) => void) {
  const supabase = getSupabaseBrowserClient()
  let active = true

  supabase.auth.getSession().then(({ data }) => {
    if (active) {
      callback(data.session?.user ?? null)
    }
  })

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null)
  })

  return () => {
    active = false
    subscription.unsubscribe()
  }
}
