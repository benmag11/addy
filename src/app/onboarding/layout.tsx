'use client'

import { usePathname } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import ProgressIndicator from '@/components/onboarding/ProgressIndicator'

interface OnboardingLayoutProps {
  children: React.ReactNode
}

const ONBOARDING_STEPS = [
  { path: '/onboarding/name', name: 'Name' },
  { path: '/onboarding/year', name: 'Year' },
  { path: '/onboarding/subjects', name: 'Subjects' }
]

export default function OnboardingLayout({ children }: OnboardingLayoutProps) {
  const pathname = usePathname()
  
  // Determine current step based on pathname
  const currentStepIndex = ONBOARDING_STEPS.findIndex(step => step.path === pathname)
  const currentStep = currentStepIndex >= 0 ? currentStepIndex + 1 : 1
  const stepNames = ONBOARDING_STEPS.map(step => step.name)

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header with Logo */}
      <header className="w-full py-4 px-6">
        <Link href="/">
          <Image 
            src="/logo.png" 
            alt="addy" 
            width={120} 
            height={60}
            className="h-12 w-auto"
          />
        </Link>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <div className={`w-full ${pathname === '/onboarding/subjects' ? 'max-w-6xl' : 'max-w-md'}`}>
          {/* Progress Indicator */}
          <ProgressIndicator 
            currentStep={currentStep}
            totalSteps={ONBOARDING_STEPS.length}
            stepNames={stepNames}
          />
          
          {/* Page Content */}
          {children}
        </div>
      </div>
    </div>
  )
}