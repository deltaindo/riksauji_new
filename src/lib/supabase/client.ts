import { createBrowserClient } from '@supabase/ssr'

// Validate environment variables
function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL environment variable. '
      + 'Please copy .env.local.example to .env.local and fill in your Supabase project URL.'
    )
  }

  if (!anonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable. '
      + 'Please copy .env.local.example to .env.local and fill in your Supabase anon key.'
    )
  }

  // Validate URL format
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    throw new Error(
      `NEXT_PUBLIC_SUPABASE_URL must be a valid HTTP or HTTPS URL. Got: ${url}`
    )
  }

  if (!url.includes('supabase.co')) {
    console.warn(
      '⚠️  NEXT_PUBLIC_SUPABASE_URL does not appear to be a valid Supabase URL. '
      + 'Expected format: https://your-project-ref.supabase.co'
    )
  }

  return { url, anonKey }
}

export const createClient = () => {
  try {
    const { url, anonKey } = getSupabaseConfig()

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Supabase client initialized')
      console.log(`   URL: ${url}`)
    }

    return createBrowserClient(url, anonKey)
  } catch (error: any) {
    console.error('❌ Failed to initialize Supabase client:', error.message)
    throw error
  }
}
