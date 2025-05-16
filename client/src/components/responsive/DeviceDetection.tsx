import { useEffect, useState } from 'react';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

// Device detection hook to determine device type
export function useDeviceDetection() {
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    // Detect device type based on user agent and screen size
    const detectDeviceType = () => {
      const ua = navigator.userAgent;
      
      // Check for iOS devices
      const iOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
      setIsIOS(iOS);
      
      // Check for Android devices
      const android = /Android/.test(ua);
      setIsAndroid(android);
      
      // Check viewport width for device type
      const width = window.innerWidth;
      if (width < 768) {
        setDeviceType('mobile');
      } else if (width >= 768 && width < 1024) {
        setDeviceType('tablet');
      } else {
        setDeviceType('desktop');
      }
      
      // Set orientation
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
    };

    // Check orientation change
    const handleOrientationChange = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
    };

    // Initialize on mount
    detectDeviceType();
    
    // Add event listeners
    window.addEventListener('resize', detectDeviceType);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', detectDeviceType);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return {
    deviceType,
    orientation,
    isMobile: deviceType === 'mobile',
    isTablet: deviceType === 'tablet',
    isDesktop: deviceType === 'desktop',
    isIOS,
    isAndroid
  };
}

export function applyDeviceSpecificClasses() {
  useEffect(() => {
    const ua = navigator.userAgent;
    const iOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const android = /Android/.test(ua);
    
    if (iOS) {
      document.body.classList.add('ios-device');
    } else if (android) {
      document.body.classList.add('android-device');
    }
    
    // Add class for mobile/desktop
    if (window.innerWidth < 768) {
      document.body.classList.add('mobile-device');
    } else {
      document.body.classList.add('desktop-device');
    }
    
    // Add class for app mode detection
    if (window.matchMedia('(display-mode: standalone)').matches) {
      document.body.classList.add('app-mode');
    }
  }, []);
}

export default useDeviceDetection;