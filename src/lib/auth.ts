import { createClient } from '@/utils/supabase/client'
import type { 
  AuthError, 
  SignUpData, 
  VerifyData, 
  AuthResult
} from '@/types'

// Re-export OAuth functions
export { signInWithGoogle } from './auth/oauth'

// Re-export onboarding functions
export { saveOnboardingStep, completeOnboarding } from './user-profile'

// Helper function to validate Supabase configuration
function validateSupabaseConfig(): { success: boolean; error?: AuthError } {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co') {
    return { 
      success: false, 
      error: { message: 'Authentication service not configured. Please set up Supabase environment variables.' } 
    }
  }
  return { success: true }
}

// Sign up with email and password
export async function signUpWithEmail({ email, password }: SignUpData): Promise<AuthResult> {
  try {
    const configCheck = validateSupabaseConfig()
    if (!configCheck.success) {
      return configCheck
    }
    
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (error) {
      return { success: false, error: { message: error.message, code: error.message } }
    }

    // Check if user already exists using identities array method
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      return { 
        success: false, 
        error: { 
          message: 'An account with this email already exists. Please sign in instead.', 
          code: 'user_already_exists' 
        }
      }
    }

    if (!data.user) {
      return {
        success: false,
        error: { message: 'Failed to create user account. Please try again.' }
      }
    }

    const needsVerification = !data.user.email_confirmed_at

    return { 
      success: true, 
      data: data.user,
      needsEmailVerification: needsVerification
    }
  } catch (error) {
    return { 
      success: false, 
      error: { message: 'An unexpected error occurred. Please try again.' } 
    }
  }
}

// Verify email with OTP code
export async function verifyEmail({ email, token }: VerifyData): Promise<AuthResult> {
  try {
    const configCheck = validateSupabaseConfig()
    if (!configCheck.success) {
      return configCheck
    }

    const supabase = createClient()
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'signup'
    })

    if (error) {
      return { success: false, error: { message: error.message, code: error.message } }
    }

    if (!data.user) {
      return {
        success: false,
        error: { message: 'Failed to verify email. Please try again.' }
      }
    }

    return { success: true, data: data.user }
  } catch (error) {
    return { 
      success: false, 
      error: { message: 'An unexpected error occurred. Please try again.' } 
    }
  }
}

// Resend verification email
export async function resendVerificationEmail(email: string): Promise<AuthResult> {
  try {
    const configCheck = validateSupabaseConfig()
    if (!configCheck.success) {
      return configCheck
    }
    
    const supabase = createClient()
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email
    })

    if (error) {
      return { success: false, error: { message: error.message } }
    }

    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: { message: 'Failed to resend verification email. Please try again.' } 
    }
  }
}


// Sign in with email and password
export async function signInWithEmailPassword({ email, password }: SignUpData): Promise<AuthResult> {
  try {
    const configCheck = validateSupabaseConfig()
    if (!configCheck.success) {
      return configCheck
    }

    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      const errorObj: AuthError = { message: error.message }
      if (error.code) {
        errorObj.code = error.code
      }
      return { success: false, error: errorObj }
    }

    if (!data.user) {
      return {
        success: false,
        error: { message: 'Failed to sign in. Please try again.' }
      }
    }

    return { success: true, data: data.user }
  } catch (error) {
    return {
      success: false,
      error: { message: 'An unexpected error occurred. Please try again.' },
    }
  }
}



// Format error messages for display
export function formatAuthError(error: AuthError): string {
  // Common Supabase auth error messages
  switch (error.code) {
    case 'email_address_invalid':
      return 'Please enter a valid email address'
    case 'password_too_short':
      return 'Password must be at least 6 characters'
    case 'signup_disabled':
      return 'Sign up is currently disabled'
    case 'email_address_not_authorized':
      return 'This email address is not authorized to sign up'
    case 'user_already_exists':
      return 'An account with this email already exists. Try signing in instead.'
    case 'invalid_credentials':
      return 'Invalid email or password'
    case 'too_many_requests':
      return 'Too many requests. Please try again later.'
    case 'oauth_error':
      return 'Authentication failed. Please try again.'
    case 'access_denied':
      return 'Access was denied. Please try again.'
    default:
      return error.message || 'An error occurred during authentication'
  }
}