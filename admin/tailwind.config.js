/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f3ff',
          100: '#ede9fe',
          500: '#6C63FF',
          600: '#5A52E0',
          700: '#4840C0',
        },
        ink: '#14151A',
      },
      boxShadow: {
        soft: '0 2px 18px rgba(16,24,40,0.06)',
        card: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)',
      },
    },
  },
  plugins: [],
}
