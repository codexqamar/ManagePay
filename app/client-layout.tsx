"use client"

import { useEffect, useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { getCurrentUser, onAuthStateChanged, type AppUser } from "@/lib/auth"

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)

  useEffect(() => {
    getCurrentUser().then(setUser)
    return onAuthStateChanged(setUser)
  }, [])

  if (!user) {
    return <>{children}</>
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto relative">
        {children}
      </main>
    </div>
  )
}
