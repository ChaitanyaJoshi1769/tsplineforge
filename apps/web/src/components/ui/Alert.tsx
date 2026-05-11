'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  description?: string;
  onClose?: () => void;
  autoClose?: boolean;
  autoCloseDuration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: React.ReactNode;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      variant = 'info',
      title,
      description,
      onClose,
      autoClose = true,
      autoCloseDuration = 4000,
      action,
      icon,
      className,
      ...props
    },
    ref,
  ) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
      if (autoClose && isVisible) {
        const timer = setTimeout(() => {
          setIsVisible(false);
          onClose?.();
        }, autoCloseDuration);

        return () => clearTimeout(timer);
      }
    }, [autoClose, autoCloseDuration, isVisible, onClose]);

    if (!isVisible) return null;

    const variantClasses = {
      success: 'bg-gradient-to-r from-success/15 to-success/5 border border-success/30 text-success',
      error: 'bg-gradient-to-r from-error/15 to-error/5 border border-error/30 text-error',
      warning: 'bg-gradient-to-r from-warning/15 to-warning/5 border border-warning/30 text-warning',
      info: 'bg-gradient-to-r from-info/15 to-info/5 border border-info/30 text-info',
    };

    const defaultIcons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ⓘ',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'flex gap-3 p-4 rounded-lg border animate-slideUp',
          variantClasses[variant],
          className,
        )}
        role="alert"
        {...props}
      >
        {/* Icon */}
        <div className="flex-shrink-0 flex items-center">
          {icon ? (
            <span className="flex items-center">{icon}</span>
          ) : (
            <span className="font-semibold text-lg">{defaultIcons[variant]}</span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1">
          {title && <h3 className="font-semibold mb-1">{title}</h3>}
          {description && <p className="text-sm opacity-90">{description}</p>}
        </div>

        {/* Action Button */}
        {action && (
          <button
            onClick={action.onClick}
            className="flex-shrink-0 font-medium text-sm hover:opacity-70 transition-opacity"
            type="button"
          >
            {action.label}
          </button>
        )}

        {/* Close Button */}
        {onClose && (
          <button
            onClick={() => {
              setIsVisible(false);
              onClose();
            }}
            className="flex-shrink-0 inline-flex items-center justify-center w-6 h-6 hover:opacity-70 hover:bg-white/10 rounded transition-all duration-200"
            aria-label="Close alert"
            type="button"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    );
  },
);

Alert.displayName = 'Alert';

export { Alert };
