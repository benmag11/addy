'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export default function AuthCodeErrorPage() {
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Extract error information from URL parameters
    const errorParam = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')
    
    if (errorParam) {
      setError(errorDescription || errorParam)
    } else {
      setError('Authentication failed. Please try again.')
    }
  }, [searchParams])

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
        <div className="w-full max-w-md text-center">
          {/* Error Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
            <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>

          {/* Error Message */}
          <h1 className="text-2xl font-normal text-black mb-2 font-sf-pro">
            Authentication Error
          </h1>
          <p className="text-gray-600 text-sm font-sf-pro mb-6">
            {error || 'Something went wrong during the authentication process.'}
          </p>

          {/* Action Buttons */}
          <div className="space-y-4">
            <Link 
              href="/signup"
              className="w-full inline-flex justify-center items-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white font-sf-pro transition-colors"
              style={{ backgroundColor: '#0275DE' }}
            >
              Try Again
            </Link>
            
            <Link 
              href="/login"
              className="w-full inline-flex justify-center items-center px-4 py-3 border border-gray-200 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 font-sf-pro transition-colors"
            >
              Sign In Instead
            </Link>
          </div>

          {/* Help Text */}
          <p className="text-xs text-gray-500 mt-6 font-sf-pro">
            If you continue to experience issues, please try:
          </p>
          <ul className="text-xs text-gray-500 mt-2 font-sf-pro text-left">
            <li>• Clearing your browser cache and cookies</li>
            <li>• Trying a different browser</li>
            <li>• Checking your internet connection</li>
          </ul>
        </div>
      </div>
    </div>
  )
}