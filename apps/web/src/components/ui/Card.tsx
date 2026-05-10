'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  shadow?: 'sm' | 'md' | 'lg' | 'xl';
  border?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, interactive = false, shadow = 'md', border = true, ...props }, ref) => {
    const shadowClasses = {
      sm: 'shadow-sm',
      md: 'shadow-md',
      lg: 'shadow-lg',
      xl: 'shadow-xl',
    };

    return (
      <div
        className={cn(
          'rounded-lg bg-card transition-all duration-200 ease-smooth',
          border && 'border border-border',
          shadowClasses[shadow],
          interactive &&
            'hover:bg-card-hover hover:shadow-lg hover:-translate-y-1 cursor-pointer',
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);

Card.displayName = 'Card';

/* Card Header */
interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  withDivider?: boolean;
}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, withDivider = true, ...props }, ref) => (
    <div
      className={cn(
        'px-6 py-4',
        withDivider && 'border-b border-border',
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
);

CardHeader.displayName = 'CardHeader';

/* Card Body */
const CardBody = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div className={cn('px-6 py-4', className)} ref={ref} {...props} />
  ),
);

CardBody.displayName = 'CardBody';

/* Card Footer */
interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  withDivider?: boolean;
}

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, withDivider = true, ...props }, ref) => (
    <div
      className={cn(
        'flex items-center justify-between px-6 py-4',
        withDivider && 'border-t border-border',
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
);

CardFooter.displayName = 'CardFooter';

/* Card Title */
const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      className={cn('text-lg font-semibold text-foreground', className)}
      ref={ref}
      {...props}
    />
  ),
);

CardTitle.displayName = 'CardTitle';

/* Card Description */
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p className={cn('text-sm text-muted', className)} ref={ref} {...props} />
));

CardDescription.displayName = 'CardDescription';

export { Card, CardHeader, CardBody, CardFooter, CardTitle, CardDescription };
