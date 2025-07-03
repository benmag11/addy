import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { getOnboardingStep, getOnboardingUrl } from '@/lib/user-profile'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = createClient()
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.user) {
      // Get user's onboarding status
      const step = await getOnboardingStep(data.user.id)
      
      // Get the appropriate redirect URL based on onboarding progress
      const redirectUrl = getOnboardingUrl(step)
      
      // Use the 'next' param if provided, otherwise use the onboarding URL
      const next = searchParams.get('next') ?? redirectUrl
      
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
