"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { FileText, CreditCard, BarChart3, Settings, Building2, Plus, Menu, X, LogOut, ChevronLeft, ChevronRight, Users, UserCog } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()
  const { user, profile, logout } = useAuth()
  const isAdmin = user?.role === "admin"

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sidebar-collapsed")
      if (saved) setIsCollapsed(saved === "true")
    }
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("sidebar-collapsed", String(isCollapsed))
    }
  }, [isCollapsed])

  const navItems = [
    { name: "Invoice Generator", icon: FileText, href: "/invoice-generator", current: false },
    { name: "Payment Terminal", icon: CreditCard, href: "/terminal", current: false },
    { name: "Dashboard", icon: BarChart3, href: "/dashboard", current: false },
    { name: "Companies", icon: Building2, href: "/companies", current: false },
    { name: "Clients", icon: Users, href: "/clients", current: false },
    ...(isAdmin ? [{ name: "User Management", icon: UserCog, href: "/users", current: false }] : []),
    { name: "Settings", icon: Settings, href: "/settings", current: false },
  ]

  const updatedNavigation = navItems.map((item) => ({
    ...item,
    current: pathname === item.href,
  }))

  const displayName = profile?.full_name || user?.email || "User"

  const handleLogout = async () => {
    try {
      await logout()
      router.replace("/")
      router.refresh()
      toast({
        title: "Logged out",
        description: "You have been logged out successfully"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to logout"
      })
    }
  }

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="sm"
        className="fixed top-4 left-4 z-50 md:hidden bg-canvas shadow-sm border border-hairline"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 bg-canvas/95 backdrop-blur border-r border-hairline transform transition-all duration-300 ease-in-out md:relative md:translate-x-0",
          isCollapsed ? "w-16" : "w-64",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className={cn(
            "border-b border-hairline",
            isCollapsed ? "p-2" : "p-6"
          )}>
            <div className={cn(
              "flex items-center mb-6",
              isCollapsed ? "justify-center" : "justify-between"
            )}>
              {!isCollapsed && (
                <div className="flex items-center gap-2.5 font-bold text-lg tracking-tight text-ink">
                  <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center shadow-sm">
                    <span className="text-white text-base font-black italic">P</span>
                  </div>
                  ManagePay
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                className={cn("hidden md:flex h-8 w-8 p-0 text-ink-mute hover:text-primary hover:bg-canvas-soft", isCollapsed && "mx-auto")}
                onClick={() => setIsCollapsed(!isCollapsed)}
                title={isCollapsed ? "Expand" : "Collapse"}
              >
                {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>
            </div>

          </div>

          {/* Navigation */}
          <nav className={cn(
            "flex-1 space-y-1",
            isCollapsed ? "p-2" : "p-4"
          )}>
            {updatedNavigation.map((item) => (
              <Link key={item.name} href={item.href} onClick={() => setIsOpen(false)}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full gap-3 relative group transition-colors",
                    isCollapsed ? "justify-center px-2" : "justify-start px-3",
                    item.current
                      ? "bg-canvas-soft text-primary font-bold"
                      : "text-ink-mute hover:bg-canvas-soft hover:text-ink",
                  )}
                  title={item.name}
                >
                  {item.current && !isCollapsed && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-primary rounded-r-full" />
                  )}
                  <item.icon className={cn("h-4 w-4 shrink-0 transition-colors", item.current ? "text-primary" : "group-hover:text-primary")} />
                  {!isCollapsed && <span className="truncate text-[13px]">{item.name}</span>}
                </Button>
              </Link>
            ))}
          </nav>





          {/* Quick Actions */}
          {!isCollapsed && (
            <div className="p-4 border-t border-hairline space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between px-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-ink-mute">Quick Actions</span>
                  <Plus className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="space-y-1.5 rounded-lg border border-hairline bg-canvas-soft p-1.5">
                  <Link href="/" onClick={() => setIsOpen(false)}>
                    <Button size="sm" className="h-9 w-full justify-start gap-2 rounded-md px-3 text-xs font-bold shadow-none">
                      <FileText className="h-3.5 w-3.5" />
                      New Invoice
                    </Button>
                  </Link>
                  {isAdmin && (
                    <Link href="/companies" onClick={() => setIsOpen(false)}>
                      <Button size="sm" variant="ghost" className="h-9 w-full justify-start gap-2 rounded-md px-3 text-xs font-bold text-ink-secondary hover:text-primary">
                        <Building2 className="h-3.5 w-3.5" />
                        Add Company
                      </Button>
                    </Link>
                  )}
                  <Link href="/terminal" onClick={() => setIsOpen(false)}>
                    <Button size="sm" variant="ghost" className="h-9 w-full justify-start gap-2 rounded-md px-3 text-xs font-bold text-ink-secondary hover:text-primary">
                      <CreditCard className="h-3.5 w-3.5" />
                      Payment Link
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-lg border border-hairline bg-canvas p-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-canvas-soft text-[11px] font-black text-ink-mute">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-ink">{displayName}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-mute">Signed in</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 rounded-md text-ink-mute hover:bg-ruby/10 hover:text-ruby"
                  onClick={handleLogout}
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Collapsed logout button */}
          {isCollapsed && (
            <div className="p-2 border-t border-hairline">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-center text-red-600 hover:text-red-700 hover:bg-red-50 px-2"
                onClick={handleLogout}
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div className="fixed inset-0 bg-ink/40 z-30 md:hidden" onClick={() => setIsOpen(false)} />
      )}
    </>
  )
}
