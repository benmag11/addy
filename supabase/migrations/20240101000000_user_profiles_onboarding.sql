-- === ONBOARDING PROGRESS TRACKING ===

-- This command adds a new column named 'onboarding_step' to the 'user_profiles' table.
-- It's used to keep track of where each user is in the sign-up/onboarding process.
-- 'text' means the column stores text data (e.g., 'name', 'year').
-- 'IF NOT EXISTS' prevents an error if the column has already been created.
-- 'DEFAULT 'name'' sets the starting value for all new profiles to 'name', meaning
-- every new user starts at the "Enter Name" step of the onboarding flow.
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS onboarding_step text DEFAULT 'name';

-- This adds a database rule (a "check constraint") to the 'user_profiles' table.
-- This rule, named 'valid_onboarding_step', ensures that the 'onboarding_step' column
-- can ONLY ever contain one of the four specified values. This is crucial for
-- maintaining clean data and preventing bugs from typos or invalid states.
ALTER TABLE public.user_profiles 
ADD CONSTRAINT valid_onboarding_step 
CHECK (onboarding_step IN ('name', 'year', 'subjects', 'completed'));


-- === ROW LEVEL SECURITY (RLS) ===
-- RLS is a powerful PostgreSQL feature used heavily by Supabase to control data access.
-- It allows you to define rules (called "policies") that determine which specific rows
-- a user is allowed to view, edit, or delete in a table.

-- This command "turns on" Row Level Security for the 'user_profiles' table.
-- Without this enabled, all the policies defined below would be ignored.
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- These commands are for safety and cleanup. They remove any old security policies
-- with these specific names before we create the new ones. This ensures the script
-- can be run multiple times without causing errors.
DROP POLICY IF EXISTS "Users can read own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable insert for authentication" ON public.user_profiles;

-- This creates a security rule that allows users to READ data from 'user_profiles'.
-- The 'USING' clause is the core of the rule: 'auth.uid() = user_id' means a user
-- can only read rows where their own unique authentication ID (provided by Supabase's
-- auth system via the `auth.uid()` function) matches the 'user_id' in the table.
-- In simple terms: Users can only see their own profile, not anyone else's.
CREATE POLICY "Users can read own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = user_id);

-- This is similar to the read policy, but for UPDATING data.
-- It ensures that users can only modify their own profile information.
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- This policy allows new rows to be INSERTED into the 'user_profiles' table.
-- The 'WITH CHECK' clause ensures that a user can only create a profile
-- for themselves by verifying their auth ID matches the 'user_id' being inserted.
CREATE POLICY "Enable insert for authentication" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);


-- === AUTOMATIC PROFILE CREATION ON SIGN-UP ===

-- This creates a special piece of code called a "database function". This function's
-- job is to automatically create a new entry in 'user_profiles' whenever a new user
-- signs up to the application.
-- 'RETURNS trigger' means it's designed to be executed automatically by a trigger.
-- 'SECURITY DEFINER' is a security setting that makes the function run with the
-- permissions of the database administrator, allowing it to insert rows into the table.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- This is the main logic: it inserts a new row into 'user_profiles'.
  -- It takes the ID of the newly signed-up user (available in the 'new.id' variable)
  -- and sets it as the 'user_id' for the new profile.
  INSERT INTO public.user_profiles (user_id)
  VALUES (new.id)
  -- This is a safety check. If a profile for that user ID already exists, it does nothing.
  ON CONFLICT (user_id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- First, drop the trigger if it already exists to avoid errors.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- This creates the "trigger" that connects the function above to the sign-up event.
-- 'AFTER INSERT ON auth.users' means "immediately after a new user is added to
-- Supabase's main authentication table (`auth.users`)".
-- 'FOR EACH ROW EXECUTE FUNCTION public.handle_new_user()' means "run our function".
-- In summary: When a user signs up, this trigger automatically runs the function
-- to create their corresponding profile row.
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- === DATA MIGRATION FOR EXISTING USERS ===

-- This is a one-time command to "backfill" data. It's for any users who might have
-- signed up *before* the automatic trigger was created.
-- It finds all users in the 'auth.users' table who do not have a matching
-- entry in 'user_profiles' and creates one for them.
INSERT INTO public.user_profiles (user_id)
SELECT id FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_profiles)
ON CONFLICT (user_id) DO NOTHING;

-- This is another data migration step. It's designed to move user data that might
-- have been stored in an old format (in Supabase's 'raw_user_meta_data' JSON field)
-- into the new, structured columns of the 'user_profiles' table.
UPDATE public.user_profiles p
SET 
  -- 'COALESCE' returns the first value that isn't empty. This line says:
  -- "Update the full_name with the name from the old metadata. If that doesn't exist,
  -- just keep the value that's already in the full_name column."
  -- This prevents accidentally deleting existing data.
  full_name = COALESCE(
    p.full_name, 
    (u.raw_user_meta_data->'onboarding'->>'name')::text
  ),
  -- Same logic as above, but for the 'year' column.
  year = COALESCE(
    p.year,
    (u.raw_user_meta_data->'onboarding'->>'year')::text
  ),
  -- This 'CASE' statement determines if onboarding is complete.
  -- If the profile already has a name, year, and subjects, it's marked as complete.
  -- Otherwise, it falls back to the value from the old metadata.
  onboarding_completed = CASE 
    WHEN p.full_name IS NOT NULL AND p.year IS NOT NULL AND p.subjects IS NOT NULL 
    THEN true
    ELSE COALESCE(
      (u.raw_user_meta_data->'onboarding'->>'completed')::boolean, 
      false
    )
  END,
  -- This 'CASE' statement intelligently sets the correct 'onboarding_step' based on
  -- which pieces of profile information are already filled out.
  onboarding_step = CASE
    WHEN p.onboarding_completed THEN 'completed'
    WHEN p.subjects IS NOT NULL AND array_length(p.subjects, 1) > 0 THEN 'completed'
    WHEN p.year IS NOT NULL THEN 'subjects'
    WHEN p.full_name IS NOT NULL THEN 'year'
    ELSE 'name'
  END
-- This specifies we are updating 'user_profiles' (aliased as 'p') with data from
-- 'auth.users' (aliased as 'u'), but only for users who have the old 'onboarding'
-- data in their metadata.
FROM auth.users u
WHERE p.user_id = u.id
  AND u.raw_user_meta_data ? 'onboarding';

-- Note: Subject migration would need to be handled separately as the format differs
-- The old metadata stores subjects as complex JSON objects, but the new table
-- expects a simple array of strings (e.g., ["math:higher", "english:ordinary"]).
-- This would require a more complex, separate script to convert the data correctly.
