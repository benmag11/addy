import Image from 'next/image'
import Link from 'next/link'
import HeaderLogo from '@/components/ui/HeaderLogo'
import { IMAGES, IMAGE_DIMENSIONS, ROUTES } from '@/constants'

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header with Logo */}
      <HeaderLogo />

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          {/* Character Image */}
          <div className="mb-8">
            <Image 
              src={IMAGES.CHARACTER} 
              alt="Character reading a book" 
              width={IMAGE_DIMENSIONS.CHARACTER.WELCOME.width} 
              height={IMAGE_DIMENSIONS.CHARACTER.WELCOME.height}
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
            href={ROUTES.HOME}
            className="inline-block bg-addy-blue text-white px-8 py-3 rounded-lg transition-colors font-sf-pro font-medium text-base hover:opacity-90"
          >
            Get Started
          </Link>
        </div>
      </div>
    </div>
  )
}