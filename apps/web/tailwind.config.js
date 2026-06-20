/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        mochi: {
          50: "#FFF7F9",
          100: "#FFE9EE",
          200: "#FFD2DC",
          300: "#FFB6C1",
          400: "#FF95A6",
          500: "#FF7088",
          gold: "#E8C28A",
          cream: "#FFF5EC",
          ink: "#4A3540",
        },
      },
      fontFamily: {
        rounded: ["'Hiragino Maru Gothic ProN'", "'M PLUS Rounded 1c'", "system-ui", "sans-serif"],
        serif: ["'Noto Serif JP'", "serif"],
      },
      boxShadow: {
        mochi: "0 8px 24px -8px rgba(255, 150, 170, 0.45)",
        soft: "0 2px 12px rgba(0,0,0,0.04)",
      },
    },
  },
  plugins: [],
};
