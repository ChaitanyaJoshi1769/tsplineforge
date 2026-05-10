'use client';

import React, { useRef } from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  enableRipple?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading,
      leftIcon,
      rightIcon,
      fullWidth,
      enableRipple = true,
      children,
      disabled,
      onClick,
      ...props
    },
    ref,
  ) => {
    const buttonRef = useRef<HTMLButtonElement>(null);

    const variantClasses = {
      primary:
        'bg-primary hover:bg-primary-600 text-white shadow-md hover:shadow-lg active:bg-primary-700',
      secondary:
        'bg-secondary hover:bg-secondary-600 text-white shadow-md hover:shadow-lg active:bg-secondary-700',
      outline:
        'border border-border bg-transparent text-foreground hover:bg-card hover:border-border-light active:bg-card-hover',
      ghost:
        'bg-transparent text-foreground hover:bg-card active:bg-card-hover',
      danger:
        'bg-error hover:bg-error-600 text-white shadow-md hover:shadow-lg active:bg-error-700',
    };

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm gap-2',
      md: 'px-4 py-2.5 text-base gap-2',
      lg: 'px-6 py-3 text-lg gap-2.5',
    };

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (enableRipple && buttonRef.current && !disabled && !isLoading) {
        const rect = buttonRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.style.transform = `translate(-50%, -50%)`;

        buttonRef.current.appendChild(ripple);

        setTimeout(() => ripple.remove(), 600);
      }

      onClick?.(e);
    };

    return (
      <button
        ref={ref || buttonRef}
        className={cn(
          'relative inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 ease-smooth disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary overflow-hidden button-hover button-active',
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && 'w-full',
          isLoading && 'opacity-70 cursor-not-allowed',
          className,
        )}
        disabled={disabled || isLoading}
        onClick={handleClick}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {children && <span>{children}</span>}
          </>
        ) : (
          <>
            {leftIcon && <span className="flex items-center">{leftIcon}</span>}
            {children && <span>{children}</span>}
            {rightIcon && <span className="flex items-center">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  },
);

Button.displayName = 'Button';

export { Button };
