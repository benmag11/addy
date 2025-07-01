'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { completeOnboarding } from '@/lib/auth'

export default function OnboardingSubjectsPage() {
  const router = useRouter()
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

  const handleComplete = async () => {
    if (!user) return
    
    setError(null)
    setLoading(true)

    try {
      const result = await completeOnboarding(user.id)
      
      if (!result.success) {
        setError('error' in result && result.error ? result.error.message : 'Failed to complete onboarding')
        return
      }

      // Navigate to welcome page
      router.push('/welcome')
    } catch (err) {
      console.error('Unexpected error during onboarding completion:', err)
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
          What subjects do you study?
        </h1>
        <p className="text-gray-500 text-sm font-sf-pro">
          We&apos;ll help you focus on what matters most
        </p>
      </div>

      {/* Placeholder Content */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 mb-8">
        <div className="text-gray-400 mb-4">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-700 mb-2 font-sf-pro">
          Subject Selection Coming Soon
        </h3>
        <p className="text-gray-500 text-sm font-sf-pro max-w-sm mx-auto">
          We&apos;re working on an amazing subject selection experience. For now, let&apos;s get you started with your personalized dashboard!
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-red-500 text-sm font-sf-pro mb-4">{error}</p>
      )}

      {/* Complete Button */}
      <button
        onClick={handleComplete}
        disabled={loading}
        className="w-full text-white py-3 rounded-lg transition-colors font-sf-pro font-medium text-base disabled:opacity-50"
        style={{ backgroundColor: '#0275DE' }}
      >
        {loading ? 'Completing setup...' : 'Complete Setup'}
      </button>

      {/* Skip Note */}
      <p className="text-xs text-gray-500 mt-4 font-sf-pro">
        You can always add subjects later in your settings
      </p>
    </div>
  )
}