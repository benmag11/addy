import type { Subject } from '@/types'

// Irish Leaving Certificate subjects
export const LEAVING_CERT_SUBJECTS: Subject[] = [
  // Core subjects
  { id: 'irish', name: 'Irish', category: 'core' },
  { id: 'english', name: 'English', category: 'core' },
  { id: 'mathematics', name: 'Mathematics', category: 'core' },
  
  // Languages
  { id: 'french', name: 'French', category: 'language' },
  { id: 'german', name: 'German', category: 'language' },
  { id: 'spanish', name: 'Spanish', category: 'language' },
  { id: 'italian', name: 'Italian', category: 'language' },
  { id: 'japanese', name: 'Japanese', category: 'language' },
  { id: 'latin', name: 'Latin', category: 'language' },
  
  // Sciences
  { id: 'biology', name: 'Biology', category: 'science' },
  { id: 'chemistry', name: 'Chemistry', category: 'science' },
  { id: 'physics', name: 'Physics', category: 'science' },
  { id: 'agricultural-science', name: 'Agricultural Science', category: 'science' },
  { id: 'applied-maths', name: 'Applied Mathematics', category: 'science' },
  
  // Humanities
  { id: 'history', name: 'History', category: 'humanities' },
  { id: 'geography', name: 'Geography', category: 'humanities' },
  { id: 'economics', name: 'Economics', category: 'humanities' },
  { id: 'politics', name: 'Politics & Society', category: 'humanities' },
  { id: 'classical-studies', name: 'Classical Studies', category: 'humanities' },
  { id: 'religious-education', name: 'Religious Education', category: 'humanities' },
  
  // Business
  { id: 'business', name: 'Business', category: 'business' },
  { id: 'accounting', name: 'Accounting', category: 'business' },
  
  // Practical
  { id: 'art', name: 'Art', category: 'practical' },
  { id: 'music', name: 'Music', category: 'practical' },
  { id: 'pe', name: 'Physical Education', category: 'practical' },
  { id: 'home-economics', name: 'Home Economics', category: 'practical' },
  { id: 'construction', name: 'Construction Studies', category: 'practical' },
  { id: 'dcg', name: 'Design & Communication Graphics', category: 'practical' },
  { id: 'engineering', name: 'Engineering', category: 'practical' },
  { id: 'technology', name: 'Technology', category: 'practical' }
]