import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e3a5f",
          900: "#0a1628",
        },
        aida: {
          dark: "#0a1628",
          primary: "#1e3a5f",
          accent: "#3b82f6",
          cyan: "#06b6d4",
          light: "#f1f5f9",
          highlight: "#06b6d4",
        },
      },
    },
  },
  plugins: [],
};

export default config;
