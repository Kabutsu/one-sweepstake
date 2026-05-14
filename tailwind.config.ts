import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [
    // Profile gradient classes from profile-colors.ts
    { pattern: /^from-(blue|purple|green|orange|cyan|violet|rose|teal|amber|indigo)-(500)$/ },
    { pattern: /^to-(indigo|pink|emerald|red|blue|purple|pink|cyan|orange|blue)-(500)$/ },
    { pattern: /^(from|to)-(blue|purple|green|orange|cyan|violet|rose|teal|amber|indigo)-(300|400|500|600)$/ },
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#107C11",
          50: "#E8F5E9",
          100: "#C8E6C9",
          200: "#A5D6A7",
          300: "#81C784",
          400: "#66BB6A",
          500: "#107C11",
          600: "#0E6B0E",
          700: "#0C5A0C",
          800: "#0A4A0A",
          900: "#083908",
        },
        background: {
          light: "#FAFAFA",
          dark: "#0A0A0A",
        },
        surface: {
          light: "#FFFFFF",
          dark: "#1A1A1A",
        },
        text: {
          light: "#0A0A0A",
          dark: "#FAFAFA",
        },
      },
      animation: {
        "fade-in": "fade-in 0.2s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
        "slide-down": "slide-down 0.3s ease-out",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "slide-down": {
          "0%": { transform: "translateY(-10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
