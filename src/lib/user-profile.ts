import { createClient } from '@/utils/supabase/client'
import type { SelectedSubject, YearOption, AuthResult } from '@/types'

export interface UserProfile {
  user_id: string
  full_name: string | null
  year: string | null
  subjects: string[] | null
  onboarding_completed: boolean
  onboarding_step?: string
  created_at?: string
  updated_at?: string
}

export type OnboardingStep = 'name' | 'year' | 'subjects' | 'completed'

// Get user profile from database
export async function getUserProfile(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()
  
  return { data, error }
}

// Update user profile in database
export async function updateUserProfile(userId: string, updates: Partial<UserProfile>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('user_profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .select()
    .single()
  
  return { data, error }
}

// Create user profile if it doesn't exist
export async function createUserProfile(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('user_profiles')
    .insert({ user_id: userId })
    .select()
    .single()
  
  return { data, error }
}

// Get current onboarding step based on profile data
export async function getOnboardingStep(userId: string): Promise<OnboardingStep> {
  const { data, error } = await getUserProfile(userId)
  
  // If no profile exists, create one and return 'name'
  if (error || !data) {
    await createUserProfile(userId)
    return 'name'
  }
  
  // If onboarding is completed, return 'completed'
  if (data.onboarding_completed) return 'completed'
  
  // Determine next step based on what's filled
  if (!data.full_name) return 'name'
  if (!data.year) return 'year'
  if (!data.subjects || data.subjects.length === 0) return 'subjects'
  
  // All fields filled, mark as completed
  return 'completed'
}

// Convert SelectedSubject array to string array for storage
export function convertSubjectsToStrings(subjects: SelectedSubject[]): string[] {
  return subjects.map(s => `${s.subject.id}:${s.level}`)
}

// Convert string array from storage to SelectedSubject array
export function convertStringsToSubjects(subjectStrings: string[]): SelectedSubject[] {
  // This would need access to LEAVING_CERT_SUBJECTS to reconstruct the full objects
  // For now, we'll just parse the format
  return subjectStrings.map(str => {
    const [id, level] = str.split(':')
    if (!id || !level) {
      throw new Error(`Invalid subject string format: ${str}`)
    }
    return {
      subject: { id, name: id, category: 'core' as const }, // Simplified for now
      level: level as 'higher' | 'ordinary'
    }
  })
}

// Check if user has completed onboarding
export async function hasCompletedOnboarding(userId: string): Promise<boolean> {
  const { data } = await getUserProfile(userId)
  return data?.onboarding_completed || false
}

// Get the next onboarding URL based on current step
export function getOnboardingUrl(step: OnboardingStep): string {
  const stepMap: Record<OnboardingStep, string> = {
    'name': '/onboarding/name',
    'year': '/onboarding/year',
    'subjects': '/onboarding/subjects',
    'completed': '/welcome'
  }
  
  return stepMap[step] || '/onboarding/name'
}

// Save onboarding step data to database
export async function saveOnboardingStep(userId: string, data: { name?: string; year?: YearOption; subjects?: SelectedSubject[] }): Promise<AuthResult> {
  try {
    const updates: any = {}
    
    if (data.name) {
      updates.full_name = data.name
      updates.onboarding_step = 'year'
    }
    
    if (data.year) {
      updates.year = data.year
      updates.onboarding_step = 'subjects'
    }
    
    if (data.subjects) {
      // Convert SelectedSubject[] to string[] format for storage
      updates.subjects = convertSubjectsToStrings(data.subjects)
      updates.onboarding_step = 'completed'
      updates.onboarding_completed = true
    }
    
    const { error } = await updateUserProfile(userId, updates)

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
export async function completeOnboarding(userId: string): Promise<AuthResult> {
  try {
    const { error } = await updateUserProfile(userId, {
      onboarding_completed: true,
      onboarding_step: 'completed'
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