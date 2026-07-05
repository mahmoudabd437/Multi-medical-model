import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        medical: {
          50: '#edfdfb',
          100: '#c6fbf2',
          200: '#92f2e6',
          300: '#52e7d6',
          400: '#24d4c4',
          500: '#0fb3a6',
          600: '#0d9088',
          700: '#106f6a',
          800: '#135957',
          900: '#124a4a',
        },
        slateglass: {
          50: 'rgb(var(--surface-strong) / 0.05)',
          100: 'rgb(var(--surface-strong) / 0.1)',
          200: 'rgb(var(--surface-strong) / 0.15)',
          300: 'rgb(var(--surface-strong) / 0.2)',
          400: 'rgb(var(--surface-strong) / 0.3)',
          500: 'rgb(var(--surface-strong) / 0.45)',
          600: 'rgb(var(--surface-strong) / 0.6)',
          700: 'rgb(var(--surface-strong) / 0.75)',
          800: 'rgb(var(--surface-strong) / 0.88)',
          900: 'rgb(var(--surface-strong) / 0.96)',
        },
      },
      boxShadow: {
        soft: '0 24px 90px rgba(2, 6, 23, 0.32)',
        glow: '0 0 0 1px rgba(255, 255, 255, 0.08), 0 24px 80px rgba(15, 179, 166, 0.14)',
      },
      backgroundImage: {
        'medical-radial':
          'radial-gradient(circle at top left, rgba(15, 179, 166, 0.22), transparent 28%), radial-gradient(circle at top right, rgba(59, 130, 246, 0.14), transparent 24%), radial-gradient(circle at bottom left, rgba(168, 85, 247, 0.08), transparent 22%)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(18px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '0.75' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        float: 'float 7s ease-in-out infinite',
        'fade-up': 'fade-up 0.7s ease-out both',
        'pulse-soft': 'pulse-soft 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
