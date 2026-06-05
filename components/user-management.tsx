"use client"

import { useEffect, useState } from "react"
import { Shield, ShieldCheck, User, Users, Search, Loader2, Mail, Calendar, UserCog } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import type { Profile } from "@/lib/supabase-types"
import { useAuth } from "@/hooks/use-auth"

export function UserManagement() {
  const { toast } = useToast()
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const getAuthHeaders = async () => {
    const supabase = getSupabaseBrowserClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.access_token) {
      throw new Error("Please sign in again to manage users.")
    }

    return {
      Authorization: `Bearer ${session.access_token}`,
    }
  }

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/users", {
        headers: await getAuthHeaders(),
      })

      if (!response.ok) throw new Error("Failed to fetch users")
      setUsers((await response.json()) as Profile[])
    } catch (error) {
      console.error("Error fetching users:", error)
      toast({
        title: "Error",
        description: "Failed to load users list.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const toggleAdmin = async (targetUser: Profile) => {
    if (targetUser.id === currentUser?.id) {
      toast({
        title: "Action Restricted",
        description: "You cannot change your own admin status.",
        variant: "destructive",
      })
      return
    }

    setUpdatingId(targetUser.id)
    const newRole = targetUser.role === "admin" ? "user" : "admin"

    try {
      const response = await fetch("/api/users", {
        method: "PUT",
        headers: {
          ...(await getAuthHeaders()),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: targetUser.id, role: newRole }),
      })

      if (!response.ok) throw new Error("Failed to update user role")

      toast({
        title: "Role Updated",
        description: `${targetUser.email} is now an ${newRole}.`,
      })
      
      setUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, role: newRole } : u))
    } catch (error) {
      console.error("Error updating role:", error)
      toast({
        title: "Error",
        description: "Failed to update user role.",
        variant: "destructive",
      })
    } finally {
      setUpdatingId(null)
    }
  }

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(search.toLowerCase()) || 
    (u.full_name?.toLowerCase() || "").includes(search.toLowerCase())
  )

  return (
    <div className="max-w-7xl mx-auto space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="flex flex-col gap-4 border-b border-hairline pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-display-md font-bold tracking-tight text-ink flex items-center gap-3">
            <UserCog className="h-8 w-8 text-primary" />
            User Management
          </h1>
          <p className="text-body-md font-medium text-ink-mute">Grant or revoke admin permissions and manage user roles.</p>
        </div>
      </div>

      <Card className="rounded-lg border-hairline bg-canvas shadow-sm">
        <CardHeader className="border-b border-hairline p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-mute" />
              <Input
                placeholder="Search by email or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-10 border-hairline focus:ring-primary"
              />
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-canvas-soft rounded-md border border-hairline">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold text-ink">{users.length} Users Total</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-canvas-soft/50">
              <TableRow className="border-hairline hover:bg-transparent">
                <TableHead className="text-micro-cap font-black uppercase tracking-widest h-12">User</TableHead>
                <TableHead className="text-micro-cap font-black uppercase tracking-widest h-12">Role</TableHead>
                <TableHead className="text-micro-cap font-black uppercase tracking-widest h-12">Joined</TableHead>
                <TableHead className="text-right text-micro-cap font-black uppercase tracking-widest h-12 px-8">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Loader2 className="h-8 w-8 text-primary animate-spin" />
                      <p className="text-sm font-medium text-ink-mute">Syncing enterprise directory...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-64 text-center">
                    <p className="text-sm font-bold text-ink">No users found matching your search.</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((u) => (
                  <TableRow key={u.id} className="border-hairline hover:bg-canvas-soft/40 transition-colors group">
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-ink truncate">{u.full_name || "New User"}</p>
                          <div className="flex items-center gap-1.5">
                            <Mail className="h-3 w-3 text-ink-mute" />
                            <p className="text-xs font-medium text-ink-mute truncate">{u.email}</p>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge 
                        variant={u.role === "admin" ? "default" : "secondary"}
                        className={u.role === "admin" ? "bg-primary/10 text-primary hover:bg-primary/20 border-primary/30" : "bg-canvas-soft text-ink-mute border-hairline"}
                      >
                        {u.role === "admin" ? (
                          <ShieldCheck className="mr-1 h-3 w-3" />
                        ) : (
                          <User className="mr-1 h-3 w-3" />
                        )}
                        {u.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-ink-mute">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(u.updated_at).toLocaleDateString("en-GB")}
                      </div>
                    </TableCell>
                    <TableCell className="py-4 text-right px-8">
                      <Button
                        size="sm"
                        variant={u.role === "admin" ? "outline" : "default"}
                        disabled={updatingId === u.id || u.id === currentUser?.id}
                        onClick={() => toggleAdmin(u)}
                        className="h-8 rounded-md font-bold transition-all"
                      >
                        {updatingId === u.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                        ) : u.role === "admin" ? (
                          <Shield className="h-3.5 w-3.5 mr-2" />
                        ) : (
                          <ShieldCheck className="h-3.5 w-3.5 mr-2" />
                        )}
                        {u.role === "admin" ? "Revoke Admin" : "Make Admin"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
