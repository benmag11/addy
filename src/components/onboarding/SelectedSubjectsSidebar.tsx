'use client'

import { SelectedSubject } from '@/lib/auth'

interface SelectedSubjectsSidebarProps {
  selectedSubjects: SelectedSubject[]
  onRemoveSubject: (subjectId: string) => void
  onContinue: () => void
  loading?: boolean
  className?: string
}

export default function SelectedSubjectsSidebar({ 
  selectedSubjects, 
  onRemoveSubject,
  onContinue,
  loading = false,
  className = "" 
}: SelectedSubjectsSidebarProps) {
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
        </div>
      ) : (
        <div className="space-y-2">
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
      )}
      
      {/* Continue Button Section */}
      <div className="sticky bottom-0 -mx-6 -mb-6 mt-6 p-6 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-600 font-sf-pro">
            {selectedSubjects.length} {selectedSubjects.length === 1 ? 'subject' : 'subjects'} selected
          </span>
        </div>
        <button
          onClick={onContinue}
          disabled={loading || selectedSubjects.length === 0}
          className="w-full text-white py-3 rounded-lg transition-colors font-sf-pro font-medium text-base disabled:opacity-50"
          style={{ backgroundColor: '#0275DE' }}
        >
          {loading ? 'Saving...' : 'Continue'}
        </button>
      </div>
    </div>
  )
}