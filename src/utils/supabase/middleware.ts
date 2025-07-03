import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Public paths that don't require authentication
  const publicPaths = ['/login', '/signup', '/auth', '/']
  const isPublicPath = publicPaths.some(path => request.nextUrl.pathname.startsWith(path))

  if (!user && !isPublicPath) {
    // no user, redirect to signup
    const url = request.nextUrl.clone()
    url.pathname = '/signup'
    return NextResponse.redirect(url)
  }

  // If user is authenticated, check onboarding status
  if (user) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('onboarding_completed, onboarding_step, full_name, year, subjects')
      .eq('user_id', user.id)
      .single()
    
    const isOnboardingPath = request.nextUrl.pathname.startsWith('/onboarding')
    const isCompletedPath = ['/welcome', '/dashboard'].some(path => 
      request.nextUrl.pathname.startsWith(path)
    )
    
    if (profile) {
      // Determine actual onboarding step based on data
      let currentStep = profile.onboarding_step || 'name'
      if (!profile.full_name) currentStep = 'name'
      else if (!profile.year) currentStep = 'year'
      else if (!profile.subjects || profile.subjects.length === 0) currentStep = 'subjects'
      else if (profile.onboarding_completed) currentStep = 'completed'
      
      // If not completed and not on onboarding path, redirect to appropriate step
      if (!profile.onboarding_completed && currentStep !== 'completed' && !isOnboardingPath && !isPublicPath) {
        const stepMap: Record<string, string> = {
          'name': '/onboarding/name',
          'year': '/onboarding/year',
          'subjects': '/onboarding/subjects'
        }
        const url = request.nextUrl.clone()
        url.pathname = stepMap[currentStep] || '/onboarding/name'
        return NextResponse.redirect(url)
      }
      
      // If completed and trying to access onboarding, redirect to welcome
      if (profile.onboarding_completed && isOnboardingPath) {
        const url = request.nextUrl.clone()
        url.pathname = '/welcome'
        return NextResponse.redirect(url)
      }
    } else {
      // No profile exists, create one by redirecting to name step
      if (!isOnboardingPath && !isPublicPath) {
        const url = request.nextUrl.clone()
        url.pathname = '/onboarding/name'
        return NextResponse.redirect(url)
      }
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}