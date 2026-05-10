'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'line' | 'box' | 'circle' | 'avatar';
  width?: string | number;
  height?: string | number;
  count?: number;
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ variant = 'line', width, height, count = 1, className, ...props }, ref) => {
    const variantClasses = {
      line: 'rounded h-4 w-full',
      box: 'rounded-lg h-12 w-full',
      circle: 'rounded-full h-10 w-10',
      avatar: 'rounded-full h-12 w-12',
    };

    const baseClasses = cn(
      'bg-subtle animate-pulse',
      variantClasses[variant],
      className,
    );

    const style = {
      width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
      height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
    };

    if (count === 1) {
      return <div ref={ref} className={baseClasses} style={style} {...props} />;
    }

    return (
      <div className="space-y-2" {...props}>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            ref={i === 0 ? ref : undefined}
            className={baseClasses}
            style={style}
          />
        ))}
      </div>
    );
  },
);

Skeleton.displayName = 'Skeleton';

export { Skeleton };
