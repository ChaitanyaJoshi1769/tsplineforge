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
      primary: 'bg-gradient-to-r from-primary/10 to-primary/5 text-primary border border-primary/20 hover:border-primary/40 hover:bg-gradient-to-r hover:from-primary/15 hover:to-primary/10',
      secondary: 'bg-gradient-to-r from-secondary/10 to-secondary/5 text-secondary border border-secondary/20 hover:border-secondary/40 hover:bg-gradient-to-r hover:from-secondary/15 hover:to-secondary/10',
      success: 'bg-gradient-to-r from-success/10 to-success/5 text-success border border-success/20 hover:border-success/40 hover:bg-gradient-to-r hover:from-success/15 hover:to-success/10',
      warning: 'bg-gradient-to-r from-warning/10 to-warning/5 text-warning border border-warning/20 hover:border-warning/40 hover:bg-gradient-to-r hover:from-warning/15 hover:to-warning/10',
      error: 'bg-gradient-to-r from-error/10 to-error/5 text-error border border-error/20 hover:border-error/40 hover:bg-gradient-to-r hover:from-error/15 hover:to-error/10',
      info: 'bg-gradient-to-r from-info/10 to-info/5 text-info border border-info/20 hover:border-info/40 hover:bg-gradient-to-r hover:from-info/15 hover:to-info/10',
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
              'h-2 w-2 rounded-full animate-pulse',
              variant === 'primary' && 'bg-primary shadow-glow-primary',
              variant === 'secondary' && 'bg-secondary shadow-glow-secondary',
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
