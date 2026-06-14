import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        butter: "#F4EBD9", // page background
        paper: "#FFFDF8", // cards / surfaces
        herb: "#1C2E50", // primary brand, header, headings, primary buttons (deep blue)
        herbsoft: "#2E4A7C", // secondary blue
        saffron: "#E0962B", // ratings, highlights, accents
        berry: "#B23A3A", // make-again heart, destructive actions
        ink: "#22293A", // body text (blue-tinted)
        muted: "#707788", // secondary text
        line: "#E3D9C2", // borders / dividers
      },
      fontFamily: {
        display: ['"Fraunces"', "Georgia", "serif"],
        body: ['"DM Sans"', "system-ui", "sans-serif"],
        hand: ['"Caveat"', "cursive"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(34, 41, 58, 0.06), 0 8px 24px rgba(34, 41, 58, 0.08)",
        lift: "0 4px 8px rgba(34, 41, 58, 0.08), 0 16px 40px rgba(34, 41, 58, 0.12)",
      },
      borderRadius: {
        card: "14px",
      },
    },
  },
  plugins: [],
} satisfies Config;
