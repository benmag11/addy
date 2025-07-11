import { createClient } from '@/utils/supabase/client'
import type { AuthResult } from '@/types'

// Sign in with Google OAuth
export async function signInWithGoogle(): Promise<AuthResult<{ provider: string; url: string } | null>> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co') {
      return { 
        success: false, 
        error: { message: 'Authentication service not configured. Please set up Supabase environment variables.' } 
      }
    }
    
    const supabase = createClient()
    
    // Use dynamic redirect URL for development, fallback to env variable for production
    const redirectUrl = typeof window !== 'undefined' 
      ? `${window.location.origin}/auth/callback`
      : `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl
      }
    })

    if (error) {
      return { success: false, error: { message: error.message } }
    }

    return { success: true, data }
  } catch (error) {
    return { 
      success: false, 
      error: { message: 'Failed to sign in with Google. Please try again.' } 
    }
  }
}