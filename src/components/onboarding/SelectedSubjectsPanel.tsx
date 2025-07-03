'use client'

import type { SelectedSubject } from '@/types'
import { MIN_SUBJECTS, MAX_SUBJECTS } from '@/hooks/useSubjectSelection'

interface SelectedSubjectsPanelProps {
  selectedSubjects: SelectedSubject[]
  onRemoveSubject: (subjectId: string) => void
  onContinue: () => void
  loading: boolean
  isValidCount: boolean
}

export default function SelectedSubjectsPanel({
  selectedSubjects,
  onRemoveSubject,
  onContinue,
  loading,
  isValidCount
}: SelectedSubjectsPanelProps) {
  const count = selectedSubjects.length
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900 font-sf-pro">
            Selected Subjects
          </h3>
          <span className="text-sm text-gray-500 font-sf-pro">
            {count} selected
          </span>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4">
        {count === 0 ? (
          // Empty state
          <div className="text-center py-12">
            <div className="text-gray-400 mb-3">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" 
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" 
                />
              </svg>
            </div>
            <p className="text-gray-500 text-sm font-sf-pro mb-2">
              Choose subjects to see them here
            </p>
            <p className="text-gray-400 text-xs font-sf-pro">
              Minimum {MIN_SUBJECTS} subjects required
            </p>
          </div>
        ) : (
          <>
            {/* Selected subjects list */}
            <div className="space-y-2 mb-4 max-h-[400px] overflow-y-auto">
              {selectedSubjects.map((selectedSubject) => (
                <div
                  key={selectedSubject.subject.id}
                  className="group bg-gray-50 rounded-lg p-3 transition-all hover:bg-gray-100"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 font-sf-pro">
                        {selectedSubject.subject.name}
                      </h4>
                      <p className="text-xs text-gray-600 font-sf-pro mt-0.5">
                        {selectedSubject.level === 'higher' ? 'Higher' : 'Ordinary'} Level
                      </p>
                    </div>
                    
                    <button
                      onClick={() => onRemoveSubject(selectedSubject.subject.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-red-600 rounded"
                      aria-label={`Remove ${selectedSubject.subject.name}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Validation Messages */}
            {count < MIN_SUBJECTS && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-blue-800 font-sf-pro">
                    Select {MIN_SUBJECTS - count} more subject{MIN_SUBJECTS - count !== 1 ? 's' : ''} to continue
                  </p>
                </div>
              </div>
            )}
            
            {count > MAX_SUBJECTS && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-sm text-red-800 font-sf-pro">
                    Maximum {MAX_SUBJECTS} subjects allowed. Remove {count - MAX_SUBJECTS} subject{count - MAX_SUBJECTS !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Footer with continue button */}
      <div className="p-4 border-t border-gray-100 bg-gray-50">
        <button
          onClick={onContinue}
          disabled={loading || !isValidCount}
          className="w-full bg-addy-blue text-white py-3 rounded-lg transition-all font-sf-pro font-medium text-base disabled:opacity-50 disabled:cursor-not-allowed hover:enabled:opacity-90"
        >
          {loading ? 'Saving...' : 'Continue'}
        </button>
        {count > 0 && (
          <p className="text-xs text-gray-500 text-center mt-2 font-sf-pro">
            {count} of {MIN_SUBJECTS}-{MAX_SUBJECTS} subjects selected
          </p>
        )}
      </div>
    </div>
  )
}