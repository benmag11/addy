-- Add onboarding_step column to track progress
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS onboarding_step text DEFAULT 'name';

-- Add check constraint for valid steps
ALTER TABLE public.user_profiles 
ADD CONSTRAINT valid_onboarding_step 
CHECK (onboarding_step IN ('name', 'year', 'subjects', 'completed'));

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable insert for authentication" ON public.user_profiles;

-- Users can only read their own profile
CREATE POLICY "Users can read own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- System can insert profiles on user creation
CREATE POLICY "Enable insert for authentication" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

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

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create profiles for existing users who don't have one
INSERT INTO public.user_profiles (user_id)
SELECT id FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_profiles)
ON CONFLICT (user_id) DO NOTHING;

-- Migrate existing metadata to user_profiles (if any)
UPDATE public.user_profiles p
SET 
  full_name = COALESCE(
    p.full_name, 
    (u.raw_user_meta_data->'onboarding'->>'name')::text
  ),
  year = COALESCE(
    p.year,
    (u.raw_user_meta_data->'onboarding'->>'year')::text
  ),
  onboarding_completed = CASE 
    WHEN p.full_name IS NOT NULL AND p.year IS NOT NULL AND p.subjects IS NOT NULL 
    THEN true
    ELSE COALESCE(
      (u.raw_user_meta_data->'onboarding'->>'completed')::boolean, 
      false
    )
  END,
  onboarding_step = CASE
    WHEN p.onboarding_completed THEN 'completed'
    WHEN p.subjects IS NOT NULL AND array_length(p.subjects, 1) > 0 THEN 'completed'
    WHEN p.year IS NOT NULL THEN 'subjects'
    WHEN p.full_name IS NOT NULL THEN 'year'
    ELSE 'name'
  END
FROM auth.users u
WHERE p.user_id = u.id
  AND u.raw_user_meta_data ? 'onboarding';

-- Note: Subject migration would need to be handled separately as the format differs
-- The current metadata stores subjects as JSON objects, but the table expects string[]
-- This would require a more complex migration based on your specific data format