/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './*.html', './src/**/*.{js,ts}'],
  theme: {
    extend: {
      colors: {
        ink: '#04070d',
        'steel-900': '#0b1220',
        'steel-700': '#18243a',
        'steel-500': '#2a3a55',
        silver: '#c5cbd6',
        white: '#f4f6fb',
        'ceradon-blue': '#2b78ff',
        'ceradon-sky': '#56b7ff'
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
};
