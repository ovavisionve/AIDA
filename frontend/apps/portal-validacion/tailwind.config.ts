import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
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
