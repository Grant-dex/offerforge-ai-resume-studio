/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "var(--brand-50)",
          100: "var(--brand-100)",
          500: "var(--brand-500)",
          600: "var(--brand-600)",
          700: "var(--brand-700)"
        },
        ink: "#14151A",
        muted: "#667085"
      },
      boxShadow: {
        soft: "0 18px 60px rgba(16, 24, 40, 0.08)",
        glow: "0 18px 45px rgba(255, 92, 0, 0.22)"
      }
    }
  },
  plugins: []
};
