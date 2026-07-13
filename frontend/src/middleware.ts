import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Simple in-memory rate limiter (per-IP, sliding window)
const rateMap = new Map<string, number[]>()
const RATE_WINDOW_MS = 60_000   // 1 minute
const RATE_MAX = 20              // max requests per window
const AUTH_RATE_MAX = 5          // max auth attempts per window

function isRateLimited(ip: string, isAuth: boolean): boolean {
  const now = Date.now()
  const timestamps = rateMap.get(ip) ?? []
  const windowed = timestamps.filter(t => now - t < RATE_WINDOW_MS)
  rateMap.set(ip, windowed)
  const max = isAuth ? AUTH_RATE_MAX : RATE_MAX
  return windowed.length >= max
}

function trackRequest(ip: string) {
  const timestamps = rateMap.get(ip) ?? []
  timestamps.push(Date.now())
  rateMap.set(ip, timestamps)
}

// Purge old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [ip, ts] of rateMap) {
    const windowed = ts.filter(t => now - t < RATE_WINDOW_MS)
    if (windowed.length === 0) rateMap.delete(ip)
    else rateMap.set(ip, windowed)
  }
}, 300_000)

export async function middleware(request: NextRequest) {
  // Rate limit check
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const isAuthRoute = request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/api/account')
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

  const protectedPaths = ['/recipients', '/wishlists', '/tracker', '/secret-santa', '/admin', '/settings']
  const isProtected = protectedPaths.some(p => request.nextUrl.pathname.startsWith(p))

  if (!user && isProtected) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && request.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|s/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
