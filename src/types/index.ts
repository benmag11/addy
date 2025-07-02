// Authentication Types
export interface User {
  id: string
  email?: string
  email_confirmed_at?: string
  phone?: string
  confirmed_at?: string
  last_sign_in_at?: string
  app_metadata: AppMetadata
  user_metadata: UserMetadata
  identities?: Identity[]
  created_at?: string
  updated_at?: string
}

export interface AppMetadata {
  provider?: string
  providers?: string[]
  [key: string]: unknown
}

export interface UserMetadata {
  email?: string
  email_verified?: boolean
  name?: string
  onboarding?: OnboardingData
  [key: string]: unknown
}

export interface Identity {
  id: string
  user_id: string
  identity_data?: Record<string, unknown>
  provider: string
  last_sign_in_at?: string
  created_at?: string
  updated_at?: string
}

export interface OnboardingData {
  name?: string
  year?: YearOption
  subjects?: SelectedSubject[]
  step: 'name' | 'year' | 'subjects' | 'unknown'
  completed: boolean
  updated_at?: string
  completed_at?: string
}

// Authentication Forms
export interface SignUpData {
  email: string
  password: string
}

export interface VerifyData {
  email: string
  token: string
}

export interface AuthError {
  message: string
  code?: string
}

export interface AuthResult<T = User> {
  success: boolean
  data?: T
  error?: AuthError
  needsEmailVerification?: boolean
}

// Validation Types
export interface ValidationResult {
  valid: boolean
  message?: string
}

// Educational Types
export type YearOption = '1st year' | '2nd year' | '3rd year' | '4th year' | '5th year' | '6th year'

export type SubjectLevel = 'higher' | 'ordinary'

export type SubjectCategory = 'core' | 'language' | 'science' | 'humanities' | 'practical' | 'business'

export interface Subject {
  id: string
  name: string
  category: SubjectCategory
}

export interface SelectedSubject {
  subject: Subject
  level: SubjectLevel
}

// Component Props Types
export interface SubjectCardProps {
  subject: Subject
  isSelected: boolean
  selectedLevel?: SubjectLevel
  onSelect: (subject: Subject, level: SubjectLevel) => void
  onDeselect: (subjectId: string) => void
  className?: string
}

export interface OnboardingCardProps {
  title: string
  description: string
  icon: React.ReactNode
  selected: boolean
  onClick: () => void
  className?: string
}

export interface SelectedSubjectsSidebarProps {
  selectedSubjects: SelectedSubject[]
  onRemoveSubject: (subjectId: string) => void
  onContinue: () => void
  loading: boolean
  className?: string
}

export interface SearchBarProps {
  onSearch: (term: string) => void
  placeholder?: string
  className?: string
}

export interface ProgressIndicatorProps {
  currentStep: 'name' | 'year' | 'subjects'
  className?: string
}

// Form Event Types
export type FormEvent = React.FormEvent<HTMLFormElement>
export type ChangeEvent = React.ChangeEvent<HTMLInputElement>
export type MouseEvent = React.MouseEvent<HTMLButtonElement>

// Supabase Response Types
export interface SupabaseAuthResponse {
  data: {
    user: User | null
    session?: Session | null
  }
  error: AuthError | null
}

export interface Session {
  access_token: string
  refresh_token: string
  expires_at?: number
  expires_in?: number
  token_type: string
  user: User
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    message: string
    code?: string
  }
}

// Page Props Types
export interface PageProps {
  params: Record<string, string>
  searchParams: Record<string, string | string[] | undefined>
}

// Layout Props Types
export interface LayoutProps {
  children: React.ReactNode
}

// Error Page Props
export interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}