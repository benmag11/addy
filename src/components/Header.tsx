import Image from "next/image";
import Link from "next/link";

export default function Header() {
  return (
    <header className="w-full py-4 md:py-6">
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/">
            <Image 
              src="/logo.png" 
              alt="addy" 
              width={260} 
              height={130}
              className="h-18 w-auto md:h-21 lg:h-24"
            />
          </Link>
        </div>
        <div className="flex items-center space-x-3 md:space-x-4">
          <button className="text-gray-600 hover:text-gray-900 transition-colors text-sm md:text-base font-sf-pro font-medium">
            Log In
          </button>
          <Link href="/signup">
            <button className="bg-black text-white px-4 py-2 md:px-5 md:py-2.5 rounded-lg hover:bg-gray-800 transition-colors text-sm md:text-base font-sf-pro font-medium">
              Sign Up
            </button>
          </Link>
        </div>
      </div>
    </header>
  );
}