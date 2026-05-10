'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface HeaderProps {
  logo?: React.ReactNode;
  title?: string | React.ReactNode;
  rightContent?: React.ReactNode;
  sticky?: boolean;
  shadow?: boolean;
  className?: string;
  [key: string]: unknown;
}

const Header = React.forwardRef<HTMLElement, HeaderProps>(
  ({ logo, title, rightContent, sticky = true, shadow = true, className, ...props }, ref) => {
    return (
      <header
        ref={ref}
        className={cn(
          'bg-card border-b border-border',
          'px-4 md:px-6 py-3 md:py-4',
          'flex items-center justify-between gap-2 md:gap-4',
          'transition-all duration-200',
          sticky && 'sticky top-0 z-sticky',
          shadow && 'shadow-sm',
          className,
        )}
        {...props}
      >
        {/* Left side - Logo */}
        {logo && (
          <div className="flex items-center gap-3 flex-shrink-0">
            {logo}
          </div>
        )}

        {/* Center - Title */}
        {title && (
          <div className="flex-1 flex items-center justify-center">
            {typeof title === 'string' ? (
              <h1 className="text-lg font-semibold text-foreground">{title}</h1>
            ) : (
              title
            )}
          </div>
        )}

        {/* Right side - Actions, User Menu, etc. */}
        {rightContent && (
          <div className="flex items-center gap-4 flex-shrink-0">
            {rightContent}
          </div>
        )}
      </header>
    );
  },
);

Header.displayName = 'Header';

export { Header };
