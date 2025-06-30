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

// Sign up with email and password
export async function signUpWithEmail({ email, password }: SignUpData) {
  try {
    // Check if Supabase is properly configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co') {
      return { 
        success: false, 
        error: { message: 'Authentication service not configured. Please set up Supabase environment variables.' } 
      }
    }

    console.log('🔧 Calling Supabase signUp with:', { email, password: '***' })
    
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })

    console.log('📊 Supabase signUp response:', {
      user: data.user,
      session: data.session,
      error: error,
      userEmailConfirmed: data.user?.email_confirmed_at
    })

    if (error) {
      console.error('🚨 Supabase signUp error:', error)
      return { success: false, error: { message: error.message, code: error.message } }
    }

    const needsVerification = !data.user?.email_confirmed_at
    console.log('🔍 Email verification status:', {
      emailConfirmedAt: data.user?.email_confirmed_at,
      needsVerification: needsVerification
    })

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
    // Check if Supabase is properly configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co') {
      return { 
        success: false, 
        error: { message: 'Authentication service not configured. Please set up Supabase environment variables.' } 
      }
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
    // Check if Supabase is properly configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co') {
      return { 
        success: false, 
        error: { message: 'Authentication service not configured. Please set up Supabase environment variables.' } 
      }
    }

    console.log('🔧 Calling Supabase resend for email:', email)
    
    const supabase = createClient()
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email
    })

    console.log('📧 Supabase resend response:', { error })

    if (error) {
      console.error('🚨 Supabase resend error:', error)
      return { success: false, error: { message: error.message } }
    }

    console.log('✅ Supabase resend successful')
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
    // Check if Supabase is properly configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co') {
      return { 
        success: false, 
        error: { message: 'Authentication service not configured. Please set up Supabase environment variables.' } 
      }
    }

    console.log('🔧 Starting Google OAuth sign-in')
    
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
      }
    })

    if (error) {
      console.error('🚨 Google OAuth error:', error)
      return { success: false, error: { message: error.message } }
    }

    console.log('✅ Google OAuth initiated successfully')
    return { success: true, data }
  } catch (error) {
    console.error('💥 Unexpected error during Google sign-in:', error)
    return { 
      success: false, 
      error: { message: 'Failed to sign in with Google. Please try again.' } 
    }
  }
}

// Sign in with email and password
export async function signInWithEmailPassword({ email, password }: SignUpData) {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('🚨 Supabase signIn error:', error)
      return { success: false, error: { message: error.message, code: error.code } }
    }

    console.log('✅ Supabase signIn successful for user:', data.user?.email)
    return { success: true, data }
  } catch (error) {
    console.error('💥 Unexpected error during sign-in:', error)
    return {
      success: false,
      error: { message: 'An unexpected error occurred. Please try again.' },
    }
  }
}

// Validation helpers
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 6) {
    return { valid: false, message: 'Password must be at least 6 characters long' }
  }
  return { valid: true }
}

// Check if user already exists with given email
export async function checkUserExists(email: string) {
  try {
    const supabase = createClient()
    
    // This will trigger a password reset email if user exists
    // but won't create a new user or expose if email exists
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
    })
    
    // Supabase doesn't expose whether email exists for security
    // so we return a generic response
    return { 
      success: true, 
      message: 'If an account exists with this email, you will receive instructions.' 
    }
  } catch (error) {
    return { 
      success: false, 
      error: { message: 'Unable to check account status. Please try again.' } 
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