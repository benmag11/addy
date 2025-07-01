interface OnboardingCardProps {
  title: string
  description?: string
  icon?: React.ReactNode
  selected?: boolean
  onClick: () => void
  className?: string
}

export default function OnboardingCard({ 
  title, 
  description, 
  icon, 
  selected = false, 
  onClick,
  className = "" 
}: OnboardingCardProps) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full p-4 rounded-lg border transition-all duration-200 text-left
        hover:border-blue-300 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
        ${selected 
          ? 'border-blue-500 bg-blue-50 shadow-sm' 
          : 'border-gray-200 bg-white hover:bg-gray-50'
        }
        ${className}
      `}
    >
      <div className="flex items-start">
        {icon && (
          <div className={`flex-shrink-0 mr-3 mt-0.5 ${selected ? 'text-blue-600' : 'text-gray-400'}`}>
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className={`text-sm font-medium font-sf-pro ${selected ? 'text-blue-900' : 'text-gray-900'}`}>
            {title}
          </h3>
          {description && (
            <p className={`text-sm mt-1 font-sf-pro ${selected ? 'text-blue-700' : 'text-gray-500'}`}>
              {description}
            </p>
          )}
        </div>
        {selected && (
          <div className="flex-shrink-0 ml-2">
            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
    </button>
  )
}