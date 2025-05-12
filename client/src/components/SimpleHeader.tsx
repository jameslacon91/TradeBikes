import { useState } from 'react';
import { Link } from 'wouter';
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
import { Menu, LogOut, User, Settings } from 'lucide-react';

export default function SimpleHeader() {
  const { user, logoutMutation } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate();
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
    { name: 'Home', href: '/' },
    { name: 'Auctions', href: '/auctions' },
    { name: 'About', href: '/about' },
  ];

  // Desktop navigation
  const desktopNav = (
    <div className="hidden md:flex items-center space-x-4">
      {navLinks.map((link) => (
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
              {getInitials(user.companyName || 'User')}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.companyName || 'User'}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email || ''}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard">
            <div className="flex items-center cursor-pointer w-full">
              <User className="mr-2 h-4 w-4" />
              Dashboard
            </div>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <div className="flex items-center cursor-pointer w-full">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </div>
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
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <TradeBikesLogo className="h-10 w-auto" />
          </Link>
          {desktopNav}
        </div>
        
        <div className="flex items-center space-x-4">
          {user && <NotificationsPopover />}
          {userMenu}
          {!user && (
            <Link href="/auth">
              <Button>Sign In</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}