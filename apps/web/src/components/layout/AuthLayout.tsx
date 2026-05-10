'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface AuthLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  logo?: React.ReactNode;
  branding?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const AuthLayout = React.forwardRef<HTMLDivElement, AuthLayoutProps>(
  ({ logo, branding, children, footer, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'min-h-screen bg-gradient-to-br from-background via-background to-subtle',
          'flex flex-col items-center justify-center',
          'px-4 py-8',
          className,
        )}
        {...props}
      >
        <div className="w-full max-w-md">
          {/* Logo & Branding */}
          <div className="text-center mb-8 animate-fadeIn">
            {logo && (
              <div className="flex justify-center mb-4">
                {logo}
              </div>
            )}
            {branding && (
              <div className="mb-6">
                {branding}
              </div>
            )}
          </div>

          {/* Auth Form */}
          <div className="bg-card border border-border rounded-lg shadow-lg p-6 md:p-8 animate-slideUp">
            {children}
          </div>

          {/* Footer Links */}
          {footer && (
            <div className="text-center mt-6 text-xs text-muted">
              {footer}
            </div>
          )}
        </div>
      </div>
    );
  },
);

AuthLayout.displayName = 'AuthLayout';

export { AuthLayout };
