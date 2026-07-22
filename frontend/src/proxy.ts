import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Simple in-memory rate limiter (per-IP, sliding window)
const rateMap = new Map<string, number[]>()
const RATE_WINDOW_MS = 60_000   // 1 minute
const RATE_MAX = 120             // raised from 20 to allow normal asset/page loads
const AUTH_RATE_MAX = 10         // raised from 5 for less intrusive auth rate limiting

function isRateLimited(ip: string, isAuth: boolean): boolean {
  const now = Date.now()
  const timestamps = rateMap.get(ip) ?? []
  
  // Filter out timestamps outside the active window
  const windowed = timestamps.filter(t => now - t < RATE_WINDOW_MS)
  
  // Lazy cleanup of the map to prevent memory leaks in long-running processes
  if (rateMap.size > 5000) {
    for (const [key, ts] of rateMap.entries()) {
      const active = ts.filter(t => now - t < RATE_WINDOW_MS)
      if (active.length === 0) {
        rateMap.delete(key)
      } else {
        rateMap.set(key, active)
      }
    }
  }

  rateMap.set(ip, windowed)
  const max = isAuth ? AUTH_RATE_MAX : RATE_MAX
  return windowed.length >= max
}

function trackRequest(ip: string) {
  const timestamps = rateMap.get(ip) ?? []
  timestamps.push(Date.now())
  rateMap.set(ip, timestamps)
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip static assets, favicon, public wishlists, etc.
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/s/') ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|webp)$/)
  ) {
    return NextResponse.next()
  }

  // Validate host header to prevent DNS rebinding in production
  const host = request.headers.get('host') || ''
  const allowedHosts = ['localhost', '127.0.0.1', '104.168.64.186', 'giftwise.shillopelloi.com', 'app.shillopelloi.com', 'shillopelloi.com']
  if (process.env.NEXT_PUBLIC_APP_URL) {
    try {
      const publicUrl = new URL(process.env.NEXT_PUBLIC_APP_URL)
      allowedHosts.push(publicUrl.hostname)
    } catch {}
  }
  
  if (process.env.NODE_ENV === 'production' && !allowedHosts.some(h => host.includes(h))) {
    return new NextResponse('Invalid host', { status: 400 })
  }

  // Rate limit check
  const ip = request.headers.get('cf-connecting-ip')?.trim() ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/api/account')
  
  if (isRateLimited(ip, isAuthRoute)) {
    return new NextResponse('Too many requests. Please try again later.', { status: 429 })
  }
  trackRequest(ip)

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const protectedPaths = ['/', '/recipients', '/wishlists', '/tracker', '/secret-santa', '/admin', '/settings', '/profile', '/analytics', '/calendar', '/history', '/savings', '/api/account']
  const isProtected = protectedPaths.some(p => 
    p === '/' ? pathname === '/' : pathname.startsWith(p)
  )

  if (!user && isProtected) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return supabaseResponse
}
