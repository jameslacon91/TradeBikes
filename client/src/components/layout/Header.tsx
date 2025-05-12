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
                  <TradeBikesLogo className="h-8 w-auto" />
                  <span className="ml-2 text-xl font-bold text-gray-900">TradeBikes</span>
                </div>
              </Link>
            </div>
            
            {user && (
              <nav className="hidden md:ml-6 md:flex md:space-x-8">
                <Link href="/dashboard">
                  <a className={`${location === '/dashboard' ? 'border-primary-light text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                    Dashboard
                  </a>
                </Link>
                <Link href="/auctions">
                  <a className={`${location === '/auctions' ? 'border-primary-light text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                    Auctions
                  </a>
                </Link>
                {user.role === 'dealer' && (
                  <Link href="/inventory">
                    <a className={`${location === '/inventory' ? 'border-primary-light text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                      Inventory
                    </a>
                  </Link>
                )}
                <Link href="/messages">
                  <a className={`${location === '/messages' ? 'border-primary-light text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                    Messages
                  </a>
                </Link>
              </nav>
            )}
          </div>

          {/* User Menu and Mobile Menu Button */}
          <div className="flex items-center">
            {user ? (
              <>
                {/* Notifications */}
                <div className="relative mr-3">
                  <Link href="/notifications">
                    <button type="button" className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                      <span className="sr-only">View notifications</span>
                      <Bell className="h-6 w-6" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-accent text-white rounded-full w-4 h-4 text-xs flex items-center justify-center">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </button>
                  </Link>
                </div>

                {/* User Menu */}
                <div className="ml-3 relative">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="bg-white flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                        <span className="sr-only">Open user menu</span>
                        <div className="h-8 w-8 rounded-full bg-primary-light text-white flex items-center justify-center">
                          {getInitials()}
                        </div>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>{user.companyName}</DropdownMenuLabel>
                      <DropdownMenuLabel className="text-xs text-gray-500">{user.role}</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/profile">
                          <div className="cursor-pointer">Profile</div>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/settings">
                          <div className="cursor-pointer">Settings</div>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout}>
                        Log out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </>
            ) : (
              <Link href="/auth">
                <Button size="sm">Sign In</Button>
              </Link>
            )}

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

      {/* Mobile menu */}
      {isMobileMenuOpen && user && (
        <div className="md:hidden">
          <div className="pt-2 pb-3 space-y-1">
            <Link href="/dashboard">
              <a className={`${location === '/dashboard' ? 'bg-primary-light text-white' : 'text-gray-600 hover:bg-gray-100'} block pl-3 pr-4 py-2 border-l-4 ${location === '/dashboard' ? 'border-primary' : 'border-transparent'} text-base font-medium`}>
                Dashboard
              </a>
            </Link>
            <Link href="/auctions">
              <a className={`${location === '/auctions' ? 'bg-primary-light text-white' : 'text-gray-600 hover:bg-gray-100'} block pl-3 pr-4 py-2 border-l-4 ${location === '/auctions' ? 'border-primary' : 'border-transparent'} text-base font-medium`}>
                Auctions
              </a>
            </Link>
            {user.role === 'dealer' && (
              <Link href="/inventory">
                <a className={`${location === '/inventory' ? 'bg-primary-light text-white' : 'text-gray-600 hover:bg-gray-100'} block pl-3 pr-4 py-2 border-l-4 ${location === '/inventory' ? 'border-primary' : 'border-transparent'} text-base font-medium`}>
                  Inventory
                </a>
              </Link>
            )}
            <Link href="/messages">
              <a className={`${location === '/messages' ? 'bg-primary-light text-white' : 'text-gray-600 hover:bg-gray-100'} block pl-3 pr-4 py-2 border-l-4 ${location === '/messages' ? 'border-primary' : 'border-transparent'} text-base font-medium`}>
                Messages
              </a>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
