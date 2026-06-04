import type { User } from "@supabase/supabase-js"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { getProfileById, upsertProfile } from "@/lib/database"
import type { Profile } from "@/lib/supabase-types"

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

export async function getUserProfile(): Promise<Profile | null> {
  const user = await getCurrentUser()
  if (!user) return null
  return getProfileById(user.id)
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

  // NOTE: We intentionally do NOT upsert the profile here.
  // After signup the browser session is still anonymous (email verification
  // pending), so RLS would block the insert. The database trigger
  // `on_auth_user_created` handles profile creation server-side.

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

  const user = data.user
  if (!user) {
    throw new Error("Login succeeded but no user returned")
  }

  // Verify the user has a profile row. If the DB trigger ever missed
  // (race condition, legacy user, etc.), create it now while we are
  // authenticated so RLS allows the insert.
  const profile = await getProfileById(user.id)
  if (!profile) {
    await upsertProfile({
      id: user.id,
      email: user.email ?? email,
      full_name: (user.user_metadata?.full_name as string | undefined) || null,
      avatar_url: (user.user_metadata?.avatar_url as string | undefined) || null,
      stripe_account_id: null,
      stripe_account_enabled: false,
    })
  }

  return user
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

export async function updateUserProfile(values: { name?: string; email?: string; photoUrl?: string }) {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.auth.updateUser({
    email: values.email,
    data: values.name || values.photoUrl
      ? {
          ...(values.name ? { full_name: values.name, name: values.name } : {}),
          ...(values.photoUrl ? { avatar_url: values.photoUrl, picture: values.photoUrl } : {}),
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
