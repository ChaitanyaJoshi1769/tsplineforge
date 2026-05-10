'use client';

import React from 'react';
import { cn } from '@/lib/utils';

// ============= LINEAR PROGRESS BAR =============

export interface LinearProgressProps {
  progress: number; // 0-100
  variant?: 'primary' | 'success' | 'warning' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  animated?: boolean;
  label?: string;
  showPercentage?: boolean;
  className?: string;
}

export function LinearProgress({
  progress,
  variant = 'primary',
  size = 'md',
  animated = true,
  label,
  showPercentage = true,
  className,
}: LinearProgressProps) {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  const variantClasses = {
    primary: 'bg-primary',
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-error',
  };

  const sizeClasses = {
    xs: 'h-0.5',
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className={className}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between mb-2">
          {label && <span className="text-sm font-medium text-foreground">{label}</span>}
          {showPercentage && (
            <span className="text-sm text-muted">{Math.round(clampedProgress)}%</span>
          )}
        </div>
      )}
      <div className={cn('w-full bg-card rounded-full overflow-hidden', sizeClasses[size])}>
        <div
          className={cn(
            variantClasses[variant],
            'h-full transition-all duration-300 ease-out rounded-full',
            animated && clampedProgress > 0 && clampedProgress < 100 && 'animate-pulse-slow',
          )}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
}

// ============= CIRCULAR PROGRESS =============

export interface CircularProgressProps {
  progress: number; // 0-100
  variant?: 'primary' | 'success' | 'warning' | 'danger';
  size?: number; // in pixels
  strokeWidth?: number;
  animated?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export function CircularProgress({
  progress,
  variant = 'primary',
  size = 80,
  strokeWidth = 4,
  animated = true,
  children,
  className,
}: CircularProgressProps) {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  const circumference = 2 * Math.PI * (size / 2 - strokeWidth);
  const offset = circumference - (clampedProgress / 100) * circumference;

  const colorMap = {
    primary: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
  };

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        style={{
          filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.05))',
        }}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - strokeWidth}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-card"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - strokeWidth}
          stroke={colorMap[variant]}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn('transition-all duration-300', animated && 'animate-pulse-slow')}
        />
      </svg>
      {children && <div className="absolute inset-0 flex items-center justify-center">{children}</div>}
    </div>
  );
}

// ============= SKELETON LOADER =============

export interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  className?: string;
  count?: number;
}

export function Skeleton({
  variant = 'text',
  width,
  height,
  className,
  count = 1,
}: SkeletonProps) {
  const skeletons = Array.from({ length: count });

  const variantClasses = {
    text: 'rounded-sm',
    circular: 'rounded-full',
    rectangular: 'rounded-md',
  };

  const style: React.CSSProperties = {
    width: variant === 'circular' ? height : width,
    height,
  };

  return (
    <div className="space-y-2">
      {skeletons.map((_, index) => (
        <div
          key={index}
          className={cn(
            'bg-gradient-to-r from-card via-card-hover to-card',
            'animate-shimmer',
            variantClasses[variant],
            className,
          )}
          style={style}
        />
      ))}
    </div>
  );
}

// ============= LOADING SPINNER =============

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  className?: string;
}

export function Spinner({ size = 'md', variant = 'primary', className }: SpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const variantClasses = {
    primary: 'border-primary',
    secondary: 'border-secondary',
    success: 'border-success',
    warning: 'border-warning',
    danger: 'border-error',
  };

  return (
    <div
      className={cn(
        'inline-block animate-spin',
        'rounded-full border-2 border-card',
        variantClasses[variant],
        'border-t-2 border-r-2',
        sizeClasses[size],
        className,
      )}
    />
  );
}

// ============= LOADING STATE COMPONENT =============

export interface LoadingStateProps {
  isLoading: boolean;
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
  error?: Error | null;
  errorComponent?: (error: Error) => React.ReactNode;
  fallback?: React.ReactNode;
}

export function LoadingState({
  isLoading,
  children,
  loadingComponent,
  error,
  errorComponent,
  fallback,
}: LoadingStateProps) {
  if (error && errorComponent) {
    return <>{errorComponent(error)}</>;
  }

  if (error) {
    return (
      <div className="rounded-lg bg-error/10 border border-error/30 p-4">
        <p className="text-sm font-medium text-error">{error.message}</p>
      </div>
    );
  }

  if (isLoading) {
    return <>{loadingComponent || fallback || <Skeleton count={3} height={20} />}</>;
  }

  return <>{children}</>;
}

// ============= PROGRESS STEPS =============

export interface ProgressStep {
  id: string;
  label: string;
  description?: string;
}

export interface ProgressStepsProps {
  steps: ProgressStep[];
  currentStep: number; // 0-indexed
  onStepClick?: (stepIndex: number) => void;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  className?: string;
}

export function ProgressSteps({
  steps,
  currentStep,
  onStepClick,
  variant = 'primary',
  className,
}: ProgressStepsProps) {
  const colorMap = {
    primary: 'bg-primary text-white',
    secondary: 'bg-secondary text-white',
    success: 'bg-success text-white',
    warning: 'bg-warning text-white',
    danger: 'bg-error text-white',
  };

  const variantBorder = {
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-error',
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;

          return (
            <div key={step.id} className="flex-1 flex items-center">
              {/* Step circle */}
              <button
                onClick={() => onStepClick?.(index)}
                disabled={!onStepClick}
                className={cn(
                  'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-medium text-sm',
                  'transition-all duration-300',
                  isCompleted || isCurrent
                    ? colorMap[variant]
                    : 'bg-card border-2 border-border text-muted',
                  onStepClick && 'cursor-pointer hover:shadow-md',
                )}
              >
                {isCompleted ? '✓' : index + 1}
              </button>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-1 mx-2 rounded-full transition-all duration-300',
                    isCompleted ? variantBorder[variant] : 'bg-card',
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step labels */}
      <div className="mt-4">
        {steps[currentStep] && (
          <div>
            <p className="text-sm font-medium text-foreground">{steps[currentStep].label}</p>
            {steps[currentStep].description && (
              <p className="text-xs text-muted mt-1">{steps[currentStep].description}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
