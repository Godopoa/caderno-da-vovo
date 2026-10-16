/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FFFDF9',
          100: '#FAF5EB',
          200: '#F2E8D5',
          300: '#E5D5B7',
        },
        charcoal: {
          900: '#1C1917',
          800: '#292524',
          700: '#44403C',
        },
        leaf: {
          700: '#15803D',
          800: '#166534',
          900: '#14532D',
        },
        terracotta: {
          600: '#EA580C',
          700: '#C2410C',
          800: '#9A3412',
        },
      },
    },
  },
  plugins: [],
};
