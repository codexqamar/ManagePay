"use client"

import { useState, useEffect, useCallback } from "react"
import {
  type AppUser,
  onAuthStateChanged,
  signInWithEmail,
  signOutUser,
  signUpWithEmail,
  getUserProfile,
} from "@/lib/auth"
import type { Profile } from "@/lib/supabase-types"

export function useAuth() {
  const [user, setUser] = useState<AppUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null)
      return
    }
    const p = await getUserProfile()
    setProfile(p)
  }, [user])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged((user) => {
      setUser(user)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    refreshProfile()
  }, [user, refreshProfile])

  const signUp = async (email: string, password: string, name = "") => {
    const newUser = await signUpWithEmail(email, password, name)
    if (newUser) {
      const p = await getUserProfile()
      setProfile(p)
    }
    return newUser
  }

  const signIn = async (email: string, password: string) => {
    const loggedInUser = await signInWithEmail(email, password)
    if (loggedInUser) {
      const p = await getUserProfile()
      setProfile(p)
    }
    return loggedInUser
  }

  const logout = async () => {
    await signOutUser()
    setProfile(null)
  }

  return {
    user,
    profile,
    loading,
    signUp,
    signIn,
    logout,
    refreshProfile,
  }
}
