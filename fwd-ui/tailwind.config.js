/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        title: ['Cormorant', 'serif'],
        body: ['Crete Round', 'serif'],
      },
      colors: {
        beige: {
          DEFAULT: '#F5E6D3',
          dark: '#E6D7C3',
        },
        charcoal: {
          DEFAULT: '#2D3142',
          light: '#4F5569',
        },
      },
    },
  },
  plugins: [],
}

