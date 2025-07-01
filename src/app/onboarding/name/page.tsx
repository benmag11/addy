'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { saveOnboardingStep, validateName, formatAuthError, type AuthError } from '@/lib/auth'

export default function OnboardingNamePage() {
  const router = useRouter()
  const [name, setName] = useState('')
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    
    setError(null)
    
    // Validate name
    const validation = validateName(name)
    if (!validation.valid) {
      setError(validation.message!)
      return
    }

    setLoading(true)

    try {
      const result = await saveOnboardingStep(user.id, { name: name.trim() })
      
      if (!result.success) {
        setError('error' in result && result.error ? result.error.message : 'Failed to save name')
        return
      }

      // Navigate to next step
      router.push('/onboarding/year')
    } catch (err) {
      console.error('Unexpected error during name save:', err)
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
          What&apos;s your name?
        </h1>
        <p className="text-gray-500 text-sm font-sf-pro">
          This helps us personalize your experience
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="text-left">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2 font-sf-pro">
            Full name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-sf-pro text-base"
            placeholder="Enter your full name"
            required
            autoFocus
          />
        </div>

        {/* Error Message */}
        {error && (
          <p className="text-red-500 text-sm font-sf-pro text-left">{error}</p>
        )}

        {/* Continue Button */}
        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="w-full text-white py-3 rounded-lg transition-colors font-sf-pro font-medium text-base disabled:opacity-50"
          style={{ backgroundColor: '#0275DE' }}
        >
          {loading ? 'Saving...' : 'Continue'}
        </button>
      </form>
    </div>
  )
}