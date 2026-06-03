"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { FileText, CreditCard, BarChart3, Settings, Building2, Plus, Menu, X, LogOut, User, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"

const navigation = [
  { name: "Invoice Generator", icon: FileText, href: "/", current: false },
  { name: "Payment Terminal", icon: CreditCard, href: "/terminal", current: false },
  { name: "Dashboard", icon: BarChart3, href: "/dashboard", current: false },
  { name: "Companies", icon: Building2, href: "/companies", current: false },
  { name: "Settings", icon: Settings, href: "/settings", current: false },
]

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()
  const { toast } = useToast()
  const { user, profile, logout } = useAuth()

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

  const updatedNavigation = navigation.map((item) => ({
    ...item,
    current: pathname === item.href,
  }))

  const displayName = profile?.full_name || user?.email || "User"

  const handleLogout = async () => {
    try {
      await logout()
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
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 bg-sidebar border-r border-sidebar-border transform transition-all duration-300 ease-in-out md:relative md:translate-x-0",
          isCollapsed ? "w-16" : "w-64",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className={cn(
            "border-b border-sidebar-border",
            isCollapsed ? "p-2" : "p-6"
          )}>
            <div className={cn(
              "flex items-center",
              isCollapsed ? "justify-center" : "justify-between"
            )}>
              {!isCollapsed && (
                <div>
                  <h2 className="text-xl font-bold text-sidebar-foreground">PayTerminal</h2>
                  <p className="text-sm text-muted-foreground mt-1">Multi-Company Payments</p>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                className={cn("hidden md:flex h-8 w-8 p-0", isCollapsed && "mx-auto")}
                onClick={() => setIsCollapsed(!isCollapsed)}
                title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>
            </div>

            {/* User Info */}
            {user && !isCollapsed && (
              <div className="mt-4 flex items-center gap-2 p-2 bg-sidebar-accent rounded-md">
                <User className="h-3 w-3 text-sidebar-accent-foreground" />
                <span className="text-xs text-sidebar-accent-foreground truncate">
                  {displayName}
                </span>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className={cn(
            "flex-1 space-y-2",
            isCollapsed ? "p-2" : "p-4"
          )}>
            {updatedNavigation.map((item) => (
              <Link key={item.name} href={item.href} onClick={() => setIsOpen(false)}>
                <Button
                  variant={item.current ? "default" : "ghost"}
                  className={cn(
                    "w-full gap-3",
                    isCollapsed ? "justify-center px-2" : "justify-start",
                    item.current
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  )}
                  title={item.name}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!isCollapsed && <span className="truncate">{item.name}</span>}
                </Button>
              </Link>
            ))}
          </nav>

          {/* Quick Actions */}
          {!isCollapsed && (
            <div className="p-4 border-t border-sidebar-border space-y-4">
              <Card className="p-4 bg-sidebar-accent">
                <div className="flex items-center gap-3 mb-3">
                  <Plus className="h-4 w-4 text-sidebar-accent-foreground" />
                  <span className="text-sm font-medium text-sidebar-accent-foreground">Quick Actions</span>
                </div>
                <div className="space-y-4">
                  <Link href="/" onClick={() => setIsOpen(false)}>
                    <Button size="sm" className="w-full text-xs">
                      New Invoice
                    </Button>
                  </Link>
                  <Link href="/terminal" onClick={() => setIsOpen(false)}>
                    <Button size="sm" variant="outline" className="w-full text-xs bg-transparent">
                      Payment Link
                    </Button>
                  </Link>
                </div>
              </Card>

              {/* Logout Button */}
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          )}

          {/* Collapsed logout button */}
          {isCollapsed && (
            <div className="p-2 border-t border-sidebar-border">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden" onClick={() => setIsOpen(false)} />
      )}
    </>
  )
}
