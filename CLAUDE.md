# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Addy is a modern landing page built with Next.js 14, TypeScript, and Tailwind CSS. The project focuses on a single-page application with a clean, responsive design featuring a character illustration and minimal text content about "leaving cert" education.

## Essential Commands

### Development
- `npm run dev` - Start development server (http://localhost:3000)
- `npm run build` - Build for production
- `npm run lint` - Run ESLint

### Visual Testing (Puppeteer-based)
- `npm run visual-test` - Take screenshots at multiple breakpoints and compare with targets
- `npm run test-wrapping` - Test for text wrapping issues at critical screen sizes
- `npm run auto-improve` - Run automated visual improvement iterations

## Architecture

### Page Structure
The application uses a single-page layout with responsive design patterns:
- **Mobile Layout**: Vertical stack with character image at top, followed by text and buttons
- **Desktop Layout**: Two-column grid with text content on left, character image on right

### Key Design Constraints
- Headlines must not wrap at screen widths 1024px+ (enforced with `whitespace-nowrap`)
- Logo sizing is critical and has been iteratively adjusted through user feedback
- "More about addy" uses light blue background (#F2F9FF) while maintaining link behavior
- Typography uses SF Pro font family with specific weight requirements (normal, not bold)

### Component Architecture
- `src/app/page.tsx` - Main landing page with dual mobile/desktop layouts
- `src/components/Header.tsx` - Navigation header with logo and auth buttons
- `src/lib/supabase.ts` - Database client configuration (ready for integration)

### Visual Testing Infrastructure
The project includes a comprehensive Puppeteer-based testing system:

**Screenshot Generation**: Captures images at 4 breakpoints (375px, 768px, 1024px, 1440px) for visual regression testing.

**Text Wrapping Detection**: Automated testing to ensure headlines remain single-line across all screen sizes.

**Iterative Improvement**: Scripts can automatically detect visual differences and suggest/apply improvements.

**File Structure**:
- `scripts/puppeteer/visual-comparison.js` - Core screenshot and comparison logic
- `scripts/puppeteer/text-wrap-test.js` - Specific testing for text wrapping issues
- `screenshots/` - Generated current screenshots
- `target-screenshots/` - Reference images for comparison
- `diff-screenshots/` - Visual difference outputs

## Development Considerations

### Responsive Design
The layout uses a mobile-first approach with specific breakpoints:
- Mobile: `block md:hidden` 
- Desktop: `hidden md:block`
- Critical breakpoint at 768px where layout switches from stacked to side-by-side

### Font and Typography
- All text uses `font-sf-pro` class with SF Pro font family
- Headlines use `font-normal` (not bold) weight
- Specific text sizing prevents wrapping: `text-3xl md:text-4xl lg:text-5xl xl:text-6xl`

### Color Specifications
- Primary blue button: `#0275DE`
- "More about addy" background: `#F2F9FF`
- Character image and logo are PNG files with transparent backgrounds

### Supabase Integration
The project is configured for Supabase but requires environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Copy `.env.local.example` to `.env.local` and configure before using database features.

## Testing Strategy

When making visual changes, always run `npm run visual-test` to capture screenshots and `npm run test-wrapping` to validate text layout behavior. The automated testing system helps maintain design consistency across responsive breakpoints.
