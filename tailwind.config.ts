import { type Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        "roboto-mono": ["Roboto Mono", "monospace"],
        "noto-sans": ["Noto Sans", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
