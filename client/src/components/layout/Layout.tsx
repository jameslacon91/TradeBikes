import { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';
import RoleSwitcher from './RoleSwitcher';
import { useAuth } from '@/hooks/use-auth';

interface LayoutProps {
  children: ReactNode;
  showRoleSwitcher?: boolean;
}

export default function Layout({ children, showRoleSwitcher = false }: LayoutProps) {
  // Temporarily disable auth
  // const { user } = useAuth();
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      {/* Temporarily disable role switcher: {showRoleSwitcher && user && <RoleSwitcher />} */}
      <main className="flex-grow bg-gray-50">
        {children}
      </main>
      <Footer />
    </div>
  );
}
