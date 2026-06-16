/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        surface: "hsl(var(--card))",
        "surface-light": "hsl(var(--muted))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          hover: "hsl(18 80% 45%)",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          hover: "hsl(43 74% 60%)",
        },
        accent: "hsl(var(--accent))",
        muted: "hsl(var(--muted-foreground))",
        border: "hsl(var(--border))",
      },
      fontFamily: {
        sans: ["Outfit", "Inter", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 20px rgba(242, 91, 24, 0.15)",
        "glow-purple": "0 0 20px rgba(224, 187, 112, 0.15)",
      },
    },
  },
  plugins: [],
}
