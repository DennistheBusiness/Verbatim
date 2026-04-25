import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Hostname-based routing: squaredthought.com → landing page (no auth)
  const host = request.headers.get('host') || ''
  const isMarketingHost =
    host === 'squaredthought.com' ||
    host === 'www.squaredthought.com'

  if (isMarketingHost) {
    const { pathname } = request.nextUrl
    if (pathname === '/' || pathname === '') {
      return NextResponse.rewrite(new URL('/landing', request.url))
    }
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Auth routes - redirect to home if already authenticated
  const authPaths = ['/auth/login', '/auth/signup', '/auth/callback']
  const isAuthPath = authPaths.includes(pathname)

  if (isAuthPath && user) {
    // Redirect to home if already logged in
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/'
    return NextResponse.redirect(redirectUrl)
  }

  // Allow auth routes for non-authenticated users
  if (isAuthPath) {
    return supabaseResponse
  }

  // Admin routes - server-side role check (no client trust)
  if (pathname.startsWith('/admin')) {
    if (!user) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/auth/login'
      redirectUrl.searchParams.set('redirectedFrom', pathname)
      return NextResponse.redirect(redirectUrl)
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('user_role')
      .eq('id', user.id)
      .single()

    if (profile?.user_role !== 'admin') {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/'
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Protected routes - redirect to login if not authenticated
  const protectedPaths = ['/create', '/edit', '/memorization', '/migrate', '/review', '/schedules']
  const isProtectedPath = pathname === '/' || protectedPaths.some((path) =>
    pathname.startsWith(path)
  )

  if (isProtectedPath && !user) {
    // Redirect to login
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/auth/login'
    redirectUrl.searchParams.set('redirectedFrom', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (they handle their own auth)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
