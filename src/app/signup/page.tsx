'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signUpWithEmail, verifyEmail, resendVerificationEmail, signInWithGoogle, validateEmail, validatePassword, formatAuthError, type AuthError } from '@/lib/auth'

type FormStep = 'signup' | 'verify'

export default function SignUpPage() {
  const router = useRouter()
  const [step, setStep] = useState<FormStep>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resendCountdown, setResendCountdown] = useState(0)
  const [canResend, setCanResend] = useState(false)
  const [timerInitialized, setTimerInitialized] = useState(false)

  // Check for OAuth errors in URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const oauthError = urlParams.get('error')
    
    if (oauthError) {
      console.error('OAuth error from callback:', oauthError)
      setError(oauthError)
      
      // Clean up URL without the error parameter
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('error')
      window.history.replaceState({}, '', newUrl.toString())
    }
  }, [])

  // Start countdown timer when verification step begins
  useEffect(() => {
    if (step === 'verify' && !timerInitialized) {
      setResendCountdown(60)
      setCanResend(false)
      setTimerInitialized(true)
    } else if (step !== 'verify') {
      // Reset timer state when leaving verification step
      setTimerInitialized(false)
      setResendCountdown(0)
      setCanResend(false)
    }
  }, [step, timerInitialized])

  // Countdown timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (resendCountdown > 0) {
      interval = setInterval(() => {
        setResendCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [resendCountdown])

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    // Validate form
    if (!validateEmail(email)) {
      setError('Please enter a valid email address')
      return
    }
    
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      setError(passwordValidation.message!)
      return
    }

    setLoading(true)

    try {
      console.log('🚀 Starting signup process for:', email)
      const result = await signUpWithEmail({ email, password })
      
      console.log('📋 Signup result:', {
        success: result.success,
        data: result.data,
        needsEmailVerification: result.needsEmailVerification,
        error: result.error
      })
      
      if (!result.success) {
        console.error('❌ Signup failed:', result.error)
        setError(formatAuthError(result.error as AuthError))
        return
      }

      console.log('✅ Signup successful, moving to verification step')
      console.log('📧 Email verification needed:', result.needsEmailVerification)
      
      // Move to verification step
      setStep('verify')
    } catch (err) {
      console.error('💥 Unexpected error during signup:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (verificationCode.length !== 6) {
      setError('Please enter the 6-digit verification code')
      return
    }

    setLoading(true)

    try {
      const result = await verifyEmail({ email, token: verificationCode })
      
      if (!result.success) {
        setError(formatAuthError(result.error as AuthError))
        return
      }

      // Redirect to success page
      router.push('/welcome')
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    if (!canResend || loading) return
    
    setError(null)
    setLoading(true)

    try {
      console.log('🔄 Attempting to resend verification email to:', email)
      const result = await resendVerificationEmail(email)
      
      console.log('📧 Resend result:', {
        success: result.success,
        error: result.error
      })
      
      if (!result.success) {
        console.error('❌ Resend failed:', result.error)
        setError(formatAuthError(result.error as AuthError))
        return
      }

      console.log('✅ Resend successful')
      // Show success message briefly
      setError('Verification code sent!')
      setTimeout(() => setError(null), 3000)
      
      // Restart countdown timer after successful resend
      setResendCountdown(60)
      setCanResend(false)
      setTimerInitialized(true)
    } catch (err) {
      console.error('💥 Unexpected error during resend:', err)
      setError('Failed to resend code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    if (loading) return
    
    setError(null)
    setLoading(true)

    try {
      console.log('🚀 Starting Google OAuth sign-in')
      const result = await signInWithGoogle()
      
      if (!result.success) {
        console.error('❌ Google OAuth failed:', result.error)
        setError(formatAuthError(result.error as AuthError))
        return
      }

      console.log('✅ Google OAuth initiated - redirecting to Google')
      // The OAuth flow will handle the redirect automatically
    } catch (err) {
      console.error('💥 Unexpected error during Google sign-in:', err)
      setError('Failed to sign in with Google. Please try again.')
      setLoading(false)
    }
  }

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
        <div className="w-full max-w-sm">
          {/* Header Text */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-normal text-black mb-2 font-sf-pro">
              Make the LC easier
            </h1>
            <p className="text-gray-500 text-sm font-sf-pro">
              Create your addy account
            </p>
          </div>

          {/* Google Sign In Button */}
          <button 
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors mb-4 font-sf-pro text-sm disabled:opacity-50"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-4 text-gray-500 font-sf-pro">OR</span>
            </div>
          </div>

          {/* Form */}
          {step === 'signup' ? (
            <form onSubmit={handleSignUp} className="space-y-4">
              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1 font-sf-pro">
                  Work email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-sf-pro text-sm"
                  placeholder="Enter your email"
                  required
                />
              </div>

              {/* Password Input */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1 font-sf-pro">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-sf-pro text-sm"
                  placeholder="Enter your password"
                  required
                />
              </div>

              {/* Error Message */}
              {error && (
                <p className="text-red-500 text-sm font-sf-pro">{error}</p>
              )}

              {/* Continue Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full text-white py-3 rounded-lg transition-colors font-sf-pro font-medium text-sm disabled:opacity-50"
                style={{ backgroundColor: '#0275DE' }}
              >
                {loading ? 'Creating account...' : 'Continue'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerification} className="space-y-4">
              {/* Verification Code Input */}
              <div>
                <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700 mb-1 font-sf-pro">
                  Verification code
                </label>
                <input
                  id="verificationCode"
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-sf-pro text-sm text-center tracking-widest"
                  placeholder="Enter code"
                  maxLength={6}
                  required
                />
                <p className="text-xs text-gray-500 mt-1 font-sf-pro">
                  We sent a code to {email}
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <p className={`text-sm font-sf-pro ${error.includes('sent') ? 'text-green-600' : 'text-red-500'}`}>
                  {error}
                </p>
              )}

              {/* Continue Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full text-white py-3 rounded-lg transition-colors font-sf-pro font-medium text-sm disabled:opacity-50"
                style={{ backgroundColor: '#0275DE' }}
              >
                {loading ? 'Verifying...' : 'Continue'}
              </button>

              {/* Resend Code */}
              <button
                type="button"
                onClick={handleResendCode}
                disabled={!canResend || loading}
                className={`w-full transition-colors font-sf-pro text-sm py-2 ${
                  canResend && !loading 
                    ? 'text-blue-600 hover:text-blue-800' 
                    : 'text-gray-400 cursor-not-allowed'
                }`}
              >
                {loading ? 'Sending...' : canResend ? 'Resend code' : `Resend in ${resendCountdown}s`}
              </button>
            </form>
          )}

          {/* Terms */}
          <p className="text-xs text-gray-500 mt-6 text-center font-sf-pro">
            By continuing, you acknowledge that you understand and agree to the{' '}
            <Link href="#" className="text-blue-600 hover:underline">
              Terms & Conditions
            </Link>{' '}
            and{' '}
            <Link href="#" className="text-blue-600 hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}