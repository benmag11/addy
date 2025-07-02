import Image from 'next/image'
import Link from 'next/link'
import { IMAGES, IMAGE_DIMENSIONS, ROUTES } from '@/constants'

interface HeaderLogoProps {
  className?: string
}

export default function HeaderLogo({ className = '' }: HeaderLogoProps) {
  return (
    <header className={`w-full py-4 px-6 ${className}`}>
      <Link href={ROUTES.HOME}>
        <Image 
          src={IMAGES.LOGO}
          alt="addy" 
          width={IMAGE_DIMENSIONS.LOGO.HEADER.width}
          height={IMAGE_DIMENSIONS.LOGO.HEADER.height}
          className="h-12 w-auto"
        />
      </Link>
    </header>
  )
}