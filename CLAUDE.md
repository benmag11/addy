# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

# IMPORTANT RULES YOU MUST FOLLOW AS AN AI AGENT
1. First think through the problem, read the codebase for relevant files, and write a plan to .claude/tasks
2. Check in with me and I will verify the plan before you begin working
3. Work on todo items, marking them as complete as you go
4. Give me a high level explanation of what changes you made at each step
5. Make every change as simple as possible - avoid massive or complex changes
6. Add a review section to the todo.md file with a summary of changes

## Project Overview

Addy is a modern authentication application with onboarding flow, built with Next.js 14, TypeScript, and Tailwind CSS. Features include email/password signup, Google OAuth, email verification, and a 3-step onboarding process for Leaving Cert students.

## Essential Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production  
- `npm run lint` - Run ESLint
- `npm run visual-test` - Screenshot testing at multiple breakpoints
- `node scripts/puppeteer/test-google-oauth.js` - Test OAuth flow

## Architecture

### Application Flow
- **Landing Page** → **Auth** → **Onboarding** (name → year → subjects) → **Welcome**
- Smart redirects based on completion status
- Database-first onboarding state management

### Key Files
- `src/app/onboarding/*` - 3-step onboarding flow
- `src/lib/auth.ts` - Authentication with database integration
- `src/lib/user-profile.ts` - Profile and onboarding management
- `src/lib/auth-helpers.ts` - Post-auth redirect logic
- `src/utils/supabase/*` - SSR-compatible Supabase clients
- `middleware.ts` - Auth state and onboarding redirects

## Setup Requirements

### Environment Variables (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key  
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Design System
- **Typography**: SF Pro, normal weight
- **Colors**: Primary blue `#0275DE`, background `#F2F9FF`
- **Responsive**: Mobile-first, 768px breakpoint
- **Subject Selection**: 6-14 subjects required, CSS Grid layoutno
## Testing Strategy

### Critical Test Scenarios
1. New user email signup → verification → onboarding
2. New user Google OAuth → onboarding detection  
3. Returning incomplete user → resume onboarding
4. Returning complete user → welcome page
5. Subject selection validation (6-14 limit)

## Security
- User enumeration protection via Supabase detection
- RLS policies for data isolation
- Built-in Supabase rate limiting and session security
- Input validation on emails, passwords, verification codes

## Current Status

### ✅ Completed
- Full authentication system (email + Google OAuth)
- 3-step onboarding with validation
- Database integration with RLS
- Smart redirects and resume capability
- Responsive subject selection UI

### ⚠️ Important Notes
- Migration required for database setup
- Subject storage uses simplified format
- All auth flows should be tested after changes
- Database connection error handling implemented