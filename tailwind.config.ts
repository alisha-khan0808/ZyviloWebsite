import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: { DEFAULT: "1.25rem", md: "2rem" }, screens: { "2xl": "1240px" } },
    extend: {
      colors: {
        bg: "#FCFAFF",
        lavender: "#F3ECFF",
        navy: "#080B2C",
        purple: { DEFAULT: "#7300FF", 600: "#6400E0", 700: "#5600C2" },
        lilac: "#B89CFF",
        muted: "#5E6075",
        line: "#E8DFF5",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      borderRadius: { "2xl": "1rem", "3xl": "1.5rem" },
      boxShadow: {
        card: "0 1px 2px rgba(8,11,44,0.04), 0 8px 24px -12px rgba(76,29,149,0.14)",
        glow: "0 10px 40px -10px rgba(115,0,255,0.45)",
      },
      keyframes: {
        flow: { "0%": { transform: "translateX(-100%)" }, "100%": { transform: "translateX(400%)" } },
        flowY: { "0%": { transform: "translateY(-100%)" }, "100%": { transform: "translateY(400%)" } },
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-6px)" } },
        ping2: { "0%": { transform: "scale(1)", opacity: "0.6" }, "100%": { transform: "scale(1.8)", opacity: "0" } },
      },
      animation: {
        flow: "flow 1.2s linear infinite",
        flowY: "flowY 1.2s linear infinite",
        float: "float 6s ease-in-out infinite",
        ping2: "ping2 1.6s ease-out infinite",
      },
    },
  },
  plugins: [require("@tailwindcss/container-queries")],
};
export default config;
