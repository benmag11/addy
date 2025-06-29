import Image from 'next/image'
import Link from 'next/link'

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header with Logo */}
      <header className="w-full py-4 px-6">
        <Link href="/">
          <Image 
            src="/logo.png" 
            alt="addy" 
            width={120} 
            height={60}
            className="h-12 w-auto"
          />
        </Link>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          {/* Character Image */}
          <div className="mb-8">
            <Image 
              src="/character.png" 
              alt="Character reading a book" 
              width={200} 
              height={200}
              className="w-48 h-auto mx-auto"
            />
          </div>

          {/* Welcome Message */}
          <h1 className="text-3xl md:text-4xl font-normal text-black mb-4 font-sf-pro">
            Welcome to addy!
          </h1>
          
          <p className="text-gray-500 text-lg font-sf-pro mb-8">
            Your account has been created successfully.
          </p>

          {/* Action Button */}
          <Link 
            href="/"
            className="inline-block text-white px-8 py-3 rounded-lg transition-colors font-sf-pro font-medium text-base"
            style={{ backgroundColor: '#0275DE' }}
          >
            Get Started
          </Link>
        </div>
      </div>
    </div>
  )
}