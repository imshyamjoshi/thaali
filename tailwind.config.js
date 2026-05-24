/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#E85D04',
        secondary: '#F48C06',
        surface: '#FFF8F0',
        muted: '#6B7280',
      },
    },
  },
  plugins: [],
};
