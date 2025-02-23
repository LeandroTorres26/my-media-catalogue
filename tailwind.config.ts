import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        main: {
          "50": "#fefee8",
          "100": "#fefec3",
          "200": "#fffa89",
          "300": "#fef146",
          "400": "#fbe00d",
          "500": "#ebc807",
          "600": "#cb9b03",
          "700": "#a27006",
          "800": "#86580d",
          "900": "#714712",
          "950": "#422506",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
