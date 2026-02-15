import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        aida: { dark: "#1a1a2e", primary: "#16213e", accent: "#0f3460", highlight: "#e94560" },
      },
    },
  },
  plugins: [],
};
export default config;
