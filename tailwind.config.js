/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Tokens are channel triplets in index.css, so <alpha-value> works:
        // a hex token here would silently drop every bg-*/text-*/border-* opacity class.
        background: 'rgb(var(--color-bg) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        border: 'rgb(var(--color-border) / <alpha-value>)',
        'border-light': 'rgb(var(--color-border-light) / <alpha-value>)',
        primary: {
          DEFAULT: 'rgb(var(--color-primary) / <alpha-value>)',
          light: 'rgb(var(--color-primary-light) / <alpha-value>)',
          dark: 'rgb(var(--color-primary-dark) / <alpha-value>)',
          foreground: 'rgb(var(--color-primary-contrast) / <alpha-value>)',
          // Same token as `foreground`; `text-primary-contrast` is what the call sites use.
          contrast: 'rgb(var(--color-primary-contrast) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'rgb(var(--color-secondary) / <alpha-value>)',
          light: 'rgb(var(--color-secondary-light) / <alpha-value>)',
          dark: 'rgb(var(--color-secondary-dark) / <alpha-value>)',
        },
        // The equipped pastel accent: buttons only, never ink.
        accent: {
          DEFAULT: 'rgb(var(--color-accent) / <alpha-value>)',
          foreground: 'rgb(var(--color-accent-contrast) / <alpha-value>)',
        },
        success: {
          DEFAULT: 'rgb(var(--color-success) / <alpha-value>)',
          light: 'rgb(var(--color-success-light) / <alpha-value>)',
          bg: 'rgb(var(--color-success-bg) / <alpha-value>)',
          ink: 'rgb(var(--color-success-ink) / <alpha-value>)',
        },
        warning: {
          DEFAULT: 'rgb(var(--color-warning) / <alpha-value>)',
          light: 'rgb(var(--color-warning-light) / <alpha-value>)',
          bg: 'rgb(var(--color-warning-bg) / <alpha-value>)',
          ink: 'rgb(var(--color-warning-ink) / <alpha-value>)',
        },
        danger: {
          DEFAULT: 'rgb(var(--color-danger) / <alpha-value>)',
          light: 'rgb(var(--color-danger-light) / <alpha-value>)',
          bg: 'rgb(var(--color-danger-bg) / <alpha-value>)',
          ink: 'rgb(var(--color-danger-ink) / <alpha-value>)',
        },
        text: {
          primary: 'rgb(var(--color-text-primary) / <alpha-value>)',
          secondary: 'rgb(var(--color-text-secondary) / <alpha-value>)',
          tertiary: 'rgb(var(--color-text-tertiary) / <alpha-value>)',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        sans: ['DM Sans', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      borderRadius: {
        sm: '0.5rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.5rem',
        '2xl': '2rem',
        full: '9999px',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
      },
      keyframes: {
        pulseBorder: {
          '0%': { transform: 'scale(1)', boxShadow: '0 0 5px rgba(245, 158, 11, 0.4)' },
          '100%': { transform: 'scale(1.1)', boxShadow: '0 0 15px rgba(245, 158, 11, 0.8)' },
        },
        flameBorder: {
          '0%': { transform: 'scale(1) rotate(-2deg)', boxShadow: '0 0 6px rgba(239, 68, 68, 0.5)' },
          '100%': { transform: 'scale(1.08) rotate(2deg)', boxShadow: '0 0 18px rgba(239, 68, 68, 0.9)' },
        },
        rainbowBorder: {
          '0%': { filter: 'hue-rotate(0deg)' },
          '100%': { filter: 'hue-rotate(360deg)' },
        },
        modalPop: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        floatXP: {
          '0%': { transform: 'translateY(0) scale(0.8)', opacity: '1' },
          '100%': { transform: 'translateY(-40px) scale(1.1)', opacity: '0' },
        },
      },
      animation: {
        'spark-border': 'pulseBorder 1.5s infinite alternate',
        'fire-border': 'flameBorder 1s infinite alternate',
        'rainbow-border': 'rainbowBorder 3s linear infinite',
        'modal-pop': 'modalPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'float-xp': 'floatXP 1s ease-out forwards',
      },
    },
  },
  plugins: [],
};
