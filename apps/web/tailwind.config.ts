import type { Config } from "tailwindcss";

const withAlpha = (name: string) => "rgb(var(--color-" + name + ") / <alpha-value>)";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: withAlpha("ink"),
        muted: withAlpha("muted"),
        surface: withAlpha("surface"),
        line: withAlpha("line"),
        trust: withAlpha("trust"),
        care: withAlpha("care"),
        saffron: withAlpha("saffron"),
        clinical: withAlpha("clinical"),
        danger: withAlpha("danger")
      },
      boxShadow: {
        soft: "0 20px 60px rgba(16, 125, 126, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
