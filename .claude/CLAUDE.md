# Overview

- Addy is a web app for Leaving Cert students to study exam paper questions by topic.

- Students select a subject and the level (higher or ordinary or foundation), and then are able to filter exam paper questions for that subject by topic, keyword, and by exam year.

- I already have a list of topics for each subject; there on average 20 topics per subject.

- There is a sidebar on the left hand side of the page containing these filter options.
The right hand Side of the page contains the questions along with the marking scheme. 

- Both the question and the associated marking scheme are stored as images, and the marking scheme should be toggleable.



## Code Quality Standards

### TypeScript Best Practices
- **No `any` types**: Always use proper types or generics
- **Strict type safety**: Enable strict mode in tsconfig
- **Proper imports**: Group and order imports logically
- **Type exports**: Export types separately from implementations

### Code Organization
- **Single responsibility**: Each file should have one clear purpose
- **Avoid duplication**: Use centralized constants and types
- **Consistent naming**: Use descriptive, consistent naming conventions
- **Clean imports**: Remove unused imports and exports

### Error Handling
- **No console.error in production**: Use proper error tracking service
- **User-friendly messages**: Display clear, actionable error messages
- **Graceful fallbacks**: Always have fallback behavior for errors
- **Type-safe errors**: Use typed error objects with consistent structure

### Security Practices
- **Environment validation**: Always validate environment variables
- **Input sanitization**: Validate and sanitize all user inputs
- **Secure authentication**: Use Supabase's built-in security features
- **No exposed secrets**: Never commit sensitive data

- It is important you ALWAYS check for existing functionality before creating new files or functions to achieve a task. Very often, we can modify existing code to result in cleaner production ready code.

