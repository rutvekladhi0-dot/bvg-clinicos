/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6', // Secondary
          600: '#0d9488',
          700: '#0f766e', // Primary
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
        },
        primary: {
          DEFAULT: '#0F766E',
          hover: '#0D6861',
          light: '#F0FDFA',
          dark: '#115E59',
        },
        secondary: {
          DEFAULT: '#14B8A6',
          hover: '#0D9488',
          light: '#CCFBF1',
        },
        surface: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          800: '#1E293B',
          900: '#0F172A',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'card': '0 4px 6px -1px rgba(15, 118, 110, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        'card-hover': '0 10px 15px -3px rgba(15, 118, 110, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)',
      }
    },
  },
  plugins: [],
}
