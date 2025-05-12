import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { TradeBikesLogo } from '@/components/logo';
import { Button } from '@/components/ui/button';

// Simplified header for now - without auth dependencies
export default function Header() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Temporarily disable auth
  const user = null;

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Navigation */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/">
                <div className="flex items-center cursor-pointer">
                  <TradeBikesLogo className="h-10 w-auto" />
                  <span className="ml-2 text-xl font-bold text-gray-900">TradeBikes</span>
                </div>
              </Link>
            </div>
          </div>

          {/* Sign In Button */}
          <div className="flex items-center">
            <Link href="/auth">
              <Button size="sm">Sign In</Button>
            </Link>
            
            {/* Mobile menu button */}
            <div className="ml-4 md:hidden flex items-center">
              <button
                type="button"
                className="bg-white rounded-md p-2 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <span className="sr-only">Open menu</span>
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu - simplified */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="pt-2 pb-3 space-y-1">
            <Link href="/">
              <a className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:bg-gray-100">
                Home
              </a>
            </Link>
            <Link href="/auth">
              <a className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:bg-gray-100">
                Sign In
              </a>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
