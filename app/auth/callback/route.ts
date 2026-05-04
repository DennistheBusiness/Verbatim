import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const nonce = requestUrl.searchParams.get('n')   // set by native login flow
  const origin = requestUrl.origin

  if (code && nonce) {
    // Native flow: store the raw code for WKWebView to exchange with its own PKCE verifier.
    // The nonce was pre-registered by /api/auth/native-begin before the browser opened.
    const serviceClient = createServiceClient()
    const { data: transfer, error: lookupError } = await serviceClient
      .from('native_auth_transfers')
      .select('nonce')
      .eq('nonce', nonce)
      .gt('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString())
      .single()

    if (lookupError) {
      console.error('[callback] nonce lookup error:', lookupError.code, lookupError.message)
    }

    if (transfer) {
      const { error: updateError } = await serviceClient
        .from('native_auth_transfers')
        .update({ code })
        .eq('nonce', nonce)

      if (updateError) {
        console.error('[callback] code store error:', updateError.code, updateError.message)
      } else {
        // Code stored. WKWebView is polling /api/auth/native-poll and will call
        // Browser.close() then navigate to /auth/native-complete when it detects
        // the code is ready. Redirect the browser to a neutral waiting page.
        return NextResponse.redirect(`${origin}/auth/native-complete`)
      }
    }
  }

  // Web flow: exchange the code server-side as normal
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

  return NextResponse.redirect(`${origin}/?fresh=1`)
}
