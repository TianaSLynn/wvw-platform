import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        // WVW Brand
        navy: {
          DEFAULT: "#0F1C3F",
          50:  "#e8ebf3",
          100: "#c5cce0",
          200: "#9faacb",
          300: "#7888b5",
          400: "#5a6fa5",
          500: "#3c5694",
          600: "#2e4582",
          700: "#1e3169",
          800: "#142354",
          900: "#0F1C3F",
          950: "#080f22",
        },
        gold: {
          DEFAULT: "#C9A84C",
          50:  "#fdf8ec",
          100: "#f9eed0",
          200: "#f2d99d",
          300: "#ebc46a",
          400: "#e4b040",
          500: "#C9A84C",
          600: "#b08c2f",
          700: "#8f6e24",
          800: "#6e551c",
          900: "#4d3c13",
        },
        sage: {
          DEFAULT: "#6B8F71",
          50:  "#f0f4f1",
          100: "#d9e5db",
          200: "#b4cbb8",
          300: "#8daf93",
          400: "#6B8F71",
          500: "#567259",
          600: "#435847",
          700: "#324035",
          800: "#222c25",
          900: "#111815",
        },
        risk: {
          strong:    "#22c55e",
          stable:    "#f59e0b",
          "at-risk": "#f97316",
          "high-risk": "#ef4444",
        },
        // shadcn/ui semantic tokens (CSS variables driven)
        border:      "hsl(var(--border))",
        input:       "hsl(var(--input))",
        ring:        "hsl(var(--ring))",
        background:  "hsl(var(--background))",
        foreground:  "hsl(var(--foreground))",
        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", ...fontFamily.sans],
      },
      boxShadow: {
        card:       "0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px -1px rgba(0,0,0,0.05)",
        "card-hover":"0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.06)",
        nav:        "2px 0 8px 0 rgba(0,0,0,0.15)",
        "inner-sm": "inset 0 1px 2px 0 rgba(0,0,0,0.05)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to:   { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-scale": {
          from: { opacity: "0", transform: "scale(0.97) translateY(4px)" },
          to:   { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        "slide-in-left": {
          from: { transform: "translateX(-100%)" },
          to:   { transform: "translateX(0)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(8px)" },
          to:   { opacity: "1", transform: "translateX(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "pulse-gold": {
          "0%, 100%": { opacity: "1" },
          "50%":       { opacity: "0.4" },
        },
      },
      animation: {
        "accordion-down":  "accordion-down 0.2s cubic-bezier(0.23, 1, 0.32, 1)",
        "accordion-up":    "accordion-up 0.2s cubic-bezier(0.23, 1, 0.32, 1)",
        "fade-in":         "fade-in 0.25s cubic-bezier(0.23, 1, 0.32, 1)",
        "fade-up":         "fade-up 0.3s cubic-bezier(0.23, 1, 0.32, 1)",
        "fade-in-scale":   "fade-in-scale 0.2s cubic-bezier(0.23, 1, 0.32, 1)",
        "slide-in-left":   "slide-in-left 0.25s cubic-bezier(0.23, 1, 0.32, 1)",
        "slide-in-right":  "slide-in-right 0.2s cubic-bezier(0.23, 1, 0.32, 1)",
        shimmer:           "shimmer 1.5s infinite",
        "pulse-gold":      "pulse-gold 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
