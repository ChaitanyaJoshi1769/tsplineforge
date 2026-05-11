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
      top: 'bottom-[-4px] left-1/2 -translate-x-1/2 border-t-foreground border-l-transparent border-r-transparent border-b-transparent opacity-95',
      bottom: 'top-[-4px] left-1/2 -translate-x-1/2 border-b-foreground border-l-transparent border-r-transparent border-t-transparent opacity-95',
      left: 'left-[-4px] top-1/2 -translate-y-1/2 border-l-foreground border-t-transparent border-b-transparent border-r-transparent opacity-95',
      right: 'right-[-4px] top-1/2 -translate-y-1/2 border-r-foreground border-t-transparent border-b-transparent border-l-transparent opacity-95',
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
              'px-3 py-2 rounded-lg',
              'bg-foreground/95 text-background text-xs font-medium',
              'whitespace-nowrap shadow-lg',
              'animate-fadeIn tooltip-enter',
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
