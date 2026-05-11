'use client';

import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  closeOnEscape?: boolean;
  closeOnBackdropClick?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const Modal = React.forwardRef<HTMLDivElement, ModalProps>(
  (
    {
      isOpen,
      onClose,
      title,
      children,
      closeOnEscape = true,
      closeOnBackdropClick = true,
      size = 'md',
      className,
      ...props
    },
    ref,
  ) => {
    useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (closeOnEscape && e.key === 'Escape') {
          onClose();
        }
      };

      if (isOpen) {
        document.addEventListener('keydown', handleEscape);
        document.body.style.overflow = 'hidden';
        return () => {
          document.removeEventListener('keydown', handleEscape);
          document.body.style.overflow = 'unset';
        };
      }
    }, [isOpen, closeOnEscape, onClose]);

    if (!isOpen) return null;

    const sizeClasses = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
    };

    return (
      <div className="fixed inset-0 z-modal flex items-center justify-center">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fadeIn"
          onClick={() => closeOnBackdropClick && onClose()}
          aria-hidden="true"
        />

        {/* Modal */}
        <div
          ref={ref}
          className={cn(
            'relative bg-card border border-border/50 rounded-xl shadow-xl',
            'w-full mx-4 animate-slideUp',
            sizeClasses[size],
            className,
          )}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          {...props}
        >
          {/* Header */}
          {title && (
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 id="modal-title" className="text-lg font-semibold text-foreground">
                {title}
              </h2>
              <button
                onClick={onClose}
                className="inline-flex items-center justify-center w-8 h-8 text-muted hover:text-foreground hover:bg-card-hover rounded-lg transition-all duration-200 ease-smooth"
                aria-label="Close modal"
                type="button"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {!title && (
            <div className="absolute top-4 right-4">
              <button
                onClick={onClose}
                className="inline-flex items-center justify-center w-8 h-8 text-muted hover:text-foreground hover:bg-card-hover rounded-lg transition-all duration-200 ease-smooth"
                aria-label="Close modal"
                type="button"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Content */}
          <div className="px-6 py-4">{children}</div>
        </div>
      </div>
    );
  },
);

Modal.displayName = 'Modal';

export { Modal };
