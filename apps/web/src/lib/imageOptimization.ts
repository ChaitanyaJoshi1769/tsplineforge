/**
 * Image optimization utilities for responsive and performant images
 */

export interface ImageSizeConfig {
  size: number;
  quality?: number;
}

export interface ResponsiveImageConfig {
  src: string;
  alt: string;
  sizes?: {
    mobile: ImageSizeConfig;
    tablet: ImageSizeConfig;
    desktop: ImageSizeConfig;
  };
  priority?: boolean;
}

/**
 * Generate responsive image sizes for different breakpoints
 */
export function generateResponsiveImageSizes(config: ResponsiveImageConfig): string {
  const sizes = config.sizes || {
    mobile: { size: 375 },
    tablet: { size: 768 },
    desktop: { size: 1280 },
  };

  return `
    (max-width: 640px) ${sizes.mobile.size}px,
    (max-width: 1024px) ${sizes.tablet.size}px,
    ${sizes.desktop.size}px
  `.trim();
}

/**
 * Generate srcset for responsive images
 */
export function generateImageSrcSet(baseSrc: string, sizes: number[] = [1, 2]): string {
  return sizes
    .map((size) => {
      const url = new URL(baseSrc, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
      url.searchParams.set('w', String(url.searchParams.get('w') ? parseInt(url.searchParams.get('w')!) * size : 800 * size));
      url.searchParams.set('q', String(url.searchParams.get('q') || 75));
      return `${url.toString()} ${size}x`;
    })
    .join(', ');
}

/**
 * Get optimized image URL with specified width and quality
 */
export function getOptimizedImageUrl(
  src: string,
  width: number,
  quality: number = 75,
): string {
  const url = new URL(src, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
  url.searchParams.set('w', String(width));
  url.searchParams.set('q', String(quality));
  return url.toString();
}

/**
 * Generate blur data URL placeholder for LQIP (Low Quality Image Placeholder)
 */
export function generateBlurDataUrl(width: number = 10, height: number = 10): string {
  const canvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
  if (!canvas) return '';

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, width, height);

  return canvas.toDataURL();
}

/**
 * Check if WebP is supported
 */
export let webpSupported: boolean | null = null;

export function isWebPSupported(): Promise<boolean> {
  if (webpSupported !== null) {
    return Promise.resolve(webpSupported);
  }

  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }

    const webp = new Image();
    webp.onload = webp.onerror = () => {
      webpSupported = webp.height === 2;
      resolve(webpSupported);
    };
    webp.src =
      'data:image/webp;base64,UklGRjoKAABXQVBQTUEAAQAQCgAAAP4AAAP5AAAA';
  });
}

/**
 * Get image format based on support
 */
export async function getOptimalImageFormat(baseSrc: string): Promise<string> {
  const hasWebp = await isWebPSupported();
  if (hasWebp && !baseSrc.includes('.gif')) {
    return baseSrc.replace(/\.(jpg|jpeg|png)$/i, '.webp');
  }
  return baseSrc;
}
