import React from 'react';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: string;
  padding?: string;
  mobilePadding?: string;
}

/**
 * A responsive container component that provides proper spacing and padding on all devices
 */
const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  className = '',
  maxWidth = 'max-w-7xl',
  padding = 'px-6 py-6',
  mobilePadding = 'px-4 py-4',
}) => {
  return (
    <div className={`w-full mx-auto ${maxWidth} ${className}`}>
      <div className={`${mobilePadding} sm:${padding}`}>
        {children}
      </div>
    </div>
  );
};

export default ResponsiveContainer;