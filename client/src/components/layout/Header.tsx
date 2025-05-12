import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { TradeBikesLogo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { Bell } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

export default function Header() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Re-enable auth
  const { user, logoutMutation } = useAuth();

  // Function to get user initials for avatar
  const getInitials = () => {
    if (!user) return '';
    const names = user.companyName.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return user.companyName.substring(0, 2).toUpperCase();
  };

  // Simplified notification count - would be from API in full implementation
  const unreadCount = 0;
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };

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
                  <Link href="/create-auction">
                    <a className={`${location === '/create-auction' ? 'border-primary-light text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                      Create Auction
                    </a>
                  </Link>
                )}
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
                      <DropdownMenuLabel className="text-xs text-gray-500">
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </DropdownMenuLabel>
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
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="pt-2 pb-3 space-y-1">
            <Link href="/">
              <a className={`${location === '/' ? 'bg-primary-light text-white' : 'text-gray-600 hover:bg-gray-100'} block pl-3 pr-4 py-2 border-l-4 ${location === '/' ? 'border-primary' : 'border-transparent'} text-base font-medium`}>
                Home
              </a>
            </Link>
            
            {user ? (
              <>
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
                  <Link href="/create-auction">
                    <a className={`${location === '/create-auction' ? 'bg-primary-light text-white' : 'text-gray-600 hover:bg-gray-100'} block pl-3 pr-4 py-2 border-l-4 ${location === '/create-auction' ? 'border-primary' : 'border-transparent'} text-base font-medium`}>
                      Create Auction
                    </a>
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="block w-full text-left pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:bg-gray-100"
                >
                  Log out
                </button>
              </>
            ) : (
              <Link href="/auth">
                <a className={`${location === '/auth' ? 'bg-primary-light text-white' : 'text-gray-600 hover:bg-gray-100'} block pl-3 pr-4 py-2 border-l-4 ${location === '/auth' ? 'border-primary' : 'border-transparent'} text-base font-medium`}>
                  Sign In
                </a>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
