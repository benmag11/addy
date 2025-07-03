'use client'

import type { SelectedSubjectsSidebarProps } from '@/types'

export default function SelectedSubjectsSidebar({ 
  selectedSubjects, 
  onRemoveSubject,
  onContinue,
  loading = false,
  className = "" 
}: SelectedSubjectsSidebarProps) {
  const MIN_SUBJECTS = 6
  const MAX_SUBJECTS = 14
  const subjectCount = selectedSubjects.length
  const isValidCount = subjectCount >= MIN_SUBJECTS && subjectCount <= MAX_SUBJECTS
  
  return (
    <div className={`bg-gray-50 rounded-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 font-sf-pro">
          Selected Subjects
        </h3>
        <span className="text-sm text-gray-500 font-sf-pro">
          {selectedSubjects.length} selected
        </span>
      </div>

      {selectedSubjects.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-3">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm font-sf-pro">
            Choose subjects from the left to see them here
          </p>
          <p className="text-gray-400 text-xs font-sf-pro mt-2">
            Minimum 6 subjects required
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-2 mb-4">
            {selectedSubjects.map((selectedSubject) => (
              <div
                key={selectedSubject.subject.id}
                className="bg-white rounded-lg p-3 border border-gray-200 transition-all duration-200 hover:shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 font-sf-pro">
                      {selectedSubject.subject.name}
                    </h4>
                    <p className="text-xs text-gray-600 font-sf-pro mt-0.5">
                      {selectedSubject.level.charAt(0).toUpperCase() + selectedSubject.level.slice(1)} Level
                    </p>
                  </div>
                  
                  <button
                    onClick={() => onRemoveSubject(selectedSubject.subject.id)}
                    className="flex-shrink-0 ml-3 p-1 text-gray-400 hover:text-red-500 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 rounded"
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
          {subjectCount < MIN_SUBJECTS && (
            <div className="flex items-start space-x-2 mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-blue-800 font-sf-pro">
                Minimum 6 subjects required. Select {MIN_SUBJECTS - subjectCount} more.
              </p>
            </div>
          )}
          
          {subjectCount > MAX_SUBJECTS && (
            <div className="flex items-start space-x-2 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-sm text-red-800 font-sf-pro">
                Maximum 14 subjects allowed. Please remove {subjectCount - MAX_SUBJECTS} subject{subjectCount - MAX_SUBJECTS > 1 ? 's' : ''}.
              </p>
            </div>
          )}
        </>
      )}
      
      {/* Continue Button Section */}
      <div className="sticky bottom-0 -mx-6 -mb-6 mt-6 p-6 bg-gray-50 border-t border-gray-200">
        <div className="mb-3">
          <span className="text-sm text-gray-600 font-sf-pro">
            {selectedSubjects.length} {selectedSubjects.length === 1 ? 'subject' : 'subjects'} selected
          </span>
        </div>
        <button
          onClick={onContinue}
          disabled={loading || !isValidCount}
          className="w-full bg-addy-blue text-white py-3 rounded-lg transition-colors font-sf-pro font-medium text-base disabled:opacity-50 hover:opacity-90"
        >
          {loading ? 'Saving...' : 'Continue'}
        </button>
      </div>
    </div>
  )
}