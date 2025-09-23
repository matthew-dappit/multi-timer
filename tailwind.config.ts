import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-poppins)", "sans-serif"],
      },
      colors: {
        dappit: {
          turquoise: "#01D9B5",
          coral: "#FF7F50",
          black: "#202020",
          gray: "#F3F3F3",
        },
      },
      letterSpacing: {
        dappit: "0.025em",
      },
      lineHeight: {
        dappit: "1.4",
      },
    },
  },
  plugins: [],
} satisfies Config;