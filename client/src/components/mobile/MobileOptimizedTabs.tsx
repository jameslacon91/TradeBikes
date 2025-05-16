import React, { useRef, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface MobileOptimizedTabsProps {
  className?: string;
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
  tabs: { id: string; label: string }[];
}

/**
 * A mobile-optimized tabs component with horizontal scrolling
 */
const MobileOptimizedTabs: React.FC<MobileOptimizedTabsProps> = ({
  className,
  defaultValue,
  value,
  onValueChange,
  tabs,
}) => {
  const tabsRef = useRef<HTMLDivElement>(null);

  // Scroll active tab into view when tab changes
  useEffect(() => {
    if (tabsRef.current && value) {
      const activeTab = tabsRef.current.querySelector(`[data-state="active"]`) as HTMLElement;
      if (activeTab) {
        const tabsRect = tabsRef.current.getBoundingClientRect();
        const activeTabRect = activeTab.getBoundingClientRect();
        
        // Check if the active tab is not fully visible
        if (activeTabRect.left < tabsRect.left || activeTabRect.right > tabsRect.right) {
          // Calculate scroll position to center the active tab
          const scrollLeft = activeTab.offsetLeft - (tabsRef.current.clientWidth / 2) + (activeTab.clientWidth / 2);
          tabsRef.current.scrollTo({ left: scrollLeft, behavior: 'smooth' });
        }
      }
    }
  }, [value]);

  return (
    <Tabs
      defaultValue={defaultValue}
      value={value}
      onValueChange={onValueChange}
      className={cn('w-full', className)}
    >
      <TabsList
        ref={tabsRef}
        className="tabs-list w-full flex overflow-x-auto scrollbar-hide -mb-px"
      >
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            className="flex-shrink-0 px-4 py-2 text-sm whitespace-nowrap"
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};

export default MobileOptimizedTabs;