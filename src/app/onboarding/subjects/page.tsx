'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { saveOnboardingStep, LEAVING_CERT_SUBJECTS, type Subject, type SelectedSubject, type SubjectLevel } from '@/lib/auth'
import SubjectCard from '@/components/onboarding/SubjectCard'
import SelectedSubjectsSidebar from '@/components/onboarding/SelectedSubjectsSidebar'

export default function OnboardingSubjectsPage() {
  const router = useRouter()
  const [selectedSubjects, setSelectedSubjects] = useState<SelectedSubject[]>([])
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

  // Handle scroll shadows for subjects container
  useEffect(() => {
    const handleScroll = () => {
      const container = document.getElementById('subjects-scroll-container')
      const topShadow = document.getElementById('scroll-top-shadow')
      const bottomShadow = document.getElementById('scroll-bottom-shadow')
      
      if (container && topShadow && bottomShadow) {
        const { scrollTop, scrollHeight, clientHeight } = container
        const isScrollable = scrollHeight > clientHeight
        
        // Show/hide top shadow
        if (scrollTop > 0) {
          topShadow.classList.add('opacity-100')
          topShadow.classList.remove('opacity-0')
        } else {
          topShadow.classList.remove('opacity-100')
          topShadow.classList.add('opacity-0')
        }
        
        // Show/hide bottom shadow
        if (isScrollable && scrollTop < scrollHeight - clientHeight - 1) {
          bottomShadow.classList.add('opacity-100')
          bottomShadow.classList.remove('opacity-0')
        } else {
          bottomShadow.classList.remove('opacity-100')
          bottomShadow.classList.add('opacity-0')
        }
      }
    }
    
    // Initial check
    handleScroll()
    
    // Add scroll listener
    const container = document.getElementById('subjects-scroll-container')
    if (container) {
      container.addEventListener('scroll', handleScroll)
      // Also check on window resize
      window.addEventListener('resize', handleScroll)
      
      return () => {
        container.removeEventListener('scroll', handleScroll)
        window.removeEventListener('resize', handleScroll)
      }
    }
  }, [])

  const handleSubjectSelect = (subject: Subject, level: SubjectLevel) => {
    setSelectedSubjects(prev => {
      // Check if subject is already selected
      const existingIndex = prev.findIndex(s => s.subject.id === subject.id)
      
      if (existingIndex >= 0) {
        // Update existing selection
        const updated = [...prev]
        updated[existingIndex] = { subject, level }
        return updated
      } else {
        // Add new selection
        return [...prev, { subject, level }]
      }
    })
    setError(null)
  }

  const handleSubjectRemove = (subjectId: string) => {
    setSelectedSubjects(prev => prev.filter(s => s.subject.id !== subjectId))
  }

  const isSubjectSelected = (subjectId: string) => {
    return selectedSubjects.some(s => s.subject.id === subjectId)
  }

  const getSelectedLevel = (subjectId: string): SubjectLevel | undefined => {
    return selectedSubjects.find(s => s.subject.id === subjectId)?.level
  }

  const handleSubmit = async () => {
    if (!user) return
    
    setError(null)
    setLoading(true)

    try {
      const result = await saveOnboardingStep(user.id, { subjects: selectedSubjects })
      
      if (!result.success) {
        setError('error' in result && result.error ? result.error.message : 'Failed to save subjects')
        return
      }

      // Navigate to welcome page (completing onboarding)
      router.push('/welcome')
    } catch (err) {
      console.error('Unexpected error during subject save:', err)
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
    <>
      {/* Mobile Layout */}
      <div className="block md:hidden">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-normal text-black mb-2 font-sf-pro">
            What subjects do you study?
          </h1>
          <p className="text-gray-500 text-sm font-sf-pro">
            We&apos;ll help you focus on what matters most
          </p>
        </div>

        {/* Selected Subjects (Collapsible on Mobile) */}
        {selectedSubjects.length > 0 && (
          <div className="mb-6">
            <SelectedSubjectsSidebar
              selectedSubjects={selectedSubjects}
              onRemoveSubject={handleSubjectRemove}
            />
          </div>
        )}

        {/* Subject Cards */}
        <div className="space-y-3 mb-8">
          {LEAVING_CERT_SUBJECTS.map((subject) => (
            <SubjectCard
              key={subject.id}
              subject={subject}
              isSelected={isSubjectSelected(subject.id)}
              selectedLevel={getSelectedLevel(subject.id)}
              onSelect={handleSubjectSelect}
            />
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <p className="text-red-500 text-sm font-sf-pro mb-4">{error}</p>
        )}

        {/* Continue Button */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500 font-sf-pro">
            {selectedSubjects.length} subjects selected
          </span>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="text-white px-6 py-3 rounded-lg transition-colors font-sf-pro font-medium text-base disabled:opacity-50"
            style={{ backgroundColor: '#0275DE' }}
          >
            {loading ? 'Saving...' : 'Continue'}
          </button>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-normal text-black mb-2 font-sf-pro">
            What subjects do you study?
          </h1>
          <p className="text-gray-500 text-sm font-sf-pro">
            We&apos;ll help you focus on what matters most
          </p>
        </div>

        <div className="grid grid-cols-3 gap-8 mb-8">
          {/* Subject Selection Panel - Scrollable */}
          <div className="col-span-2">
            <div className="relative">
              {/* Scroll gradient overlay at top */}
              <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none opacity-0 transition-opacity duration-300" id="scroll-top-shadow"></div>
              
              {/* Scrollable container */}
              <div className="max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent" id="subjects-scroll-container">
                <div className="grid grid-cols-2 gap-3 pb-2">
                  {LEAVING_CERT_SUBJECTS.map((subject) => (
                    <SubjectCard
                      key={subject.id}
                      subject={subject}
                      isSelected={isSubjectSelected(subject.id)}
                      selectedLevel={getSelectedLevel(subject.id)}
                      onSelect={handleSubjectSelect}
                    />
                  ))}
                </div>
              </div>
              
              {/* Scroll gradient overlay at bottom */}
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none opacity-0 transition-opacity duration-300" id="scroll-bottom-shadow"></div>
            </div>
          </div>

          {/* Selected Subjects Sidebar */}
          <div className="col-span-1">
            <SelectedSubjectsSidebar
              selectedSubjects={selectedSubjects}
              onRemoveSubject={handleSubjectRemove}
              className="sticky top-4"
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <p className="text-red-500 text-sm font-sf-pro mb-4 text-center">{error}</p>
        )}

        {/* Continue Button */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500 font-sf-pro">
            {selectedSubjects.length} subjects selected
          </span>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="text-white px-8 py-3 rounded-lg transition-colors font-sf-pro font-medium text-base disabled:opacity-50"
            style={{ backgroundColor: '#0275DE' }}
          >
            {loading ? 'Saving...' : 'Continue'}
          </button>
        </div>
      </div>
    </>
  )
}