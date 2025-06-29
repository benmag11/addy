# Addy - Modern Landing Page

A modern, responsive landing page built with Next.js 14, TypeScript, Tailwind CSS, and shadcn/ui components.

## Features

- ⚡ Next.js 14 with App Router
- 🎨 Modern UI with shadcn/ui components
- 📱 Fully responsive design
- 🚀 Optimized for performance
- 🔒 Ready for Supabase integration
- 💻 TypeScript for type safety

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Tech Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui
- **Database**: Supabase (ready for integration)
- **Deployment**: Vercel (recommended)

## Project Structure

```
src/
├── app/                 # Next.js app router pages
├── components/          # Reusable components
│   ├── ui/             # shadcn/ui components
│   ├── Header.tsx      # Navigation header
│   ├── Hero.tsx        # Hero section
│   ├── Features.tsx    # Features showcase
│   ├── CTA.tsx         # Call-to-action section
│   └── Footer.tsx      # Site footer
└── lib/                # Utility functions
    ├── utils.ts        # General utilities
    └── supabase.ts     # Supabase client
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint