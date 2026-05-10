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
      success: 'bg-success/10 border-success/20 text-success',
      error: 'bg-error/10 border-error/20 text-error',
      warning: 'bg-warning/10 border-warning/20 text-warning',
      info: 'bg-info/10 border-info/20 text-info',
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
            className="flex-shrink-0 hover:opacity-70 transition-opacity"
            aria-label="Close alert"
            type="button"
          >
            ✕
          </button>
        )}
      </div>
    );
  },
);

Alert.displayName = 'Alert';

export { Alert };
