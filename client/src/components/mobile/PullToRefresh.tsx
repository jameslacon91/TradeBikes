import React, { useEffect, useRef, useState } from 'react';
import { Loader } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

const PullToRefresh: React.FC<PullToRefreshProps> = ({ onRefresh, children }) => {
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pullStartY = useRef(0);
  const pullMoveY = useRef(0);
  const distanceRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isEnabled = useRef(true);

  const pullDistance = 70; // Distance in pixels required to trigger refresh

  // Detect if we're on a mobile device
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  useEffect(() => {
    // Only enable pull-to-refresh on mobile devices
    if (!isMobile) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Don't allow pull to refresh when content is scrollable and not at the top
      if (containerRef.current && containerRef.current.scrollTop > 0) {
        isEnabled.current = false;
        return;
      }
      
      isEnabled.current = true;
      pullStartY.current = e.touches[0].clientY;
      pullMoveY.current = pullStartY.current;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isEnabled.current || isRefreshing) return;
      
      pullMoveY.current = e.touches[0].clientY;
      const distance = Math.max(0, pullMoveY.current - pullStartY.current);
      distanceRef.current = distance;
      
      if (distance > 0) {
        setIsPulling(true);
        
        // Prevent the default scroll behavior when pulling down
        if (containerRef.current && containerRef.current.scrollTop <= 0) {
          e.preventDefault();
        }
      }
    };

    const handleTouchEnd = async () => {
      if (!isEnabled.current || isRefreshing) return;
      
      if (distanceRef.current >= pullDistance) {
        setIsRefreshing(true);
        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
        }
      }
      
      setIsPulling(false);
      distanceRef.current = 0;
    };

    const element = containerRef.current;
    if (element) {
      element.addEventListener('touchstart', handleTouchStart, { passive: true });
      element.addEventListener('touchmove', handleTouchMove, { passive: false });
      element.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      if (element) {
        element.removeEventListener('touchstart', handleTouchStart);
        element.removeEventListener('touchmove', handleTouchMove);
        element.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [isRefreshing, onRefresh, isMobile]);

  return (
    <div ref={containerRef} className="h-full overflow-auto relative">
      {(isPulling || isRefreshing) && (
        <div
          className="ptr-element flex items-center justify-center"
          style={{ 
            opacity: Math.min(1, distanceRef.current / pullDistance),
            transform: isRefreshing 
              ? 'translateY(10px)' 
              : `translateY(${Math.min(distanceRef.current / 2, pullDistance / 2)}px)`
          }}
        >
          <div className="flex flex-col items-center justify-center p-2">
            <Loader className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <div className="text-xs mt-1">
              {isRefreshing ? 'Refreshing...' : 'Pull to refresh'}
            </div>
          </div>
        </div>
      )}
      {children}
    </div>
  );
};

export default PullToRefresh;