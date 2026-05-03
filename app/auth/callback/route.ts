import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Pass through any pending share token from before the OAuth redirect
  const pendingShare = request.cookies.get('pendingShare')?.value
  if (pendingShare) {
    const response = NextResponse.redirect(`${origin}/onboarding?importShare=${pendingShare}`)
    response.cookies.set('pendingShare', '', { path: '/', maxAge: 0 })
    return response
  }

  // Redirect to home page — fresh=1 tells the client to show the splash
  return NextResponse.redirect(`${origin}/?fresh=1`)
}
