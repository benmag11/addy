import Header from "@/components/Header";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <Header />
      
      {/* Mobile Layout */}
      <div className="block md:hidden px-6 py-6">
        <div className="flex flex-col items-center text-center">
          <div className="mb-6">
            <Image 
              src="/character.png" 
              alt="Character reading a book" 
              width={280} 
              height={280}
              className="w-56 h-auto"
            />
          </div>
          <div className="space-y-3">
            <h1 className="text-2xl md:text-3xl font-normal text-black font-sf-pro leading-tight">
              The leaving cert is hard.
            </h1>
            <h2 className="text-2xl md:text-3xl font-normal text-black font-sf-pro leading-tight">
              Addy might be able to help.
            </h2>
            <p className="text-gray-400 text-base font-sf-pro mt-2">
              (It definitely can.)
            </p>
          </div>
          <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
            <Link href="/signup">
              <button 
                className="text-white px-6 py-3 rounded-lg transition-colors font-sf-pro font-medium w-44 text-base"
                style={{ backgroundColor: '#0275DE' }}
              >
                Sign up
              </button>
            </Link>
            <a 
              href="#" 
              className="px-6 py-3 rounded-lg transition-colors font-sf-pro text-blue-600 hover:text-blue-700 text-base"
              style={{ backgroundColor: '#F2F9FF' }}
            >
              More about addy
            </a>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block">
        <div className="max-w-7xl mx-auto px-12 py-12">
          <div className="grid grid-cols-2 gap-12 lg:gap-16 items-center min-h-[480px]">
            <div className="space-y-5">
              <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-normal text-black leading-tight font-sf-pro whitespace-nowrap">
                The leaving cert is hard.
              </h1>
              <h2 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-normal text-black leading-tight font-sf-pro whitespace-nowrap">
                Addy might be able to help.
              </h2>
              <p className="text-gray-400 text-lg lg:text-xl font-sf-pro mt-3">
                (It definitely can.)
              </p>
              <div className="flex items-center gap-4 pt-6">
                <Link href="/signup">
                  <button 
                    className="text-white px-7 py-3.5 rounded-lg transition-colors text-base lg:text-lg font-sf-pro font-medium w-44 lg:w-48"
                    style={{ backgroundColor: '#0275DE' }}
                  >
                    Sign up
                  </button>
                </Link>
                <a 
                  href="#" 
                  className="px-6 py-3 rounded-lg transition-colors text-base lg:text-lg font-sf-pro text-blue-600 hover:text-blue-700"
                  style={{ backgroundColor: '#F2F9FF' }}
                >
                  More about addy
                </a>
              </div>
            </div>
            <div className="flex justify-center items-center">
              <Image 
                src="/character.png" 
                alt="Character reading a book" 
                width={380} 
                height={380}
                className="w-80 lg:w-88 xl:w-96 h-auto"
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}