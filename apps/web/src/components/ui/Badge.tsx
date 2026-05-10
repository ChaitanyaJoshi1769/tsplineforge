'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  dot?: boolean;
  dismissible?: boolean;
  onDismiss?: () => void;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      icon,
      dot,
      dismissible,
      onDismiss,
      children,
      ...props
    },
    ref,
  ) => {
    const variantClasses = {
      primary: 'bg-primary/10 text-primary border border-primary/20',
      secondary: 'bg-secondary/10 text-secondary border border-secondary/20',
      success: 'bg-success/10 text-success border border-success/20',
      warning: 'bg-warning/10 text-warning border border-warning/20',
      error: 'bg-error/10 text-error border border-error/20',
      info: 'bg-info/10 text-info border border-info/20',
    };

    const sizeClasses = {
      sm: 'px-2 py-1 text-xs gap-1',
      md: 'px-3 py-1.5 text-sm gap-1.5',
      lg: 'px-4 py-2 text-base gap-2',
    };

    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full font-medium transition-colors duration-200',
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        ref={ref}
        {...props}
      >
        {dot && (
          <span
            className={cn(
              'h-1.5 w-1.5 rounded-full',
              variant === 'primary' && 'bg-primary',
              variant === 'secondary' && 'bg-secondary',
              variant === 'success' && 'bg-success',
              variant === 'warning' && 'bg-warning',
              variant === 'error' && 'bg-error',
              variant === 'info' && 'bg-info',
            )}
          />
        )}
        {icon && <span className="flex items-center">{icon}</span>}
        <span>{children}</span>
        {dismissible && (
          <button
            onClick={onDismiss}
            className="ml-1 hover:opacity-70 transition-opacity"
            type="button"
            aria-label="Dismiss"
          >
            ✕
          </button>
        )}
      </span>
    );
  },
);

Badge.displayName = 'Badge';

export { Badge };
