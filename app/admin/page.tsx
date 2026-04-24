"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Shield,
  Users,
  Trash2,
  Eye,
  Search,
  CheckCircle2,
  XCircle,
  User,
  Database,
  Activity,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Spinner } from "@/components/ui/spinner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import type { User as SupabaseUser } from "@supabase/supabase-js"

interface Profile {
  id: string
  email: string
  full_name: string | null
  user_role: string
  created_at: string
  avatar_url: string | null
}

interface Stats {
  totalUsers: number
  totalSets: number
  activeUsers: number
  pendingDeletes: number
}

interface UserSet {
  id: string
  title: string
  content: string
  chunk_mode: string
  created_at: string
}

export default function AdminPage() {
  const router = useRouter()
  const supabase = createClient()
  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [users, setUsers] = useState<Profile[]>([])
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalSets: 0,
    activeUsers: 0,
    pendingDeletes: 0,
  })
  const [searchQuery, setSearchQuery] = useState("")

  // View-sets dialog state (replaces localStorage impersonation)
  const [viewSetsUser, setViewSetsUser] = useState<Profile | null>(null)
  const [viewSets, setViewSets] = useState<UserSet[]>([])
  const [viewSetsLoading, setViewSetsLoading] = useState(false)

  useEffect(() => {
    initPage()
  }, [])

  const initPage = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
        return
      }
      setCurrentUser(user)
      await loadAdminData()
    } catch (error) {
      console.error("Admin init failed:", error)
      toast.error("Failed to load admin panel")
      router.push("/")
    } finally {
      setIsLoading(false)
    }
  }

  const loadAdminData = async () => {
    await Promise.all([loadUsers(), loadStats()])
  }

  /** Fetch all users via server-validated API route */
  const loadUsers = async () => {
    const res = await fetch("/api/admin/users")
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: "Unknown error" }))
      toast.error("Failed to load users: " + error)
      return
    }
    const data: Profile[] = await res.json()
    setUsers(data)
  }

  /** Fetch stats via server-validated API route */
  const loadStats = async () => {
    const res = await fetch("/api/admin/stats")
    if (!res.ok) return
    const data: Stats = await res.json()
    setStats(data)
  }

  /** Update role via server-validated API route */
  const handleUpdateRole = async (userId: string, newRole: string) => {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_role: newRole }),
    })
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: "Unknown error" }))
      toast.error("Failed to update role: " + error)
      return
    }
    toast.success("User role updated")
    await loadUsers()
  }

  /** Delete user via server-validated API route (uses service role) */
  const handleDeleteUser = async (userId: string, userEmail: string) => {
    const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" })
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: "Unknown error" }))
      toast.error("Failed to delete user: " + error)
      return
    }
    toast.success(`User ${userEmail} deleted successfully`)
    await loadAdminData()
  }

  /** View a user's sets without impersonating them */
  const handleViewSets = async (user: Profile) => {
    setViewSetsUser(user)
    setViewSets([])
    setViewSetsLoading(true)
    const res = await fetch(`/api/admin/users/${user.id}/sets`)
    setViewSetsLoading(false)
    if (!res.ok) {
      toast.error("Failed to load user's sets")
      return
    }
    const data: UserSet[] = await res.json()
    setViewSets(data)
  }

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin": return "bg-red-500/10 text-red-600 border-red-500/20"
      case "vip": return "bg-purple-500/10 text-purple-600 border-purple-500/20"
      default: return "bg-gray-500/10 text-gray-600 border-gray-500/20"
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-svh flex-col bg-background">
        <Header title="Admin Panel" showBack />
        <main className="flex flex-1 flex-col items-center justify-center gap-3">
          <Spinner className="size-8" />
          <p className="text-sm text-muted-foreground">Verifying admin access…</p>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <Header title="Admin Panel" showBack />

      <main className="flex flex-1 flex-col gap-6 p-4 pb-8 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col gap-4 items-center text-center pt-4">
          <div className="flex size-16 items-center justify-center rounded-full bg-red-500/10">
            <Shield className="size-8 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">System administration and user management</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex size-12 items-center justify-center rounded-full bg-blue-500/10">
                  <Users className="size-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex size-12 items-center justify-center rounded-full bg-green-500/10">
                  <Database className="size-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Sets</p>
                  <p className="text-2xl font-bold">{stats.totalSets}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex size-12 items-center justify-center rounded-full bg-purple-500/10">
                  <Activity className="size-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Users</p>
                  <p className="text-2xl font-bold">{stats.activeUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex size-12 items-center justify-center rounded-full bg-red-500/10">
                  <Trash2 className="size-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Delete Requests</p>
                  <p className="text-2xl font-bold">{stats.pendingDeletes}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search users by email or name…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Users ({filteredUsers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredUsers.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No users found</p>
                ) : (
                  filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 shrink-0">
                          <User className="size-5 text-primary" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{user.email}</span>
                            {user.id === currentUser?.id && (
                              <Badge variant="outline" className="text-xs">You</Badge>
                            )}
                          </div>
                          {user.full_name && (
                            <span className="text-sm text-muted-foreground truncate">{user.full_name}</span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            Joined {new Date(user.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <select
                          value={user.user_role}
                          onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                          disabled={user.id === currentUser?.id}
                          className={`px-2 py-1 text-xs font-medium rounded-md border ${getRoleBadgeColor(user.user_role)} disabled:opacity-50`}
                        >
                          <option value="general">General</option>
                          <option value="vip">VIP</option>
                          <option value="admin">Admin</option>
                        </select>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewSets(user)}
                        >
                          <Eye className="size-3 mr-1" />
                          View Sets
                        </Button>

                        {user.id !== currentUser?.id && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive">
                                <Trash2 className="size-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete User?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete <strong>{user.email}</strong> and all their data. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteUser(user.id, user.email)}
                                  className="bg-destructive hover:bg-destructive/90"
                                >
                                  Delete User
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* View Sets Dialog — server-fetched, no impersonation */}
      <Dialog
        open={!!viewSetsUser}
        onOpenChange={(open) => {
          if (!open) { setViewSetsUser(null); setViewSets([]) }
        }}
      >
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sets for {viewSetsUser?.email}</DialogTitle>
          </DialogHeader>
          {viewSetsLoading ? (
            <div className="flex justify-center py-8">
              <Spinner className="size-6" />
            </div>
          ) : viewSets.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No memorization sets found</p>
          ) : (
            <div className="space-y-2">
              {viewSets.map((set) => (
                <div key={set.id} className="p-3 border rounded-lg">
                  <p className="font-medium text-sm">{set.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {set.chunk_mode} · {new Date(set.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
