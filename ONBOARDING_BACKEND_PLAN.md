# Comprehensive Backend Onboarding Implementation Plan

## Overview
This plan outlines the implementation of a secure, persistent onboarding system using Supabase and the provided `user_profiles` table. The system will track progress, handle returning users, and properly manage Google OAuth flows.

## Current State Analysis

### Issues with Current Implementation:
1. **Data stored in auth metadata**: Currently using `supabase.auth.updateUser()` to store onboarding data in user metadata - this is not ideal for complex data
2. **No persistence in database**: Data is only in auth metadata, not in the `user_profiles` table
3. **No progress tracking**: No way to resume onboarding if user leaves
4. **Google OAuth redirect**: Always goes to `/onboarding/name` regardless of user state

## Implementation Plan

### 1. Database Schema Enhancements

```sql
-- Add onboarding_step column to track progress
ALTER TABLE public.user_profiles 
ADD COLUMN onboarding_step text DEFAULT 'name';

-- Add check constraint for valid steps
ALTER TABLE public.user_profiles 
ADD CONSTRAINT valid_onboarding_step 
CHECK (onboarding_step IN ('name', 'year', 'subjects', 'completed'));

-- Create RLS policies
-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can only read their own profile
CREATE POLICY "Users can read own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- System can insert profiles on user creation
CREATE POLICY "Enable insert for authentication" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### 2. Trigger for Auto-Profile Creation

```sql
-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id)
  VALUES (new.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 3. Updated Auth Flow

#### A. File: `/src/lib/user-profile.ts` (NEW)
```typescript
// Functions for managing user profiles
export async function getUserProfile(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()
  
  return { data, error }
}

export async function updateUserProfile(userId: string, updates: Partial<UserProfile>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('user_profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .select()
    .single()
  
  return { data, error }
}

export async function getOnboardingStep(userId: string): Promise<OnboardingStep> {
  const { data } = await getUserProfile(userId)
  
  if (!data) return 'name'
  if (data.onboarding_completed) return 'completed'
  
  // Determine next step based on what's filled
  if (!data.full_name) return 'name'
  if (!data.year) return 'year'
  if (!data.subjects || data.subjects.length === 0) return 'subjects'
  
  return 'completed'
}
```

#### B. Update: `/src/lib/auth.ts`
```typescript
// Replace saveOnboardingStep function
export async function saveOnboardingStep(userId: string, data: OnboardingData) {
  const updates: Partial<UserProfile> = {}
  
  if (data.name) {
    updates.full_name = data.name
    updates.onboarding_step = 'year'
  }
  
  if (data.year) {
    updates.year = data.year
    updates.onboarding_step = 'subjects'
  }
  
  if (data.subjects) {
    // Convert SelectedSubject[] to string[] format for storage
    updates.subjects = data.subjects.map(s => `${s.subject.id}:${s.level}`)
    updates.onboarding_step = 'completed'
    updates.onboarding_completed = true
  }
  
  return updateUserProfile(userId, updates)
}
```

#### C. Update: `/src/app/auth/callback/route.ts`
```typescript
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  if (code) {
    const supabase = createClient()
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.user) {
      // Get user's onboarding status
      const step = await getOnboardingStep(data.user.id)
      
      // Redirect based on onboarding progress
      const redirectMap = {
        'name': '/onboarding/name',
        'year': '/onboarding/year',
        'subjects': '/onboarding/subjects',
        'completed': '/welcome'
      }
      
      const next = searchParams.get('next') ?? redirectMap[step]
      return NextResponse.redirect(`${origin}${next}`)
    }
  }
  
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
```

#### D. Update: `/src/utils/supabase/middleware.ts`
```typescript
// Add onboarding check
const { data: { user } } = await supabase.auth.getUser()

if (user) {
  // Check if user needs onboarding
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('onboarding_completed, onboarding_step')
    .eq('user_id', user.id)
    .single()
  
  const isOnboardingPath = request.nextUrl.pathname.startsWith('/onboarding')
  const isCompletedPath = ['/welcome', '/dashboard'].includes(request.nextUrl.pathname)
  
  if (profile && !profile.onboarding_completed && !isOnboardingPath) {
    // Redirect to appropriate onboarding step
    const stepMap = {
      'name': '/onboarding/name',
      'year': '/onboarding/year',
      'subjects': '/onboarding/subjects'
    }
    const url = request.nextUrl.clone()
    url.pathname = stepMap[profile.onboarding_step] || '/onboarding/name'
    return NextResponse.redirect(url)
  }
  
  if (profile?.onboarding_completed && isOnboardingPath) {
    // Already completed, redirect to welcome
    const url = request.nextUrl.clone()
    url.pathname = '/welcome'
    return NextResponse.redirect(url)
  }
}
```

### 4. Security Considerations

1. **RLS Policies**: Ensure users can only access/modify their own data
2. **Input Validation**: Validate all inputs before database storage
3. **SQL Injection**: Use parameterized queries (Supabase handles this)
4. **Rate Limiting**: Implement rate limiting on profile updates
5. **Data Sanitization**: Sanitize name input to prevent XSS

### 5. Data Migration for Existing Users

```sql
-- Migrate existing metadata to user_profiles
UPDATE user_profiles p
SET 
  full_name = (u.raw_user_meta_data->>'onboarding'->>'name')::text,
  year = (u.raw_user_meta_data->>'onboarding'->>'year')::text,
  subjects = ARRAY(
    SELECT jsonb_array_elements_text(
      u.raw_user_meta_data->'onboarding'->'subjects'
    )
  ),
  onboarding_completed = COALESCE(
    (u.raw_user_meta_data->>'onboarding'->>'completed')::boolean, 
    false
  )
FROM auth.users u
WHERE p.user_id = u.id
  AND u.raw_user_meta_data ? 'onboarding';
```

### 6. Testing Checklist

- [ ] New user signup creates profile automatically
- [ ] Google OAuth respects onboarding status
- [ ] Progress persists across sessions
- [ ] Can't skip onboarding steps
- [ ] Can't access onboarding after completion
- [ ] RLS policies work correctly
- [ ] Data validates properly
- [ ] Subjects store/retrieve correctly

### 7. Implementation Order

1. Create database migrations
2. Implement user-profile.ts functions
3. Update auth.ts to use database
4. Update auth callback for smart redirects
5. Update middleware for onboarding enforcement
6. Update onboarding pages to use new functions
7. Test all flows thoroughly
8. Migrate existing user data

### 8. Benefits

1. **Persistent Progress**: Users can leave and return
2. **Smart Redirects**: Google OAuth users go to correct step
3. **Data Integrity**: Database constraints ensure valid data
4. **Security**: RLS policies protect user data
5. **Scalability**: Proper database design for future features

This implementation provides a robust, secure onboarding system that handles all edge cases while maintaining excellent user experience.