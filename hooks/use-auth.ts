"use client"

import { useState, useEffect } from 'react'
import {
  type AppUser,
  onAuthStateChanged,
  signInWithEmail,
  signOutUser,
  signUpWithEmail,
} from '@/lib/auth'

export function useAuth() {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged((user) => {
      setUser(user)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, name = "") => {
    return signUpWithEmail(email, password, name)
  }

  const signIn = async (email: string, password: string) => {
    return signInWithEmail(email, password)
  }

  const logout = async () => {
    await signOutUser()
  }

  return {
    user,
    loading,
    signUp,
    signIn,
    logout
  }
}
