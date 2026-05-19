/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#0a66c2',
          dark: '#004182',
          light: '#e8f0fe',
        },
      },
    },
  },
  plugins: [],
};
