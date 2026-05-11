'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isLoading?: boolean;
  fullWidth?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      hint,
      icon,
      rightIcon,
      isLoading,
      fullWidth,
      disabled,
      ...props
    },
    ref,
  ) => {
    return (
      <div className={cn('flex flex-col gap-2', fullWidth && 'w-full')}>
        {label && (
          <label className="text-sm font-medium text-foreground">
            {label}
            {props.required && <span className="ml-1 text-error">*</span>}
          </label>
        )}

        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-3 flex items-center text-muted pointer-events-none">
              {icon}
            </div>
          )}

          <input
            className={cn(
              'w-full px-4 py-2.5 rounded-lg',
              'bg-card border border-border',
              'text-foreground text-base',
              'placeholder:text-muted',
              'transition-all duration-200 ease-smooth',
              'focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/30 focus:shadow-md focus:shadow-primary/10',
              'hover:border-border-light hover:bg-card-hover',
              'disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-background',
              icon && 'pl-10',
              rightIcon && 'pr-10',
              isLoading && 'pr-10',
              error && 'border-error focus:border-error focus:ring-error/30 focus:shadow-error/10',
              className,
            )}
            disabled={disabled || isLoading}
            ref={ref}
            {...props}
          />

          {(rightIcon || isLoading) && (
            <div className="absolute right-3 flex items-center text-muted pointer-events-none">
              {isLoading ? (
                <svg
                  className="h-5 w-5 animate-spin"
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
              ) : (
                rightIcon
              )}
            </div>
          )}
        </div>

        {error && <p className="text-sm text-error flex items-center gap-1">
          <span className="inline-block">⚠</span> {error}
        </p>}
        {hint && !error && <p className="text-sm text-muted">{hint}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';

export { Input };
