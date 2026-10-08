/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef7f1",
          100: "#d7ecdf",
          200: "#b0d9bf",
          300: "#7fbf9b",
          400: "#4f9e76",
          500: "#2f7d59",
          600: "#1f5c40", // primary buttons / links
          700: "#194a34", // navbar / header
          800: "#153d2b", // hero background
          900: "#0f2e20", // deepest shade
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 46, 32, 0.06), 0 1px 3px rgba(15, 46, 32, 0.08)",
        "card-hover": "0 10px 25px -5px rgba(15, 46, 32, 0.15), 0 4px 8px -2px rgba(15, 46, 32, 0.08)",
        premium: "0 25px 50px -12px rgba(15, 46, 32, 0.25), 0 8px 16px -4px rgba(15, 46, 32, 0.1)",
      },
    },
  },
  plugins: [],
};
