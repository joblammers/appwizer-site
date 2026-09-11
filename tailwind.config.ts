import type { Config } from "tailwindcss";

/*
 * Alleen nodig als het project op Tailwind v3 draait.
 *
 * Controleer met: npm ls tailwindcss
 * Staat er 4.x, gebruik dan globals.css met het @theme-blok en gooi dit
 * bestand weg — v4 leest het niet.
 */
const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "appwizer-orange": "#DF7D3C",
        "appwizer-blue": "#5C94CD",
      },
    },
  },
  plugins: [],
};

export default config;
