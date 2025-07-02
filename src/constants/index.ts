// Application Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  WELCOME: '/welcome',
  ONBOARDING: {
    NAME: '/onboarding/name',
    YEAR: '/onboarding/year',
    SUBJECTS: '/onboarding/subjects'
  },
  AUTH: {
    CALLBACK: '/auth/callback',
    ERROR: '/auth/auth-code-error'
  }
} as const

// Color Constants
export const COLORS = {
  PRIMARY_BLUE: '#0275DE',
  LIGHT_BLUE_BG: '#F2F9FF',
  TEXT_BLACK: '#000000',
  TEXT_GRAY_400: 'rgb(156 163 175)',
  TEXT_GRAY_500: 'rgb(107 114 128)',
  TEXT_GRAY_600: 'rgb(75 85 99)',
  TEXT_GRAY_700: 'rgb(55 65 81)',
  ERROR_RED: 'rgb(239 68 68)',
  SUCCESS_GREEN: 'rgb(34 197 94)',
  HOVER_GRAY: 'rgb(249 250 251)',
  BORDER_GRAY: 'rgb(229 231 235)'
} as const

// Animation Durations
export const ANIMATIONS = {
  TRANSITION_DURATION: '200ms',
  COUNTDOWN_INTERVAL: 1000, // 1 second
  RESEND_COOLDOWN: 60 // 60 seconds
} as const

// Form Validation
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  VERIFICATION_CODE_LENGTH: 6,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
} as const

// Error Messages
export const ERROR_MESSAGES = {
  AUTH_NOT_CONFIGURED: 'Authentication service not configured. Please set up Supabase environment variables.',
  INVALID_EMAIL: 'Please enter a valid email address',
  PASSWORD_TOO_SHORT: 'Password must be at least 8 characters long',
  NAME_REQUIRED: 'Please enter your name',
  NAME_TOO_SHORT: 'Name must be at least 2 characters long',
  NAME_TOO_LONG: 'Name must be less than 50 characters',
  YEAR_INVALID: 'Please select a valid year',
  VERIFICATION_CODE_INVALID: 'Please enter the 6-digit verification code',
  UNEXPECTED_ERROR: 'An unexpected error occurred. Please try again.',
  USER_ALREADY_EXISTS: 'An account with this email already exists. Please sign in instead.',
  INVALID_CREDENTIALS: 'Invalid email or password',
  TOO_MANY_REQUESTS: 'Too many requests. Please try again later.',
  OAUTH_ERROR: 'Authentication failed. Please try again.',
  ACCESS_DENIED: 'Access was denied. Please try again.'
} as const

// Success Messages
export const SUCCESS_MESSAGES = {
  VERIFICATION_SENT: 'Verification code sent!',
  ACCOUNT_CREATED: 'Your account has been created successfully.',
  ONBOARDING_COMPLETE: 'Welcome to Addy!'
} as const

// Placeholder Texts
export const PLACEHOLDERS = {
  EMAIL: 'Enter your email',
  PASSWORD: 'Enter your password',
  NAME: 'Enter your full name',
  VERIFICATION_CODE: 'Enter code',
  SEARCH_SUBJECTS: 'Search subjects...'
} as const

// Button Texts
export const BUTTON_TEXTS = {
  SIGN_UP: 'Sign up',
  SIGN_IN: 'Sign In',
  LOG_IN: 'Log In',
  CONTINUE: 'Continue',
  GET_STARTED: 'Get Started',
  RESEND_CODE: 'Resend code',
  MORE_ABOUT_ADDY: 'More about addy',
  GOOGLE_SIGN_IN: 'Continue with Google',
  LOADING: {
    SIGNING_IN: 'Signing in...',
    CREATING_ACCOUNT: 'Creating account...',
    VERIFYING: 'Verifying...',
    SAVING: 'Saving...',
    SENDING: 'Sending...'
  }
} as const

// Year Options
export const YEAR_OPTIONS = [
  { value: '1st year', description: 'Just starting your leaving certificate journey' },
  { value: '2nd year', description: 'Building your foundation knowledge' },
  { value: '3rd year', description: 'Expanding your academic horizons' },
  { value: '4th year', description: 'Preparing for senior cycle challenges' },
  { value: '5th year', description: 'Beginning your leaving certificate preparations' },
  { value: '6th year', description: 'Final year - time to excel!' }
] as const

// Image Paths
export const IMAGES = {
  LOGO: '/logo.png',
  CHARACTER: '/character.png'
} as const

// Image Dimensions
export const IMAGE_DIMENSIONS = {
  LOGO: {
    HEADER: { width: 120, height: 60 },
    DESKTOP: { width: 260, height: 130 }
  },
  CHARACTER: {
    MOBILE: { width: 280, height: 280 },
    DESKTOP: { width: 380, height: 380 },
    WELCOME: { width: 200, height: 200 }
  }
} as const

// Breakpoints (matching Tailwind)
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536
} as const

// External URLs
export const EXTERNAL_URLS = {
  SUPABASE_PLACEHOLDER: 'https://placeholder.supabase.co'
} as const