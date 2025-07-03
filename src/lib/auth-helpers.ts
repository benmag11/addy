import { NextRouter } from 'next/router'
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'

/**
 * Determines the correct redirect URL based on user's onboarding status
 */
export async function getPostAuthRedirect(userId: string): Promise<string> {
  try {
    const { getOnboardingStep, getOnboardingUrl } = await import('./user-profile')
    
    const step = await getOnboardingStep(userId)
    
    if (step === 'completed') {
      return '/welcome'
    } else {
      return getOnboardingUrl(step)
    }
  } catch (error) {
    console.error('Error determining post-auth redirect:', error)
    // Fallback to onboarding start if there's an error
    return '/onboarding/name'
  }
}

/**
 * Handles post-sign-in redirect logic for client components
 * Uses the app router (useRouter from next/navigation)
 */
export async function handlePostSignIn(userId: string, router: AppRouterInstance): Promise<void> {
  try {
    const redirectUrl = await getPostAuthRedirect(userId)
    router.push(redirectUrl)
  } catch (error) {
    console.error('Error in post-sign-in redirect:', error)
    // Fallback - let middleware handle it or go to welcome
    router.push('/welcome')
  }
}

/**
 * Client-safe version that checks onboarding status and redirects accordingly
 * This is for use in client components that need to check user status
 */
export async function checkAndRedirectUser(router: AppRouterInstance): Promise<void> {
  try {
    const { createClient } = await import('@/utils/supabase/client')
    const { getOnboardingStep, getOnboardingUrl } = await import('./user-profile')
    
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/signup')
      return
    }
    
    const step = await getOnboardingStep(user.id)
    
    if (step !== 'completed') {
      const redirectUrl = getOnboardingUrl(step)
      router.push(redirectUrl)
    }
    // If completed, stay on current page
  } catch (error) {
    console.error('Error checking user status:', error)
    // Don't redirect on error to avoid infinite loops
  }
}

/**
 * Validates if user has completed onboarding
 * Returns true if completed, false if not, null if error
 */
export async function hasCompletedOnboarding(userId: string): Promise<boolean | null> {
  try {
    const { getOnboardingStep } = await import('./user-profile')
    const step = await getOnboardingStep(userId)
    return step === 'completed'
  } catch (error) {
    console.error('Error checking onboarding completion:', error)
    return null
  }
}

/**
 * Gets the current user and their onboarding status
 * Returns user info and onboarding completion status
 */
export async function getUserWithOnboardingStatus() {
  try {
    const { createClient } = await import('@/utils/supabase/client')
    const { getOnboardingStep } = await import('./user-profile')
    
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return { user: null, step: null, isCompleted: false, error }
    }
    
    const step = await getOnboardingStep(user.id)
    const isCompleted = step === 'completed'
    
    return { user, step, isCompleted, error: null }
  } catch (error) {
    console.error('Error getting user with onboarding status:', error)
    return { user: null, step: null, isCompleted: false, error }
  }
}