import { createClient } from '@/utils/supabase/client'

export interface AuthError {
  message: string
  code?: string
}

export interface SignUpData {
  email: string
  password: string
}

export interface VerifyData {
  email: string
  token: string
}

// Helper function to validate Supabase configuration
function validateSupabaseConfig() {
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
export async function signUpWithEmail({ email, password }: SignUpData) {
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
      if (error.message.includes('User already registered')) {
        return { 
          success: true, 
          needsEmailVerification: true,
          message: 'Please check your email for a verification link.'
        }
      }
      return { success: false, error: { message: error.message, code: error.message } }
    }

    const needsVerification = !data.user?.email_confirmed_at

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
export async function verifyEmail({ email, token }: VerifyData) {
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

    return { success: true, data: data.user }
  } catch (error) {
    return { 
      success: false, 
      error: { message: 'An unexpected error occurred. Please try again.' } 
    }
  }
}

// Resend verification email
export async function resendVerificationEmail(email: string) {
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

// Sign in with Google OAuth
export async function signInWithGoogle() {
  try {
    const configCheck = validateSupabaseConfig()
    if (!configCheck.success) {
      return configCheck
    }
    
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
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

// Sign in with email and password
export async function signInWithEmailPassword({ email, password }: SignUpData) {
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
      return { success: false, error: { message: error.message, code: error.code } }
    }

    return { success: true, data }
  } catch (error) {
    return {
      success: false,
      error: { message: 'An unexpected error occurred. Please try again.' },
    }
  }
}

// Check if email already exists in the system
export async function checkEmailExists(email: string) {
  try {
    const configCheck = validateSupabaseConfig()
    if (!configCheck.success) {
      return { exists: false, success: false }
    }
    
    const supabase = createClient()
    // Use sign-in attempt with known invalid password to check user existence
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: 'invalid-password-for-existence-check-12345'
    })
    
    // If error contains "Invalid login credentials", user exists but password is wrong
    // If error contains "User not found" or similar, user doesn't exist
    const exists = error?.message?.includes('Invalid login credentials') || 
                   error?.message?.includes('Email not confirmed') ||
                   false
    
    return {
      exists,
      success: true
    }
  } catch (error) {
    // On any error, assume email doesn't exist (graceful degradation)
    return { exists: false, success: false }
  }
}

// Validation helpers
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' }
  }
  return { valid: true }
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