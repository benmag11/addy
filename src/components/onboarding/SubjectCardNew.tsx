'use client'

import type { Subject, SubjectLevel } from '@/types'

interface SubjectCardNewProps {
  subject: Subject
  isSelected: boolean
  selectedLevel?: SubjectLevel
  onSelect: (subject: Subject, level: SubjectLevel) => void
  onRemove: (subjectId: string) => void
}

export default function SubjectCardNew({
  subject,
  isSelected,
  selectedLevel,
  onSelect,
  onRemove
}: SubjectCardNewProps) {
  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Deselect if clicking anywhere on the card (buttons have stopPropagation)
    if (isSelected) {
      onRemove(subject.id)
    }
  }
  
  const handleLevelClick = (level: SubjectLevel) => (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation() // Prevent card click event
    onSelect(subject, level)
  }
  
  return (
    <div 
      onClick={handleCardClick}
      className={`
        rounded-lg border transition-all duration-200 relative
        ${isSelected 
          ? 'border-blue-500 bg-blue-50/50 shadow-sm cursor-pointer' 
          : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
        }
      `}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className={`text-sm font-medium font-sf-pro ${
            isSelected ? 'text-blue-900' : 'text-gray-900'
          }`}>
            {subject.name}
          </h4>
          {isSelected && (
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        
        {/* Always show level buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleLevelClick('higher')}
            className={`
              flex-1 px-3 py-2 text-sm font-sf-pro rounded-md border transition-all duration-200
              ${isSelected && selectedLevel === 'higher'
                ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 bg-white'
              }
            `}
          >
            Higher
          </button>
          <button
            onClick={handleLevelClick('ordinary')}
            className={`
              flex-1 px-3 py-2 text-sm font-sf-pro rounded-md border transition-all duration-200
              ${isSelected && selectedLevel === 'ordinary'
                ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 bg-white'
              }
            `}
          >
            Ordinary
          </button>
        </div>
      </div>
    </div>
  )
}