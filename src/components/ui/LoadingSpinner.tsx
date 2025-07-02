interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  message?: string
  className?: string
}

export default function LoadingSpinner({ 
  size = 'md', 
  message = 'Loading...',
  className = ''
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }

  return (
    <div className={`text-center ${className}`}>
      <div className={`animate-spin rounded-full border-b-2 border-blue-500 mx-auto ${sizeClasses[size]}`}></div>
      {message && (
        <p className="text-gray-500 mt-2 font-sf-pro text-sm">{message}</p>
      )}
    </div>
  )
}