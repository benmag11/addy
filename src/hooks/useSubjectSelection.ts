import { useState, useCallback } from 'react'
import type { Subject, SelectedSubject, SubjectLevel } from '@/types'

export const MIN_SUBJECTS = 6
export const MAX_SUBJECTS = 14

export function useSubjectSelection() {
  const [selectedSubjects, setSelectedSubjects] = useState<SelectedSubject[]>([])
  
  const selectSubject = useCallback((subject: Subject, level: SubjectLevel) => {
    setSelectedSubjects(prev => {
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
  }, [])
  
  const removeSubject = useCallback((subjectId: string) => {
    setSelectedSubjects(prev => prev.filter(s => s.subject.id !== subjectId))
  }, [])
  
  const isSubjectSelected = useCallback((subjectId: string) => {
    return selectedSubjects.some(s => s.subject.id === subjectId)
  }, [selectedSubjects])
  
  const getSelectedLevel = useCallback((subjectId: string): SubjectLevel | undefined => {
    return selectedSubjects.find(s => s.subject.id === subjectId)?.level
  }, [selectedSubjects])
  
  const isValidCount = selectedSubjects.length >= MIN_SUBJECTS && selectedSubjects.length <= MAX_SUBJECTS
  
  return {
    selectedSubjects,
    selectSubject,
    removeSubject,
    isSubjectSelected,
    getSelectedLevel,
    isValidCount,
    count: selectedSubjects.length,
    minSubjects: MIN_SUBJECTS,
    maxSubjects: MAX_SUBJECTS
  }
}