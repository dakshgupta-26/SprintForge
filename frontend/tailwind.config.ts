import type { Config } from "tailwindcss";

// In Tailwind v4, theme tokens live in globals.css @theme block.
// This file is kept for content scanning and any plugin configuration.
const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
};

export default config;
