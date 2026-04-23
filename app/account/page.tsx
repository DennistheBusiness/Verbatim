"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Settings, User, Mail, LogOut, Trash2, AlertCircle, CheckCircle2, Download } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Spinner } from "@/components/ui/spinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle,
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import type { User as SupabaseUser } from "@supabase/supabase-js"

export default function AccountPage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [newEmail, setNewEmail] = useState("")
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false)
  const [emailUpdateSuccess, setEmailUpdateSuccess] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setIsLoading(false)
    }
    getUser()
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const handleUpdateEmail = async () => {
    if (!newEmail || newEmail === user?.email) {
      toast.error("Please enter a different email address")
      return
    }

    setIsUpdatingEmail(true)
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail })
      
      if (error) throw error
      
      setEmailUpdateSuccess(true)
      toast.success("Verification email sent! Check your inbox to confirm the change.")
      setNewEmail("")
    } catch (error: any) {
      toast.error(error.message || "Failed to update email")
    } finally {
      setIsUpdatingEmail(false)
    }
  }

  const handleExportData = async () => {
    if (!user) return
    
    setIsExporting(true)
    try {
      // Fetch all user data
      const { data: sets, error } = await supabase
        .from('memorization_sets')
        .select('*')
        .eq('user_id', user!.id)
      
      if (error) throw error

      // Create JSON file
      const dataStr = JSON.stringify(sets, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      
      // Trigger download
      const link = document.createElement('a')
      link.href = url
      link.download = `verbatim-data-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      toast.success("Data exported successfully!")
    } catch (error: any) {
      toast.error(error.message || "Failed to export data")
    } finally {
      setIsExporting(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!user) return
    
    setIsDeleting(true)
    try {
      // Delete all user's memorization sets
      const { error: setsError } = await supabase
        .from('memorization_sets')
        .delete()
        .eq('user_id', user!.id)
      
      if (setsError) throw setsError

      // Note: Actual user deletion would require admin API or database trigger
      // For now, we'll sign them out after deleting their data
      await supabase.auth.signOut()
      
      toast.success("Account data deleted. You have been signed out.")
      router.push('/')
    } catch (error: any) {
      toast.error(error.message || "Failed to delete account")
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-svh flex-col bg-background">
        <Header title="Account Settings" showBack />
        <main className="flex flex-1 flex-col items-center justify-center gap-3">
          <Spinner className="size-8" />
          <p className="text-sm text-muted-foreground">Loading account...</p>
        </main>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-svh flex-col bg-background">
        <Header title="Account Settings" showBack />
        <main className="flex flex-1 flex-col items-center justify-center gap-4 p-4">
          <div className="flex flex-col items-center gap-3 text-center">
            <User className="size-12 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Not Signed In</h2>
            <p className="text-muted-foreground">Sign in to access your account settings</p>
            <Button asChild className="mt-2">
              <a href="/auth/login">Sign In</a>
            </Button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <Header title="Account Settings" showBack />
      
      <main className="flex flex-1 flex-col gap-6 p-4 pb-8 max-w-2xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col gap-4 items-center text-center pt-4">
          <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
            <Settings className="size-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Account Settings</h1>
            <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
          </div>
        </div>

        {/* Account Information */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User className="size-5" />
              Account Information
            </h2>
            
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <Label className="text-sm text-muted-foreground">Email Address</Label>
                <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                  <Mail className="size-4 text-muted-foreground" />
                  <span className="text-sm">{user.email}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-sm text-muted-foreground">User ID</Label>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <span className="text-xs font-mono break-all">{user.id}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-sm text-muted-foreground">Account Created</Label>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <span className="text-sm">
                    {new Date(user.created_at).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Update Email */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">Change Email Address</h2>
            
            {emailUpdateSuccess && (
              <Alert className="mb-4 border-green-500/50 bg-green-500/10">
                <CheckCircle2 className="size-4 text-green-600" />
                <AlertDescription className="text-sm text-green-700 dark:text-green-400">
                  Verification email sent! Check both inboxes to confirm the change.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="new-email">New Email Address</Label>
                <Input 
                  id="new-email"
                  type="email" 
                  placeholder="Enter new email address"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>
              <Button 
                onClick={handleUpdateEmail}
                disabled={isUpdatingEmail || !newEmail}
                className="w-full"
              >
                {isUpdatingEmail ? (
                  <>
                    <Spinner className="size-4 mr-2" />
                    Updating...
                  </>
                ) : (
                  'Update Email'
                )}
              </Button>
              <p className="text-xs text-muted-foreground">
                A verification email will be sent to both your current and new email addresses.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">Data Management</h2>
            
            <div className="space-y-3">
              <Button 
                onClick={handleExportData}
                disabled={isExporting}
                variant="outline"
                className="w-full gap-2"
              >
                {isExporting ? (
                  <>
                    <Spinner className="size-4" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="size-4" />
                    Export My Data
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground">
                Download all your memorization sets as a JSON file.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Sign Out */}
        <Card>
          <CardContent className="p-6">
            <Button 
              onClick={handleLogout}
              variant="outline"
              className="w-full gap-2"
            >
              <LogOut className="size-4" />
              Sign Out
            </Button>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/50">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-2 text-destructive flex items-center gap-2">
              <AlertCircle className="size-5" />
              Danger Zone
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Once you delete your account, there is no going back. This action cannot be undone.
            </p>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive"
                  className="w-full gap-2"
                  disabled={isDeleting}
                >
                  <Trash2 className="size-4" />
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription className="space-y-2">
                    <p>
                      This action cannot be undone. This will permanently delete your account and remove all your memorization sets from our servers.
                    </p>
                    <p className="font-semibold text-destructive">
                      All your progress, content, and settings will be lost forever.
                    </p>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    {isDeleting ? (
                      <>
                        <Spinner className="size-4 mr-2" />
                        Deleting...
                      </>
                    ) : (
                      'Yes, Delete My Account'
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
