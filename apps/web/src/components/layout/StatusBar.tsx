'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface StatusBarProps extends React.HTMLAttributes<HTMLDivElement> {
  leftContent?: React.ReactNode;
  centerContent?: React.ReactNode;
  rightContent?: React.ReactNode;
}

const StatusBar = React.forwardRef<HTMLDivElement, StatusBarProps>(
  ({ leftContent, centerContent, rightContent, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-card border-t border-border',
          'px-6 py-2.5',
          'flex items-center justify-between gap-4',
          'h-10',
          'transition-all duration-200',
          className,
        )}
        {...props}
      >
        {/* Left side */}
        {leftContent && (
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="text-xs text-muted flex items-center gap-2">
              {leftContent}
            </div>
          </div>
        )}

        {/* Center */}
        {centerContent && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-xs text-muted">
              {centerContent}
            </div>
          </div>
        )}

        {/* Right side */}
        {rightContent && (
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="text-xs text-muted flex items-center gap-2">
              {rightContent}
            </div>
          </div>
        )}
      </div>
    );
  },
);

StatusBar.displayName = 'StatusBar';

/* Status Item */
interface StatusItemProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  label?: string;
  value: string | React.ReactNode;
}

const StatusItem = React.forwardRef<HTMLDivElement, StatusItemProps>(
  ({ icon, label, value, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center gap-1.5', className)}
      {...props}
    >
      {icon && <span className="flex-shrink-0 opacity-70">{icon}</span>}
      {label && <span className="opacity-70">{label}:</span>}
      <span className="font-medium text-foreground">{value}</span>
    </div>
  ),
);

StatusItem.displayName = 'StatusItem';

export { StatusBar, StatusItem };
