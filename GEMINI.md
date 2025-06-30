# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Addy is a modern authentication application with landing page UI, built with Next.js 14, TypeScript, and Tailwind CSS. Features include email/password signup, Google OAuth, email verification with countdown timers, and SSR-compatible session management. The responsive design includes a character illustration and clean, minimal UI focused on "leaving cert" education.

## Essential Commands

### Development
- `npm run dev` - Start development server (auto-detects available port)
- `npm run build` - Build for production
- `npm run lint` - Run ESLint

### Testing (Puppeteer-based)
- `npm run visual-test` - Screenshot testing at multiple breakpoints
- `npm run test-wrapping` - Test for text wrapping issues
- `npm run auto-improve` - Automated visual improvement iterations
- `node scripts/puppeteer/test-google-oauth.js` - Test OAuth flow end-to-end

## Architecture

### Application Structure
- **Landing Page** (`src/app/page.tsx`): Responsive dual-layout with character illustration
- **Authentication Flow** (`src/app/signup/page.tsx`): Email/password + Google OAuth
- **Welcome Page** (`src/app/welcome/page.tsx`): Post-authentication success state
- **Auth Callback** (`src/app/auth/callback/route.ts`): OAuth redirect handling

### Supabase SSR Architecture
- `src/utils/supabase/client.ts` - Browser-side Supabase client
- `src/utils/supabase/server.ts` - Server-side Supabase client  
- `src/utils/supabase/middleware.ts` - Session management utilities
- `middleware.ts` - Next.js middleware for auth state and redirects
- `src/lib/auth.ts` - Authentication functions and error handling

### Design System
- **Typography**: SF Pro font family, normal weight (not bold)
- **Colors**: Primary blue `#0275DE`, light blue background `#F2F9FF`
- **Responsive**: Mobile-first with 768px breakpoint for dual-layout
- **Constraints**: Headlines use `whitespace-nowrap` at 1024px+ to prevent wrapping

## Authentication Setup

### Environment Variables
Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key  
NEXT_PUBLIC_SITE_URL=http://localhost:3005
```

### Google OAuth Configuration
1. **Supabase Dashboard**: Authentication > Providers > Enable Google
2. **Google Cloud Console**: Create OAuth 2.0 credentials
3. **Redirect URI**: `https://your-supabase-url.supabase.co/auth/v1/callback`
4. **Test**: Run `node scripts/puppeteer/test-google-oauth.js`

### Authentication Features
- **Email/Password**: Verification workflow with 60-second countdown timer
- **Google OAuth**: One-click sign-up with automatic account linking
- **Session Management**: SSR-compatible with automatic token refresh
- **Error Handling**: Comprehensive error states for all auth scenarios
- **Account Conflicts**: Automatic linking when same email used across methods

## Testing Strategy

### Visual Testing
- **Screenshots**: `npm run visual-test` captures 4 breakpoints (375px, 768px, 1024px, 1440px)
- **Text Wrapping**: `npm run test-wrapping` ensures headlines don't wrap inappropriately
- **Auto-improvement**: `npm run auto-improve` detects and suggests visual fixes

### Authentication Testing  
- **OAuth Flow**: `node scripts/puppeteer/test-google-oauth.js` tests complete Google sign-up
- **Email Verification**: Multiple test scripts validate countdown timer and resend functionality
- **Error Scenarios**: Test cancellation, invalid codes, network failures

### Development Notes
- **Logo Sizing**: Critical - test across multiple screen sizes before changes
- **Port Flexibility**: Dev server auto-detects available ports (3000-3005+)
- **Visual Regression**: Always run visual tests after UI changes
- **Auth Flow**: Test both email/password and OAuth paths after auth changes
