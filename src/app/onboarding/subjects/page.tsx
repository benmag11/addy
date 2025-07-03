'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { saveOnboardingStep, LEAVING_CERT_SUBJECTS } from '@/lib/auth'
import type { User } from '@/types'
import { useSubjectSelection } from '@/hooks/useSubjectSelection'
import SubjectCardNew from '@/components/onboarding/SubjectCardNew'
import SelectedSubjectsPanel from '@/components/onboarding/SelectedSubjectsPanel'
import SearchBar from '@/components/onboarding/SearchBar'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function OnboardingSubjectsPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  
  const {
    selectedSubjects,
    selectSubject,
    removeSubject,
    isSubjectSelected,
    getSelectedLevel,
    isValidCount,
    count,
    minSubjects,
    maxSubjects
  } = useSubjectSelection()

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

  // Filter subjects based on search term
  const filteredSubjects = useMemo(() => {
    if (!searchTerm.trim()) {
      return LEAVING_CERT_SUBJECTS
    }
    
    const lowerSearchTerm = searchTerm.toLowerCase()
    return LEAVING_CERT_SUBJECTS.filter(subject =>
      subject.name.toLowerCase().includes(lowerSearchTerm)
    )
  }, [searchTerm])

  const handleSubmit = async () => {
    if (!user) return
    
    // Validation is already handled by isValidCount
    if (!isValidCount) {
      if (count < minSubjects) {
        setError(`Please select at least ${minSubjects} subjects`)
      } else if (count > maxSubjects) {
        setError(`Please select no more than ${maxSubjects} subjects`)
      }
      return
    }
    
    setError(null)
    setLoading(true)

    try {
      const result = await saveOnboardingStep(user.id, { subjects: selectedSubjects })
      
      if (!result.success) {
        setError('error' in result && result.error ? result.error.message : 'Failed to save subjects')
        return
      }

      router.push('/welcome')
    } catch (err) {
      console.error('Unexpected error during subject save:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return <LoadingSpinner />
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="text-center px-4 py-6 md:py-8">
        <h1 className="text-2xl md:text-3xl font-normal text-black mb-2 font-sf-pro">
          What subjects do you study?
        </h1>
        <p className="text-gray-500 text-sm md:text-base font-sf-pro">
          We'll help you focus on what matters most
        </p>
      </div>

      {/* Main Content */}
      <div className="px-4 md:px-8 pb-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Subject Selection Area */}
          <div className="lg:col-span-2">
            <div className="bg-gray-50 rounded-xl p-4 md:p-6">
              {/* Search Bar */}
              <div className="mb-4">
                <SearchBar 
                  onSearch={setSearchTerm}
                  placeholder="Search subjects..."
                />
              </div>
              
              {/* Subject Grid with scroll indicator */}
              <div className="relative">
                <div className="max-h-[calc(100vh-300px)] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent scroll-indicator">
                  {filteredSubjects.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-500 text-sm font-sf-pro">
                        No subjects found matching "{searchTerm}"
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {filteredSubjects.map((subject) => {
                        const level = getSelectedLevel(subject.id)
                        return (
                          <SubjectCardNew
                            key={subject.id}
                            subject={subject}
                            isSelected={isSubjectSelected(subject.id)}
                            selectedLevel={level}
                            onSelect={selectSubject}
                            onRemove={removeSubject}
                          />
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Selected Subjects Panel */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <SelectedSubjectsPanel
                selectedSubjects={selectedSubjects}
                onRemoveSubject={removeSubject}
                onContinue={handleSubmit}
                loading={loading}
                isValidCount={isValidCount}
              />
              
              {/* Error Message */}
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800 font-sf-pro">{error}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .scroll-indicator {
          background:
            linear-gradient(rgb(249 250 251) 30%, rgba(249, 250, 251, 0)),
            linear-gradient(rgba(249, 250, 251, 0), rgb(249 250 251) 70%) bottom,
            radial-gradient(farthest-side at 50% 0, rgba(0, 0, 0, .08), transparent),
            radial-gradient(farthest-side at 50% 100%, rgba(0, 0, 0, .08), transparent) bottom;
          background-repeat: no-repeat;
          background-size: 100% 40px, 100% 40px, 100% 14px, 100% 14px;
          background-attachment: local, local, scroll, scroll;
        }
      `}</style>
    </div>
  )
}
