'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';

export interface TooltipProps {
  content: string | React.ReactNode;
  children: React.ReactElement;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
}

const Tooltip = React.forwardRef<HTMLDivElement, TooltipProps>(
  ({ content, children, placement = 'top', delay = 200, className }, ref) => {
    const [isVisible, setIsVisible] = useState(false);
    const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

    const handleMouseEnter = () => {
      const id = setTimeout(() => {
        setIsVisible(true);
      }, delay);
      setTimeoutId(id);
    };

    const handleMouseLeave = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      setIsVisible(false);
    };

    const placementClasses = {
      top: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
      bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
      left: 'right-full mr-2 top-1/2 -translate-y-1/2',
      right: 'left-full ml-2 top-1/2 -translate-y-1/2',
    };

    const arrowClasses = {
      top: 'bottom-[-4px] left-1/2 -translate-x-1/2 border-t-muted border-l-transparent border-r-transparent border-b-transparent',
      bottom: 'top-[-4px] left-1/2 -translate-x-1/2 border-b-muted border-l-transparent border-r-transparent border-t-transparent',
      left: 'left-[-4px] top-1/2 -translate-y-1/2 border-l-muted border-t-transparent border-b-transparent border-r-transparent',
      right: 'right-[-4px] top-1/2 -translate-y-1/2 border-r-muted border-t-transparent border-b-transparent border-l-transparent',
    };

    return (
      <div
        ref={ref}
        className="relative inline-block"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}

        {isVisible && (
          <div
            className={cn(
              'absolute z-tooltip pointer-events-none',
              'px-3 py-2 rounded-md',
              'bg-muted text-card text-sm font-medium',
              'whitespace-nowrap',
              'animate-fadeIn',
              placementClasses[placement],
              className,
            )}
          >
            {content}
            <div
              className={cn('absolute border-[4px]', arrowClasses[placement])}
            />
          </div>
        )}
      </div>
    );
  },
);

Tooltip.displayName = 'Tooltip';

export { Tooltip };
