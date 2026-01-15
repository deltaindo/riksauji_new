import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Validate environment variables
function validateServerEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL environment variable. '
      + 'Please set it in .env.local'
    )
  }

  if (!anonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable. '
      + 'Please set it in .env.local'
    )
  }

  // Validate URL format
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    throw new Error(
      `NEXT_PUBLIC_SUPABASE_URL must be a valid HTTP or HTTPS URL. Got: ${url}`
    )
  }

  return { url, anonKey, serviceKey }
}

export const createServerSupabaseClient = async () => {
  try {
    const { url, anonKey } = validateServerEnv()
    const cookieStore = await cookies()

    return createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch (error) {
            console.warn('Warning: Failed to set cookie:', error)
          }
        },
      },
    })
  } catch (error: any) {
    console.error('Failed to create server Supabase client:', error.message)
    throw error
  }
}

export const createServerSupabaseServiceClient = async () => {
  try {
    const { url, serviceKey } = validateServerEnv()

    if (!serviceKey) {
      throw new Error(
        'Missing SUPABASE_SERVICE_ROLE_KEY environment variable. '
        + 'Service role operations require this key to be set in .env.local'
      )
    }

    const cookieStore = await cookies()

    return createServerClient(url, serviceKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch (error) {
            console.warn('Warning: Failed to set cookie:', error)
          }
        },
      },
    })
  } catch (error: any) {
    console.error('Failed to create service Supabase client:', error.message)
    throw error
  }
}
