'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const variantConfig = {
  danger: {
    icon: '⚠️',
    confirmVariant: 'danger' as const,
    bgClass: 'bg-error/5',
  },
  warning: {
    icon: '⚡',
    confirmVariant: 'secondary' as const,
    bgClass: 'bg-warning/5',
  },
  info: {
    icon: 'ℹ',
    confirmVariant: 'primary' as const,
    bgClass: 'bg-primary/5',
  },
};

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'info',
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmDialogProps) {
  const config = variantConfig[variant];

  const handleConfirm = async () => {
    try {
      await onConfirm();
    } catch (error) {
      console.error('Confirmation failed:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={
        <div className="flex items-center gap-3">
          <span className="text-2xl">{config.icon}</span>
          <span>{title}</span>
        </div>
      }
    >
      <div className={`p-4 rounded-lg mb-6 ${config.bgClass}`}>
        <p className="text-foreground">{message}</p>
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          fullWidth
        >
          {cancelText}
        </Button>
        <Button
          variant={config.confirmVariant}
          onClick={handleConfirm}
          isLoading={isLoading}
          fullWidth
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
}

// Hook for easier usage
export function useConfirmDialog() {
  const [state, setState] = React.useState<Omit<ConfirmDialogProps, 'onConfirm' | 'onCancel'> & {
    onConfirm?: () => void | Promise<void>;
    onCancel?: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
  });

  const confirm = React.useCallback((props: Omit<ConfirmDialogProps, 'isOpen' | 'onCancel'>) => {
    return new Promise<boolean>((resolve) => {
      setState({
        ...props,
        isOpen: true,
        onConfirm: async () => {
          setState((prev) => ({ ...prev, isLoading: true }));
          try {
            await props.onConfirm();
            resolve(true);
          } catch (error) {
            console.error('Confirmation failed:', error);
            resolve(false);
          } finally {
            setState((prev) => ({ ...prev, isOpen: false, isLoading: false }));
          }
        },
        onCancel: () => {
          setState((prev) => ({ ...prev, isOpen: false }));
          resolve(false);
        },
      });
    });
  }, []);

  return {
    confirm,
    ...state,
    onConfirm: state.onConfirm || (() => {}),
    onCancel: state.onCancel || (() => {}),
  };
}
