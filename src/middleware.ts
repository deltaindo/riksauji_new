import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Validate environment variables are set
function validateEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    console.error('❌ Missing Supabase environment variables:')
    if (!url) console.error('  - NEXT_PUBLIC_SUPABASE_URL is not set')
    if (!anonKey) console.error('  - NEXT_PUBLIC_SUPABASE_ANON_KEY is not set')
    console.error('\n📋 Solution:')
    console.error('  1. Copy .env.local.example to .env.local')
    console.error('  2. Fill in values from Supabase dashboard')
    console.error('  3. Restart the dev server (npm run dev)')
    return false
  }

  // Validate URL format
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL must be a valid HTTP or HTTPS URL')
    console.error(`   Got: ${url}`)
    return false
  }

  return true
}

export async function middleware(request: NextRequest) {
  // Check if env vars are set - if not, allow public routes to bypass
  if (!validateEnv()) {
    // For public routes (login, etc), continue without auth
    if (
      request.nextUrl.pathname === '/login' ||
      request.nextUrl.pathname === '/' ||
      request.nextUrl.pathname.startsWith('/public')
    ) {
      return NextResponse.next()
    }
    // For protected routes, redirect to login with error
    return NextResponse.redirect(
      new URL('/login?error=config', request.url)
    )
  }

  const requestUrl = new URL(request.url)
  let supabaseResponse = NextResponse.next({
    request,
  })

  try {
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
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      },
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Protected routes - require authentication
    if (!user && requestUrl.pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Authenticated users trying to access login - redirect to dashboard
    if (user && requestUrl.pathname === '/login') {
      return NextResponse.redirect(new URL('/dashboard/spk', request.url))
    }

    return supabaseResponse
  } catch (error: any) {
    console.error('🔐 Middleware error:', error.message)
    // On error, redirect to login for dashboard routes
    if (requestUrl.pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/login?error=auth', request.url))
    }
    return supabaseResponse
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/'],
}
