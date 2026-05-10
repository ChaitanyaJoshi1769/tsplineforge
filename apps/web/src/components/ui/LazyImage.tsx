'use client';

import React, { useState, useEffect } from 'react';
import Image, { ImageProps } from 'next/image';
import { cn } from '@/lib/utils';

interface LazyImageProps extends Omit<ImageProps, 'onLoad'> {
  src: string;
  alt: string;
  containerClassName?: string;
  blurUpEffect?: boolean;
  onLoadComplete?: () => void;
}

export function LazyImage({
  src,
  alt,
  containerClassName,
  blurUpEffect = true,
  onLoadComplete,
  className,
  ...props
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoadComplete?.();
  };

  const handleError = () => {
    setError(true);
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-card/30',
        blurUpEffect && !isLoaded && 'blur-sm',
        containerClassName,
      )}
    >
      {error ? (
        <div className="w-full h-full flex items-center justify-center bg-card text-muted">
          <span>Failed to load image</span>
        </div>
      ) : (
        <Image
          src={src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'transition-all duration-300',
            blurUpEffect && !isLoaded && 'blur-md',
            isLoaded && 'blur-0',
            className,
          )}
          {...props}
        />
      )}
    </div>
  );
}

/**
 * Preload an image
 */
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Hook for preloading images
 */
export function usePreloadImage(srcs: string[]) {
  useEffect(() => {
    srcs.forEach((src) => {
      preloadImage(src).catch((error) => {
        console.warn(`Failed to preload image: ${src}`, error);
      });
    });
  }, [srcs]);
}
