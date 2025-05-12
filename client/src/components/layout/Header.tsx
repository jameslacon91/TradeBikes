import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import NotificationsPopover from '@/components/notifications/NotificationsPopover';
import { TradeBikesLogo } from '@/components/logo';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Menu, X, Home, Search, Gavel, Calendar, Map, User, Settings, LogOut } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

export default function Header() {
  const { user, logoutMutation } = useAuth();
  const [, navigate] = useLocation();
  const isMobile = useIsMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = () => setIsMenuOpen(false);

  const handleLogout = () => {
    logoutMutation.mutate();
    navigate('/auth');
  };

  // Create initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const navLinks = [
    { name: 'Home', href: '/', icon: <Home className="h-5 w-5 mr-2" /> },
    { name: 'Auctions', href: '/auctions', icon: <Gavel className="h-5 w-5 mr-2" /> },
    { name: 'Search', href: '/search', icon: <Search className="h-5 w-5 mr-2" /> },
    { name: 'Map', href: '/map', icon: <Map className="h-5 w-5 mr-2" /> },
    { name: 'Events', href: '/events', icon: <Calendar className="h-5 w-5 mr-2" /> },
    { name: 'About Us', href: '/about', icon: null },
  ];

  const authenticatedLinks = [
    ...navLinks,
    { name: 'Dashboard', href: '/dashboard', icon: <User className="h-5 w-5 mr-2" /> }
  ];

  const links = user ? authenticatedLinks : navLinks;

  // Use Sheet component for mobile menu
  const mobileMenu = (
    <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[400px]">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between py-4">
            <Link href="/" className="flex items-center" onClick={closeMenu}>
              <TradeBikesLogo className="h-10 w-auto" />
            </Link>
            <Button variant="ghost" size="icon" onClick={closeMenu}>
              <X className="h-6 w-6" />
            </Button>
          </div>
          
          <nav className="flex-1">
            <ul className="space-y-2 py-4">
              {links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>
                    <a 
                      className="flex items-center px-4 py-3 hover:bg-gray-100 rounded-md"
                      onClick={closeMenu}
                    >
                      {link.icon}
                      {link.name}
                    </a>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          
          {user ? (
            <div className="border-t py-4">
              <div className="px-4 py-2 mb-2">
                <p className="text-sm text-gray-500">Signed in as:</p>
                <p className="font-medium">{user.companyName}</p>
              </div>
              <Button 
                variant="outline" 
                className="w-full flex items-center justify-center"
                onClick={() => {
                  handleLogout();
                  closeMenu();
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="border-t py-4 px-4 space-y-2">
              <Link href="/auth">
                <Button className="w-full" onClick={closeMenu}>Sign In</Button>
              </Link>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );

  // Desktop navigation
  const desktopNav = (
    <div className="hidden md:flex items-center space-x-1">
      {links.map((link) => (
        <Link key={link.href} href={link.href}>
          <Button variant="ghost" className="text-base">
            {link.name}
          </Button>
        </Link>
      ))}
    </div>
  );

  // User menu for desktop
  const userMenu = user && (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarFallback>
              {getInitials(user.companyName)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.companyName}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard">
            <a className="flex items-center cursor-pointer w-full">
              <User className="mr-2 h-4 w-4" />
              Dashboard
            </a>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <a className="flex items-center cursor-pointer w-full">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </a>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex">
          {mobileMenu}
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <TradeBikesLogo className="h-10 w-auto" />
          </Link>
          {desktopNav}
        </div>
        
        <div className="flex items-center space-x-1">
          {user && <NotificationsPopover />}
          {!isMobile && userMenu}
          {!user && !isMobile && (
            <Link href="/auth">
              <Button>Sign In</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}