import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  const error = searchParams.get('error')
  const error_description = searchParams.get('error_description')

  // Handle OAuth errors (user cancelled, etc.)
  if (error) {
    console.error('OAuth Error:', { error, error_description })
    
    // Redirect to signup page with error
    const redirectUrl = new URL('/signup', origin)
    redirectUrl.searchParams.set('error', error_description || 'OAuth authentication failed')
    return NextResponse.redirect(redirectUrl)
  }

  if (code) {
    const supabase = createClient()
    
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Code exchange error:', error)
        
        // Redirect to signup with error
        const redirectUrl = new URL('/signup', origin)
        redirectUrl.searchParams.set('error', 'Failed to complete authentication')
        return NextResponse.redirect(redirectUrl)
      }

      if (data.user) {
        console.log('OAuth successful for user:', data.user.email)
        
        // Check if this is a newly created user or existing user
        const isNewUser = data.user.created_at === data.user.last_sign_in_at
        
        if (isNewUser) {
          console.log('New user created via OAuth')
        } else {
          console.log('Existing user signed in via OAuth (account may have been linked)')
        }
        
        // Successful OAuth - redirect to welcome page or intended destination
        const redirectUrl = new URL(next === '/' ? '/welcome' : next, origin)
        return NextResponse.redirect(redirectUrl)
      }
    } catch (err) {
      console.error('Unexpected OAuth error:', err)
      
      // Redirect to signup with error
      const redirectUrl = new URL('/signup', origin)
      redirectUrl.searchParams.set('error', 'An unexpected error occurred')
      return NextResponse.redirect(redirectUrl)
    }
  }

  // No code parameter - invalid callback
  console.error('OAuth callback missing code parameter')
  const redirectUrl = new URL('/signup', origin)
  redirectUrl.searchParams.set('error', 'Invalid authentication callback')
  return NextResponse.redirect(redirectUrl)
}