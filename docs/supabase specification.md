# Supabase Configuration Documentation

## Overview

This document contains all configuration details for the Supabase backend used in the Addy application. The setup includes authentication, user profiles, and onboarding flow management.

## Database Schema

### `user_profiles` Table

The main table for storing user profile data and tracking onboarding progress.

```sql
create table public.user_profiles (
  user_id uuid not null,
  full_name text null,
  year text null,
  subjects text[] null,
  onboarding_completed boolean not null default false,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  onboarding_step text null default 'name'::text,
  constraint user_profiles_pkey primary key (user_id),
  constraint user_profiles_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade,
  constraint valid_onboarding_step check (
    onboarding_step = any (
      array['name'::text, 'year'::text, 'subjects'::text, 'completed'::text]
    )
  )
) tablespace pg_default;
```

#### Column Descriptions

- **user_id** (uuid, PRIMARY KEY): References the user's ID from Supabase Auth
- **full_name** (text): User's full name entered during onboarding
- **year** (text): Academic year (e.g., '1st year', '2nd year', ..., '6th year')
- **subjects** (text[]): Array of selected subjects in format `"subject_id:level"` (e.g., `"mathematics:higher"`)
- **onboarding_completed** (boolean): Whether the user has completed all onboarding steps
- **created_at** (timestamp): When the profile was created
- **updated_at** (timestamp): Last update timestamp
- **onboarding_step** (text): Current onboarding step ('name', 'year', 'subjects', or 'completed')

### Triggers

```sql
create trigger handle_user_profiles_updated_at before
update on user_profiles for each row
execute function handle_updated_at();
```

This trigger automatically updates the `updated_at` timestamp whenever a row is modified.

## Row Level Security (RLS) Policies

RLS is enabled on the `user_profiles` table with the following policies:

### 1. Enable insert for authentication
- **Operation**: INSERT
- **Applied to**: public role
- **Description**: Allows authenticated users to create their own profile

### 2. Users can insert own profile
- **Operation**: INSERT
- **Applied to**: public role
- **Description**: Users can only insert a profile with their own user_id

### 3. Users can read own profile
- **Operation**: SELECT
- **Applied to**: public role
- **Description**: Users can only read their own profile data

### 4. Users can update own profile
- **Operation**: UPDATE
- **Applied to**: public role
- **Description**: Users can only update their own profile data

### 5. Users can view own profile
- **Operation**: SELECT
- **Applied to**: public role
- **Description**: Additional policy ensuring users can view their own profile

## Subject Storage Format

Subjects are stored as an array of strings in the format: `"subject_id:level"`

### Example:
```json
[
  "mathematics:higher",
  "english:ordinary",
  "irish:higher",
  "physics:ordinary"
]
```

### Subject Levels:
- `higher`: Higher level
- `ordinary`: Ordinary level

## Onboarding Flow

The onboarding process follows these steps:

1. **name**: User enters their full name
2. **year**: User selects their academic year
3. **subjects**: User selects 6-14 subjects with levels
4. **completed**: Onboarding is finished

### State Transitions:
- New users start at `onboarding_step = 'name'`
- After entering name ’ `onboarding_step = 'year'`
- After selecting year ’ `onboarding_step = 'subjects'`
- After selecting subjects ’ `onboarding_step = 'completed'` and `onboarding_completed = true`

## Authentication Configuration

### OAuth Providers
- **Google OAuth**: Enabled through Supabase dashboard
- Redirect URL: `{SUPABASE_URL}/auth/v1/callback`

### Email Authentication
- Email/password signup with verification
- OTP (One-Time Password) verification for email confirmation

## Environment Variables

Required environment variables for the application:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # or production URL
```

## User Profile Creation Flow

1. **Automatic Creation**: User profiles are created automatically via database trigger when a new user signs up
2. **Manual Creation**: If the trigger fails, the application will create the profile on first access
3. **Data Integrity**: Check constraints ensure valid onboarding steps and foreign key constraints maintain referential integrity

## Sample Data Structure

Example of a completed user profile:

```json
{
  "user_id": "a5cb66a1-cd55-4b05-8feb-c2dd3be931de",
  "full_name": "Ben",
  "year": "6th year",
  "subjects": [
    "french:higher",
    "english:higher",
    "irish:higher",
    "mathematics:higher",
    "german:higher",
    "spanish:higher"
  ],
  "onboarding_completed": true,
  "onboarding_step": "completed"
}
```

## Security Considerations

1. **Row Level Security**: Ensures users can only access their own data
2. **Foreign Key Constraints**: Profiles are automatically deleted when users are deleted (CASCADE)
3. **Check Constraints**: Validates onboarding_step values to prevent invalid states
4. **No Cross-User Access**: RLS policies prevent any user from accessing another user's profile

## Migration Files

The database schema is managed through migrations:
- `20240101000000_user_profiles_onboarding.sql`: Creates the user_profiles table with onboarding support

## API Access Patterns

All database operations go through Supabase client with automatic RLS enforcement:

```typescript
// Get user profile
const { data, error } = await supabase
  .from('user_profiles')
  .select('*')
  .eq('user_id', userId)
  .single()

// Update user profile
const { data, error } = await supabase
  .from('user_profiles')
  .update({ full_name: 'John Doe', onboarding_step: 'year' })
  .eq('user_id', userId)
```

## Notes

- The `subjects` column uses PostgreSQL array type for efficient storage
- All timestamps are stored in UTC with timezone
- The database automatically tracks creation and update times
- Profile creation is idempotent - duplicate inserts are prevented by primary key constraint