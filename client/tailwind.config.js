/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#080b11",
        surface: "#101622",
        "surface-light": "#1b2536",
        primary: {
          DEFAULT: "#00f2fe",
          hover: "#00c8fe",
        },
        secondary: {
          DEFAULT: "#8a2be2",
          hover: "#7b1fa2",
        },
        accent: "#4facfe",
        muted: "#64748b",
        border: "#1e293b",
      },
      fontFamily: {
        sans: ["Outfit", "Inter", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 20px rgba(0, 242, 254, 0.15)",
        "glow-purple": "0 0 20px rgba(138, 43, 226, 0.15)",
      },
    },
  },
  plugins: [],
}
