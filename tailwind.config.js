// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,ts,vue}'],
  theme: {
    extend: {
      borderRadius: { '2xl': '1rem' }
    }
  },
  plugins: []
};