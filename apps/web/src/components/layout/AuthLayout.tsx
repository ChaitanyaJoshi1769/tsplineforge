'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

export interface AuthLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  logo?: React.ReactNode;
  branding?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

// Client-only theme toggle wrapper to avoid SSR hydration issues
function ThemeToggleWrapper() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-10 h-10" />;
  }

  return <ThemeToggle />;
}

const AuthLayout = React.forwardRef<HTMLDivElement, AuthLayoutProps>(
  ({ logo, branding, children, footer, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'min-h-screen w-full bg-gradient-to-br from-background via-background to-subtle',
          'flex flex-col items-center justify-center',
          'px-4 py-8 relative overflow-hidden',
          className,
        )}
        {...props}
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Gradient orbs */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl opacity-30 -translate-y-1/2" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-tl from-secondary/10 to-transparent rounded-full blur-3xl opacity-30 translate-y-1/2" />
          <div className="absolute top-1/3 right-0 w-96 h-96 bg-gradient-to-l from-accent/5 to-transparent rounded-full blur-3xl opacity-20" />
        </div>

        {/* Content */}
        <div className="relative z-10 w-full max-w-md">
          {/* Header - Theme Toggle */}
          <div className="absolute -top-12 right-0 z-50">
            <ThemeToggleWrapper />
          </div>

          {/* Logo & Branding Section */}
          <div className="text-center mb-8 space-y-4">
            {logo && (
              <div className="flex justify-center animate-fadeIn" style={{ animationDelay: '0.1s' }}>
                {logo}
              </div>
            )}
            {branding && (
              <div className="animate-slideUp" style={{ animationDelay: '0.2s' }}>
                {branding}
              </div>
            )}
          </div>

          {/* Auth Form Card */}
          <div className="relative group animate-slideUp" style={{ animationDelay: '0.3s' }}>
            {/* Gradient border effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500" />

            {/* Card content */}
            <div className="relative bg-card border border-border/50 rounded-2xl shadow-2xl p-6 md:p-8 backdrop-blur-sm">
              {children}
            </div>
          </div>

          {/* Footer Links */}
          {footer && (
            <div className="text-center mt-8 text-xs text-muted/60 font-medium animate-fadeIn" style={{ animationDelay: '0.4s' }}>
              {footer}
            </div>
          )}
        </div>

        {/* Floating accent elements */}
        <div className="absolute top-1/4 left-0 w-2 h-2 bg-primary/20 rounded-full blur animate-pulse" />
        <div className="absolute bottom-1/4 right-0 w-1.5 h-1.5 bg-secondary/20 rounded-full blur animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>
    );
  },
);

AuthLayout.displayName = 'AuthLayout';

export { AuthLayout };
