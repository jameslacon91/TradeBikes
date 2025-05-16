import React, { ReactNode, useEffect, useState } from 'react';

interface ResponsiveLayoutProps {
  children: ReactNode;
  mobileBreakpoint?: number;
  className?: string;
  mobilePadding?: string;
  desktopPadding?: string;
}

/**
 * A responsive layout component that adapts to different screen sizes
 */
const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  mobileBreakpoint = 768,
  className = '',
  mobilePadding = 'px-4 py-3',
  desktopPadding = 'px-6 py-4',
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < mobileBreakpoint);
    };
    
    // Check on mount
    checkMobile();
    
    // Set up event listener for window resize
    window.addEventListener('resize', checkMobile);
    
    // Clean up
    return () => window.removeEventListener('resize', checkMobile);
  }, [mobileBreakpoint]);

  return (
    <div className={`w-full ${isMobile ? mobilePadding : desktopPadding} ${className}`}>
      {children}
    </div>
  );
};

/**
 * Helper component that shows different content on mobile vs desktop
 */
export const ResponsiveView: React.FC<{
  mobileContent: ReactNode;
  desktopContent: ReactNode;
  mobileBreakpoint?: number;
}> = ({ mobileContent, desktopContent, mobileBreakpoint = 768 }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < mobileBreakpoint);
    };
    
    // Check on mount
    checkMobile();
    
    // Set up event listener for window resize
    window.addEventListener('resize', checkMobile);
    
    // Clean up
    return () => window.removeEventListener('resize', checkMobile);
  }, [mobileBreakpoint]);

  return (
    <>
      {isMobile ? mobileContent : desktopContent}
    </>
  );
};

export default ResponsiveLayout;