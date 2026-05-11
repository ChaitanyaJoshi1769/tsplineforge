import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // ========== COLOR SYSTEM ==========
      colors: {
        // Primary Brand Color (Modern Blue)
        primary: {
          DEFAULT: '#3b82f6',
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        // Secondary Color (Purple)
        secondary: {
          DEFAULT: '#8b5cf6',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
        },
        // Accent Color (Pink)
        accent: {
          DEFAULT: '#ec4899',
          400: '#f472b6',
          500: '#ec4899',
          600: '#db2777',
        },
        // Status Colors
        success: {
          DEFAULT: '#10b981',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
        },
        warning: {
          DEFAULT: '#f59e0b',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        error: {
          DEFAULT: '#ef4444',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
        },
        info: {
          DEFAULT: '#0ea5e9',
          400: '#22d3ee',
          500: '#0ea5e9',
          600: '#0284c7',
        },

        // Neutral/Background Colors (Premium Dark Theme)
        background: '#0f0f0f',
        foreground: '#f5f5f5',
        card: '#1a1a1a',
        'card-hover': '#242424',
        border: '#333333',
        'border-light': '#444444',
        muted: '#71717a',
        subtle: '#27272a',
      },

      // ========== TYPOGRAPHY ==========
      fontSize: {
        xs: ['12px', { lineHeight: '1.4', letterSpacing: '0.01em' }],
        sm: ['13px', { lineHeight: '1.5', letterSpacing: '0.005em' }],
        base: ['14px', { lineHeight: '1.6', letterSpacing: '0em' }],
        lg: ['16px', { lineHeight: '1.6', letterSpacing: '0em' }],
        xl: ['18px', { lineHeight: '1.5', letterSpacing: '-0.01em' }],
        '2xl': ['24px', { lineHeight: '1.3', letterSpacing: '-0.02em' }],
        '3xl': ['28px', { lineHeight: '1.3', letterSpacing: '-0.02em' }],
        '4xl': ['36px', { lineHeight: '1.2', letterSpacing: '-0.03em' }],
        '5xl': ['48px', { lineHeight: '1.2', letterSpacing: '-0.03em' }],
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['Fira Code', 'Monaco', 'monospace'],
      },
      fontWeight: {
        thin: '100',
        extralight: '200',
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
      },

      // ========== SPACING & LAYOUT ==========
      spacing: {
        // Standard spacing scale
        0: '0',
        0.5: '2px',
        1: '4px',
        1.5: '6px',
        2: '8px',
        2.5: '10px',
        3: '12px',
        3.5: '14px',
        4: '16px',
        5: '20px',
        6: '24px',
        7: '28px',
        8: '32px',
        9: '36px',
        10: '40px',
        12: '48px',
        14: '56px',
        16: '64px',
        20: '80px',
        24: '96px',
        28: '112px',
        32: '128px',
      },

      // ========== SHADOWS (Elevation System) ==========
      boxShadow: {
        none: 'none',
        xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        inset: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
        'inset-lg': 'inset 0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        // Glow effects
        'glow-primary': '0 0 20px rgba(59, 130, 246, 0.4)',
        'glow-secondary': '0 0 20px rgba(139, 92, 246, 0.4)',
        'glow-accent': '0 0 20px rgba(236, 72, 153, 0.4)',
      },

      // ========== BORDER RADIUS ==========
      borderRadius: {
        none: '0',
        sm: '4px',
        md: '6px',
        lg: '8px',
        xl: '12px',
        '2xl': '16px',
        '3xl': '24px',
        full: '9999px',
      },

      // ========== ANIMATIONS ==========
      animation: {
        // Entrance animations
        'fade-in': 'fadeIn 300ms ease-out forwards',
        'slide-up': 'slideUp 300ms ease-out forwards',
        'slide-down': 'slideDown 300ms ease-out forwards',
        'slide-in-right': 'slideInRight 300ms ease-out forwards',
        'scale-in': 'scaleIn 300ms ease-out forwards',

        // State animations
        'spin-slow': 'spin 3s linear infinite',
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-subtle': 'bounceSubtle 2s infinite',

        // Interactive animations
        'button-press': 'buttonPress 150ms cubic-bezier(0.4, 0, 0.2, 1)',
        'shake': 'shake 400ms cubic-bezier(0.36, 0, 0.66, 1)',

        // Loading animations
        'shimmer': 'shimmer 2s infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
      },
      keyframes: {
        // Entrance keyframes
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(-10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },

        // Subtle bounce
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-2px)' },
        },

        // Button press effect
        buttonPress: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.98)' },
          '100%': { transform: 'scale(1)' },
        },

        // Shake animation for errors
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-2px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(2px)' },
        },

        // Shimmer (skeleton loading)
        shimmer: {
          '-100%': { backgroundPosition: '-100%' },
          '100%': { backgroundPosition: '100%' },
        },

        // Glow pulse
        glowPulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },

      // ========== TRANSITIONS ==========
      transitionDuration: {
        default: '300ms',
        fast: '150ms',
        slow: '500ms',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
        ease: 'ease',
        'ease-in': 'ease-in',
        'ease-out': 'ease-out',
      },

      // ========== FILTERS & EFFECTS ==========
      backdropFilter: {
        none: 'none',
        blur: 'blur(12px)',
      },

      // ========== BREAKPOINTS ==========
      screens: {
        xs: '320px',
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      },

      // ========== Z-INDEX ==========
      zIndex: {
        hide: '-1',
        auto: 'auto',
        0: '0',
        10: '10',
        20: '20',
        30: '30',
        40: '40',
        50: '50',
        dropdown: '1000',
        sticky: '1020',
        fixed: '1030',
        'modal-backdrop': '1040',
        modal: '1050',
        popover: '1060',
        tooltip: '1070',
        toast: '1080',
      },
    },
  },
  plugins: [],
};

export default config;
