import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Dark professional CAD theme
        background: '#0f0f0f',
        foreground: '#f5f5f5',
        card: '#1a1a1a',
        'card-hover': '#242424',
        border: '#333333',
        'border-light': '#444444',
        primary: '#3b82f6',
        'primary-dark': '#1e40af',
        secondary: '#8b5cf6',
        'secondary-dark': '#5b21b6',
        accent: '#ec4899',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
