'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { saveOnboardingStep, validateYear, type YearOption } from '@/lib/auth'
import OnboardingCard from '@/components/onboarding/OnboardingCard'

const YEAR_OPTIONS: { value: YearOption; description: string }[] = [
  { value: '1st year', description: 'Just starting your leaving certificate journey' },
  { value: '2nd year', description: 'Building your foundation knowledge' },
  { value: '3rd year', description: 'Expanding your academic horizons' },
  { value: '4th year', description: 'Preparing for senior cycle challenges' },
  { value: '5th year', description: 'Beginning your leaving certificate preparations' },
  { value: '6th year', description: 'Final year - time to excel!' }
]

export default function OnboardingYearPage() {
  const router = useRouter()
  const [selectedYear, setSelectedYear] = useState<YearOption | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)

  // Get current user on mount
  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/signup')
        return
      }
      
      setUser(user)
    }
    
    getUser()
  }, [router])

  const handleYearSelect = (year: YearOption) => {
    setSelectedYear(year)
    setError(null)
  }

  const handleSubmit = async () => {
    if (!user || !selectedYear) return
    
    setError(null)
    
    // Validate year
    const validation = validateYear(selectedYear)
    if (!validation.valid) {
      setError(validation.message!)
      return
    }

    setLoading(true)

    try {
      const result = await saveOnboardingStep(user.id, { year: selectedYear })
      
      if (!result.success) {
        setError('error' in result && result.error ? result.error.message : 'Failed to save year')
        return
      }

      // Navigate to next step (subjects placeholder for now)
      router.push('/onboarding/subjects')
    } catch (err) {
      console.error('Unexpected error during year save:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="text-gray-500 mt-2 font-sf-pro">Loading...</p>
      </div>
    )
  }

  return (
    <div className="text-center">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-normal text-black mb-2 font-sf-pro">
          What year are you in?
        </h1>
        <p className="text-gray-500 text-sm font-sf-pro">
          This helps us tailor content to your level
        </p>
      </div>

      {/* Year Selection Cards */}
      <div className="space-y-3 mb-8">
        {YEAR_OPTIONS.map((option) => {
          const Icon = () => (
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          )

          return (
            <OnboardingCard
              key={option.value}
              title={option.value.charAt(0).toUpperCase() + option.value.slice(1)}
              description={option.description}
              icon={<Icon />}
              selected={selectedYear === option.value}
              onClick={() => handleYearSelect(option.value)}
            />
          )
        })}
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-red-500 text-sm font-sf-pro mb-4">{error}</p>
      )}

      {/* Continue Button */}
      <button
        onClick={handleSubmit}
        disabled={loading || !selectedYear}
        className="w-full text-white py-3 rounded-lg transition-colors font-sf-pro font-medium text-base disabled:opacity-50"
        style={{ backgroundColor: '#0275DE' }}
      >
        {loading ? 'Saving...' : 'Continue'}
      </button>
    </div>
  )
}