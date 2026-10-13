import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "var(--ink-950)",
          900: "var(--ink-900)",
          850: "var(--ink-850)",
          800: "var(--ink-800)",
          700: "var(--ink-700)",
        },
        fg: {
          DEFAULT: "var(--fg)",
          dim: "var(--fg-dim)",
          mute: "var(--fg-mute)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          ice: "var(--accent-ice)",
          lime: "var(--accent-lime)",
        },
        line: {
          DEFAULT: "var(--line)",
          strong: "var(--line-strong)",
        },
      },
      borderRadius: {
        xl2: "1.4rem",
        xl3: "2rem",
        xl4: "2.75rem",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(1.2rem)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        breathe: {
          "0%, 100%": { opacity: "0.35", transform: "scale(1)" },
          "50%": { opacity: "0.7", transform: "scale(1.06)" },
        },
        sweep: {
          from: { transform: "translateX(-120%)" },
          to: { transform: "translateX(220%)" },
        },
        "pulse-ring": {
          "0%": { opacity: "0.6", transform: "scale(0.85)" },
          "100%": { opacity: "0", transform: "scale(1.5)" },
        },
        drift: {
          "0%, 100%": { transform: "translate3d(0,0,0)" },
          "50%": { transform: "translate3d(2%, -3%, 0)" },
        },
      },
      animation: {
        "fade-up": "fade-up .55s cubic-bezier(.22,1,.36,1) both",
        breathe: "breathe 4.5s ease-in-out infinite",
        sweep: "sweep 2.8s cubic-bezier(.4,0,.2,1) infinite",
        "pulse-ring": "pulse-ring 2.4s ease-out infinite",
        drift: "drift 18s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
