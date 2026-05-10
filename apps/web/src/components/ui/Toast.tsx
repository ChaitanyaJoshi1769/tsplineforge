'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { useToast, ToastType } from '@/context/toast';
import { X } from 'lucide-react';

const Toast = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    type: ToastType;
    title: string;
    message?: string;
    onClose: () => void;
    action?: {
      label: string;
      onClick: () => void;
    };
  }
>(
  (
    { type, title, message, onClose, action, className, ...props },
    ref,
  ) => {
    const typeStyles = {
      success: 'bg-success/10 border-success/20 text-success',
      error: 'bg-error/10 border-error/20 text-error',
      warning: 'bg-warning/10 border-warning/20 text-warning',
      info: 'bg-info/10 border-info/20 text-info',
    };

    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-start gap-3 p-4 rounded-lg border',
          'max-w-sm animate-slideUp',
          'backdrop-blur-sm',
          typeStyles[type],
          className,
        )}
        {...props}
      >
        <span className="flex-shrink-0 text-lg font-semibold">
          {icons[type]}
        </span>
        <div className="flex-1">
          <h3 className="font-semibold text-sm">{title}</h3>
          {message && <p className="text-xs opacity-90 mt-1">{message}</p>}
          {action && (
            <button
              onClick={action.onClick}
              className="text-xs font-medium mt-2 hover:opacity-80 transition-opacity"
            >
              {action.label}
            </button>
          )}
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Close notification"
        >
          <X size={16} />
        </button>
      </div>
    );
  },
);

Toast.displayName = 'Toast';

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-toast space-y-3 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            type={toast.type}
            title={toast.title}
            message={toast.message}
            action={toast.action}
            onClose={() => removeToast(toast.id)}
          />
        </div>
      ))}
    </div>
  );
}

export { Toast };
