import { createClient } from '@/utils/supabase/client'
import type { 
  AuthError, 
  SignUpData, 
  VerifyData, 
  YearOption, 
  Subject, 
  SelectedSubject, 
  ValidationResult,
  AuthResult
} from '@/types'

// Irish Leaving Certificate subjects
export const LEAVING_CERT_SUBJECTS: Subject[] = [
  // Core subjects
  { id: 'irish', name: 'Irish', category: 'core' },
  { id: 'english', name: 'English', category: 'core' },
  { id: 'mathematics', name: 'Mathematics', category: 'core' },
  
  // Languages
  { id: 'french', name: 'French', category: 'language' },
  { id: 'german', name: 'German', category: 'language' },
  { id: 'spanish', name: 'Spanish', category: 'language' },
  { id: 'italian', name: 'Italian', category: 'language' },
  { id: 'japanese', name: 'Japanese', category: 'language' },
  { id: 'latin', name: 'Latin', category: 'language' },
  
  // Sciences
  { id: 'biology', name: 'Biology', category: 'science' },
  { id: 'chemistry', name: 'Chemistry', category: 'science' },
  { id: 'physics', name: 'Physics', category: 'science' },
  { id: 'agricultural-science', name: 'Agricultural Science', category: 'science' },
  { id: 'applied-maths', name: 'Applied Mathematics', category: 'science' },
  
  // Humanities
  { id: 'history', name: 'History', category: 'humanities' },
  { id: 'geography', name: 'Geography', category: 'humanities' },
  { id: 'economics', name: 'Economics', category: 'humanities' },
  { id: 'politics', name: 'Politics & Society', category: 'humanities' },
  { id: 'classical-studies', name: 'Classical Studies', category: 'humanities' },
  { id: 'religious-education', name: 'Religious Education', category: 'humanities' },
  
  // Business
  { id: 'business', name: 'Business', category: 'business' },
  { id: 'accounting', name: 'Accounting', category: 'business' },
  
  // Practical
  { id: 'art', name: 'Art', category: 'practical' },
  { id: 'music', name: 'Music', category: 'practical' },
  { id: 'pe', name: 'Physical Education', category: 'practical' },
  { id: 'home-economics', name: 'Home Economics', category: 'practical' },
  { id: 'construction', name: 'Construction Studies', category: 'practical' },
  { id: 'dcg', name: 'Design & Communication Graphics', category: 'practical' },
  { id: 'engineering', name: 'Engineering', category: 'practical' },
  { id: 'technology', name: 'Technology', category: 'practical' }
]

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

// Sign in with Google OAuth
export async function signInWithGoogle(): Promise<AuthResult<{ provider: string; url: string } | null>> {
  try {
    const configCheck = validateSupabaseConfig()
    if (!configCheck.success) {
      return configCheck
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

export function validateName(name: string): ValidationResult {
  const trimmedName = name.trim()
  
  if (!trimmedName) {
    return { valid: false, message: 'Please enter your name' }
  }
  
  if (trimmedName.length < 2) {
    return { valid: false, message: 'Name must be at least 2 characters long' }
  }
  
  if (trimmedName.length > 50) {
    return { valid: false, message: 'Name must be less than 50 characters' }
  }
  
  return { valid: true }
}

export function validateYear(year: YearOption): ValidationResult {
  const validYears: YearOption[] = ['1st year', '2nd year', '3rd year', '4th year', '5th year', '6th year']
  
  if (!validYears.includes(year)) {
    return { valid: false, message: 'Please select a valid year' }
  }
  
  return { valid: true }
}

// Save onboarding step data to user metadata
export async function saveOnboardingStep(_userId: string, data: { name?: string; year?: YearOption; subjects?: SelectedSubject[] }): Promise<AuthResult> {
  try {
    const configCheck = validateSupabaseConfig()
    if (!configCheck.success) {
      return configCheck
    }
    
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({
      data: {
        onboarding: {
          ...data,
          step: data.name ? 'name' : data.year ? 'year' : data.subjects ? 'subjects' : 'unknown',
          completed: false,
          updated_at: new Date().toISOString()
        }
      }
    })

    if (error) {
      return { success: false, error: { message: error.message } }
    }

    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: { message: 'Failed to save onboarding data. Please try again.' } 
    }
  }
}

// Complete the onboarding process
export async function completeOnboarding(_userId: string): Promise<AuthResult> {
  try {
    const configCheck = validateSupabaseConfig()
    if (!configCheck.success) {
      return configCheck
    }
    
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({
      data: {
        onboarding: {
          completed: true,
          completed_at: new Date().toISOString()
        }
      }
    })

    if (error) {
      return { success: false, error: { message: error.message } }
    }

    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: { message: 'Failed to complete onboarding. Please try again.' } 
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