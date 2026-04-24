"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Menu, HelpCircle, Info, FileText, Shield as ShieldIcon, Settings, LogOut, BookOpen, ShieldAlert } from "lucide-react"
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

interface NavigationMenuProps {
  user: SupabaseUser | null
}

export function NavigationMenu({ user }: NavigationMenuProps) {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        setIsAdmin(false)
        return
      }

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_role')
          .eq('id', user.id)
          .single()

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
