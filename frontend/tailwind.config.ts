import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fdfbf7',
          100: '#f5ecd8',
          200: '#ecdcc0',
          300: '#dfc9a4',
          400: '#d2b68a',
          500: '#c5a880',
          600: '#b5966d',
          700: '#9c7f59',
          800: '#6e5a3f',
          900: '#4b3c29',
          950: '#2a2118',
        },
        lux: {
          cream: '#fbfbfa',
          gold: '#c5a880',
          'gold-dark': '#b5966d',
          'gold-light': '#dfc9a4',
          charcoal: '#121212',
          midnight: '#0a0a0a',
        },
      },
      boxShadow: {
        'lux': '0 4px 24px -1px rgba(0, 0, 0, 0.04), 0 2px 8px -1px rgba(0, 0, 0, 0.02)',
        'lux-lg': '0 10px 40px -3px rgba(0, 0, 0, 0.06), 0 4px 16px -2px rgba(0, 0, 0, 0.03)',
        'lux-gold': '0 4px 20px -2px rgba(197, 168, 128, 0.15)',
        'lux-hover': '0 14px 44px -4px rgba(0, 0, 0, 0.08), 0 6px 20px -3px rgba(0, 0, 0, 0.04)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        countPulse: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in': 'scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'shimmer': 'shimmer 2s infinite linear',
        'count-pulse': 'countPulse 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

export default config
