/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './*.html', './src/**/*.{js,ts}'],
  theme: {
    extend: {
      colors: {
        ink: '#0b0d10',
        'steel-900': '#1b1f24',
        'steel-700': '#2c3238',
        'steel-500': '#3c444d',
        silver: '#b8bdc5',
        white: '#e7eaee',
        'ceradon-blue': '#1e57c8'
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
};
