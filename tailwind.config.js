/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        background: "#030304", // Deep black
        foreground: "#FFFFFF",
        card: "#0A0A0C",
        cardForeground: "#FFFFFF",
        primary: {
          DEFAULT: "#22C55E", // Green
          foreground: "#000000",
        },
        secondary: {
          DEFAULT: "#1E1E22",
          foreground: "#A1A1AA",
        },
        muted: {
          DEFAULT: "#1E1E22",
          foreground: "#A1A1AA",
        },
        accent: {
          DEFAULT: "#1E1E22",
          foreground: "#FFFFFF",
        },
        border: "#27272A",
        input: "#1E1E22",
        ring: "#22C55E", // Green ring
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'trae-gradient': 'linear-gradient(90deg, #22C55E 0%, #16A34A 100%)', // Green gradient
      },
    },
  },
  plugins: [],
};
