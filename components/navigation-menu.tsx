"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Menu, User, HelpCircle, Info, FileText, Shield as ShieldIcon, Settings, LogOut, BookOpen, ShieldAlert, UserX } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import { getImpersonationState, endImpersonation } from "@/lib/impersonation"
import { toast } from "sonner"

interface NavigationMenuProps {
  user: SupabaseUser | null
}

export function NavigationMenu({ user }: NavigationMenuProps) {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [impersonationState, setImpersonationState] = useState(getImpersonationState())

  // Check for impersonation state changes
  useEffect(() => {
    const checkImpersonation = () => {
      setImpersonationState(getImpersonationState())
    }
    
    // Check on mount and whenever menu opens
    checkImpersonation()
    
    // Listen for storage changes (in case impersonation ends in another tab)
    window.addEventListener('storage', checkImpersonation)
    return () => window.removeEventListener('storage', checkImpersonation)
  }, [])

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        setIsAdmin(false)
        return
      }

      try {
        console.log('🔍 Checking admin role for user:', user.id, user.email)
        
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('user_role')
          .eq('id', user.id)
          .single()

        console.log('✅ Profile query result:', { profile, error })

        if (error) {
          console.error('❌ RLS Error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          })
        }

        setIsAdmin(profile?.user_role === 'admin')
      } catch (error) {
        console.error('Failed to check admin role:', error)
        setIsAdmin(false)
      }
    }

    checkAdminRole()
  }, [user, supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setOpen(false)
    router.push('/auth/login')
  }

  const handleStopImpersonating = () => {
    endImpersonation()
    setImpersonationState(getImpersonationState())
    toast.success("Stopped impersonating user")
    setOpen(false)
    router.push('/admin')
  }

  const handleNavigate = (path: string) => {
    setOpen(false)
    router.push(path)
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm">
          <Menu className="size-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {user && (
          <>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">Account</p>
                <p className="text-xs leading-none text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Impersonation Warning */}
        {impersonationState.isImpersonating && (
          <>
            <div className="px-2 py-3 bg-amber-500/10 border border-amber-500/20 rounded-md mx-2 mb-2">
              <div className="flex items-start gap-2">
                <ShieldAlert className="size-4 text-amber-600 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-amber-900 dark:text-amber-100">
                    Viewing as User
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300 truncate mt-0.5">
                    {impersonationState.targetUserEmail}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2 h-7 text-xs border-amber-500/30 hover:bg-amber-500/20"
                onClick={handleStopImpersonating}
              >
                <UserX className="mr-1.5 size-3" />
                Stop Impersonating
              </Button>
            </div>
          </>
        )}

        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => handleNavigate('/onboarding')}>
            <BookOpen className="mr-2 size-4" />
            <span>View Tour</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleNavigate('/help')}>
            <HelpCircle className="mr-2 size-4" />
            <span>Help & FAQ</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleNavigate('/about')}>
            <Info className="mr-2 size-4" />
            <span>About Verbatim</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {user && (
          <>
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => handleNavigate('/account')}>
                <Settings className="mr-2 size-4" />
                <span>Account Settings</span>
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem 
                  onClick={() => handleNavigate('/admin')}
                  className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                >
                  <ShieldAlert className="mr-2 size-4" />
                  <span className="font-semibold">Admin Panel</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => handleNavigate('/privacy')}>
            <ShieldIcon className="mr-2 size-4" />
            <span>Privacy Policy</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleNavigate('/terms')}>
            <FileText className="mr-2 size-4" />
            <span>Terms of Service</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        {user && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 size-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
