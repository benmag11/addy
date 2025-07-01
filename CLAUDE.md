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
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Google OAuth Configuration
1. **Supabase Dashboard**: 
   - Authentication > Providers > Enable Google
   - Authentication > URL Configuration > Additional Redirect URLs: Add `http://localhost:3000/**`
2. **Google Cloud Console**: 
   - Create OAuth 2.0 credentials
   - Authorized JavaScript origins: Add `http://localhost:3000`
   - Authorized redirect URIs: Add `https://your-supabase-url.supabase.co/auth/v1/callback`
3. **Test**: Run `node scripts/puppeteer/test-google-oauth.js`

### Authentication Features
- **Email/Password**: Verification workflow with 60-second countdown timer
- **Google OAuth**: One-click sign-up with automatic account linking
- **Session Management**: SSR-compatible with automatic token refresh
- **Error Handling**: Comprehensive error states for all auth scenarios
- **Account Conflicts**: Automatic linking when same email used across methods

## Security Baseline

### Current Security Posture
As of the most recent security audit, the application implements a risk-based security approach that prioritizes fixing real vulnerabilities over adding complex defenses against hypothetical threats.

### Implemented Security Controls

#### 1. User Enumeration Protection
- **Status**: ✅ Implemented
- **Details**: Removed `/api/check-email` endpoint that allowed attackers to determine which emails have accounts
- **Method**: Uses Supabase's built-in user detection via `identities.length === 0` check in `signUpWithEmail()`
- **Files**: `src/lib/auth.ts:52-60`

#### 2. Built-in Supabase Protections
- **Authentication Rate Limiting**: Supabase provides built-in rate limiting on authentication endpoints
- **Session Security**: Automatic token refresh and secure cookie handling via SSR
- **Password Hashing**: bcrypt with random salt parameters
- **OAuth Security**: Secure redirect handling and state validation

#### 3. Browser-Level Protections
- **SameSite Cookies**: Modern browsers provide baseline CSRF protection
- **HTTPS Enforcement**: Secure cookie transmission in production
- **XSS Protection**: React's JSX provides automatic escaping

#### 4. Input Validation
- **Email Validation**: Consistent regex pattern validation (`src/lib/auth.ts:197`)
- **Password Requirements**: Minimum 8 characters (configurable via Supabase)
- **Verification Codes**: Numeric-only input filtering

### Deferred Security Controls

#### 1. Row Level Security (RLS) Policies
- **Status**: ⏳ Deferred until data model finalization
- **Rationale**: More efficient to audit and configure all policies together
- **Action Required**: Manual Supabase dashboard review before production

#### 2. Advanced Rate Limiting
- **Status**: 📊 Monitoring-based implementation
- **Current**: Relies on Supabase's built-in rate limiting
- **Future**: Will implement application-level limits if monitoring shows bypass attempts

#### 3. CSRF Protection
- **Status**: 🔍 Risk-assessed as low priority
- **Current**: Protected by SameSite cookies and modern browser defaults
- **Future**: Will implement if app adds high-risk one-click actions

### Security Monitoring Plan

#### Immediate Monitoring
- Watch for patterns of failed login attempts
- Monitor unusual traffic to authentication endpoints
- Track error rates and response times

#### Trigger Events for Security Review
- High volume of authentication failures from specific IPs
- Successful bypass of Supabase's rate limiting
- Addition of sensitive one-click actions (account deletion, data export)
- User reports of suspected account compromise

#### Future Security Enhancements
1. **Multi-Factor Authentication (MFA)** - Next major security feature
2. **Enhanced Password Policies** - Only if user feedback indicates need
3. **Application-level Rate Limiting** - Only if monitoring shows necessity
4. **CSRF Protection** - Only for high-risk state-changing actions

### Security Development Guidelines
- Always test both email/password and OAuth authentication paths
- Verify that new user data tables include appropriate RLS policies
- Maintain the principle of "fix real issues before hypothetical ones"
- Document any new authentication flows or sensitive operations

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
