import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#13201f",
        muted: "#62706d",
        surface: "#f7fbfa",
        line: "#d9e6e2",
        trust: "#107d7e",
        care: "#2f9b73",
        saffron: "#b45309",
        clinical: "#e7f4f1",
        danger: "#b42318"
      },
      boxShadow: {
        soft: "0 20px 60px rgba(16, 125, 126, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
