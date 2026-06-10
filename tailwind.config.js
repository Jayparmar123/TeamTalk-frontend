/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Support toggling dark mode via class
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#060814',
          card: '#0D1127',
          border: '#1D264A',
          text: '#E5E7EB'
        },
        primary: {
          DEFAULT: '#8B5CF6',
          dark: '#7C3AED',
          light: '#C084FC'
        },
        accent: {
          green: '#10B981',
          indigo: '#3B82F6',
          rose: '#F43F5E'
        }
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
