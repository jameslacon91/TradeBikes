import React from 'react';
import { Link, useLocation } from 'wouter';
import { Home, Map, PlusCircle, User, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

const BottomNavigation: React.FC = () => {
  const [location] = useLocation();
  const { user } = useAuth();

  // Don't show bottom navigation if user is not logged in
  if (!user) return null;

  return (
    <nav className="mobile-bottom-nav">
      <div className={`mobile-bottom-nav-item ${location === '/' ? 'active' : ''}`}>
        <Link href="/">
          <Home />
          <span>Home</span>
        </Link>
      </div>
      
      <div className={`mobile-bottom-nav-item ${location.includes('/search') || location.includes('/auction') || location.includes('/underwrite') ? 'active' : ''}`}>
        <Link href="/search-map">
          <Map />
          <span>Search</span>
        </Link>
      </div>
      
      <div className={`mobile-bottom-nav-item ${location.includes('/create') ? 'active' : ''}`}>
        <Link href="/create-auction">
          <PlusCircle />
          <span>List</span>
        </Link>
      </div>
      
      <div className={`mobile-bottom-nav-item ${location === '/dashboard' ? 'active' : ''}`}>
        <Link href="/dashboard">
          <User />
          <span>Dashboard</span>
        </Link>
      </div>
    </nav>
  );
};

export default BottomNavigation;