import type { ValidationResult, YearOption } from '@/types'

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' }
  }
  return { valid: true }
}

export function validateName(name: string): ValidationResult {
  const trimmedName = name.trim()
  
  if (!trimmedName) {
    return { valid: false, message: 'Please enter your name' }
  }
  
  if (trimmedName.length < 2) {
    return { valid: false, message: 'Name must be at least 2 characters long' }
  }
  
  if (trimmedName.length > 50) {
    return { valid: false, message: 'Name must be less than 50 characters' }
  }
  
  return { valid: true }
}

export function validateYear(year: YearOption): ValidationResult {
  const validYears: YearOption[] = ['1st year', '2nd year', '3rd year', '4th year', '5th year', '6th year']
  
  if (!validYears.includes(year)) {
    return { valid: false, message: 'Please select a valid year' }
  }
  
  return { valid: true }
}