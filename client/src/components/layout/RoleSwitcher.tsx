import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';

export default function RoleSwitcher() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const [activeRole, setActiveRole] = useState(user?.role || 'dealer');

  // Helper to determine if user should see create auction button
  const showCreateButton = user?.role === 'dealer' && activeRole === 'dealer';

  const handleRoleSwitch = (role: string) => {
    setActiveRole(role);
    // In a real app, we might want to redirect to the appropriate dashboard
    if (role === 'dealer') {
      navigate('/dealer-dashboard');
    } else {
      navigate('/trader-dashboard');
    }
  };

  return (
    <div className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-sm font-medium text-gray-500">You are viewing as:</span>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <a 
                href="#" 
                onClick={(e) => { e.preventDefault(); handleRoleSwitch('dealer'); }}
                className={`${activeRole === 'dealer' ? 'border-primary text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                Dealer
              </a>
              <a 
                href="#" 
                onClick={(e) => { e.preventDefault(); handleRoleSwitch('trader'); }}
                className={`${activeRole === 'trader' ? 'border-primary text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                Trader
              </a>
            </div>
          </div>
          <div className="flex items-center">
            {showCreateButton && (
              <Link href="/create-auction">
                <Button>
                  <svg className="mr-2 -ml-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  List New Bike
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
