'use client'

import { useState, useRef, useEffect } from 'react'
import { Subject, SubjectLevel } from '@/lib/auth'

interface SubjectCardProps {
  subject: Subject
  isSelected: boolean
  selectedLevel?: SubjectLevel
  onSelect: (subject: Subject, level: SubjectLevel) => void
  onDeselect: (subjectId: string) => void
  className?: string
}

export default function SubjectCard({ 
  subject, 
  isSelected, 
  selectedLevel,
  onSelect,
  onDeselect,
  className = "" 
}: SubjectCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  // Close card when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        setIsExpanded(false)
      }
    }

    if (isExpanded && !isSelected) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isExpanded, isSelected])

  // Keep expanded if already selected
  useEffect(() => {
    if (isSelected) {
      setIsExpanded(true)
    }
  }, [isSelected])

  const handleCardClick = () => {
    if (!isSelected) {
      // First click: expand and auto-select with Higher level
      setIsExpanded(true)
      onSelect(subject, 'higher')
    } else {
      // Click on selected card: deselect it
      onDeselect(subject.id)
      setIsExpanded(false)
    }
  }

  const handleLevelSelect = (level: SubjectLevel) => {
    onSelect(subject, level)
  }

  return (
    <div ref={cardRef} className={`${className}`}>
      <div
        className={`
          w-full rounded-lg border transition-all duration-200
          ${isSelected 
            ? 'border-blue-500 bg-blue-50 shadow-sm' 
            : isExpanded
            ? 'border-gray-300 bg-white shadow-sm'
            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
          }
        `}
      >
        {/* Subject Name Section */}
        <button
          onClick={handleCardClick}
          className="w-full p-4 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded-t-lg"
          aria-pressed={isSelected}
          aria-label={`${subject.name} - ${isSelected ? 'selected, click to deselect' : 'click to select'}`}
        >
          <div className="flex items-center justify-between">
            <h3 className={`text-sm font-medium font-sf-pro ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
              {subject.name}
            </h3>
            
            {isSelected && (
              <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        </button>

        {/* Level Selection Section - Inline Expansion */}
        {isExpanded && (
          <>
            <div className="border-t border-gray-200"></div>
            <div className="p-2">
              <button
                onClick={() => handleLevelSelect('higher')}
                className={`
                  w-full px-3 py-2 text-left text-sm font-sf-pro rounded transition-colors
                  ${selectedLevel === 'higher' 
                    ? 'bg-blue-100 text-blue-900' 
                    : 'hover:bg-gray-50 text-gray-700'
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <span>Higher Level</span>
                  {selectedLevel === 'higher' && (
                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </button>
              
              <button
                onClick={() => handleLevelSelect('ordinary')}
                className={`
                  w-full px-3 py-2 text-left text-sm font-sf-pro rounded transition-colors mt-1
                  ${selectedLevel === 'ordinary' 
                    ? 'bg-blue-100 text-blue-900' 
                    : 'hover:bg-gray-50 text-gray-700'
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <span>Ordinary Level</span>
                  {selectedLevel === 'ordinary' && (
                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}