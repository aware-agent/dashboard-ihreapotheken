import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['"Palanquin"', 'sans-serif'],
        diatype: ['"Palanquin"', 'sans-serif'],
        serif: ['"Palanquin Dark"', 'sans-serif'],
      },
      colors: {
        /* Semantic colors (shadcn compatible) */
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },

        /* Foundation Colors */
        foundation: {
          white: "hsl(var(--foundation-white))",
          sodium: "hsl(var(--foundation-sodium))",
          grey500: "hsl(var(--foundation-grey500))",
          boron: "hsl(var(--foundation-boron))",
          blue700: "hsl(var(--foundation-blue700))",
          blue200: "hsl(var(--foundation-blue200))",
          magnesium400: "hsl(var(--foundation-magnesium400))",
          manganese: "hsl(var(--foundation-manganese))",
          selenium: "hsl(var(--foundation-selenium))",
          red400: "hsl(var(--foundation-red400))",
          green700: "hsl(var(--foundation-green700))",
          yellow500: "hsl(var(--foundation-yellow500))",
        },

        /* Background Colors */
        bg: {
          white: "hsl(var(--bg-white))",
          sodium: "hsl(var(--bg-sodium))",
          green50: "hsl(var(--bg-green50))",
          red50: "hsl(var(--bg-red50))",
          yellow50: "hsl(var(--bg-yellow50))",
          blue50: "hsl(var(--bg-blue50))",
          magnesium50: "hsl(var(--bg-magnesium50))",
          linen: "hsl(var(--bg-linen))",
        },

        /* Text Colors */
        text: {
          white: "hsl(var(--text-white))",
          boron: "hsl(var(--text-boron))",
          grey500: "hsl(var(--text-grey500))",
          danger: "hsl(var(--text-danger))",
          yellow500: "hsl(var(--text-yellow500))",
          green700: "hsl(var(--text-green700))",
          magnesium400: "hsl(var(--text-magnesium400))",
          red400: "hsl(var(--text-red400))",
          blue700: "hsl(var(--text-blue700))",
        },

        /* Health Markers */
        hm: {
          inrange200: "hsl(var(--hm-inrange200))",
          inrange50: "hsl(var(--hm-inrange50))",
          outofrange: "hsl(var(--hm-outofrange))",
          "outofrange-bg": "hsl(var(--hm-outofrange-bg))",
          danger: "hsl(var(--hm-danger))",
          "danger-bg": "hsl(var(--hm-danger-bg))",
          selenium: "hsl(var(--hm-selenium))",
          optimal50: "hsl(var(--hm-optimal50))",
          optimal100: "hsl(var(--hm-optimal100))",
          optimal200: "hsl(var(--hm-optimal200))",
          normal50: "hsl(var(--hm-normal50))",
          normal100: "hsl(var(--hm-normal100))",
          normal200: "hsl(var(--hm-normal200))",
          moderaterisk50: "hsl(var(--hm-moderaterisk50))",
          moderaterisk100: "hsl(var(--hm-moderaterisk100))",
          moderaterisk200: "hsl(var(--hm-moderaterisk200))",
          highlow50: "hsl(var(--hm-highlow50))",
          highlow100: "hsl(var(--hm-highlow100))",
          highlow200: "hsl(var(--hm-highlow200))",
          high50: "hsl(var(--hm-high50))",
          high100: "hsl(var(--hm-high100))",
          high200: "hsl(var(--hm-high200))",
          danger50: "hsl(var(--hm-danger50))",
          danger100: "hsl(var(--hm-danger100))",
          danger200: "hsl(var(--hm-danger200))",
        },

        /* Health Zones */
        hz: {
          blood: "hsl(var(--hz-blood))",
          blood600: "hsl(var(--hz-blood600))",
          blood300: "hsl(var(--hz-blood300))",
          heart: "hsl(var(--hz-heart))",
          heart600: "hsl(var(--hz-heart600))",
          heart300: "hsl(var(--hz-heart300))",
          hormones: "hsl(var(--hz-hormones))",
          hormones600: "hsl(var(--hz-hormones600))",
          hormones300: "hsl(var(--hz-hormones300))",
          immunity: "hsl(var(--hz-immunity))",
          immunity600: "hsl(var(--hz-immunity600))",
          immunity300: "hsl(var(--hz-immunity300))",
          kidneys: "hsl(var(--hz-kidneys))",
          kidneys600: "hsl(var(--hz-kidneys600))",
          kidneys300: "hsl(var(--hz-kidneys300))",
          liver: "hsl(var(--hz-liver))",
          liver600: "hsl(var(--hz-liver600))",
          liver300: "hsl(var(--hz-liver300))",
          metabolism: "hsl(var(--hz-metabolism))",
          metabolism600: "hsl(var(--hz-metabolism600))",
          metabolism300: "hsl(var(--hz-metabolism300))",
          minerals: "hsl(var(--hz-minerals))",
          minerals600: "hsl(var(--hz-minerals600))",
          minerals300: "hsl(var(--hz-minerals300))",
          vitamins: "hsl(var(--hz-vitamins))",
          vitamins600: "hsl(var(--hz-vitamins600))",
          vitamins300: "hsl(var(--hz-vitamins300))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "dot-pop": {
          "0%": { transform: "translate(-50%, -50%) scale(0)", opacity: "0" },
          "60%": { transform: "translate(-50%, -50%) scale(1.2)", opacity: "1" },
          "100%": { transform: "translate(-50%, -50%) scale(1)", opacity: "1" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-out-left": {
          "0%": { opacity: "1", transform: "translateX(0)" },
          "100%": { opacity: "0", transform: "translateX(-20px)" },
        },
        "slide-out-right": {
          "0%": { opacity: "1", transform: "translateX(0)" },
          "100%": { opacity: "0", transform: "translateX(20px)" },
        },
        "sparkle": {
          "0%, 100%": { opacity: "1", transform: "scale(1) rotate(0deg)" },
          "50%": { opacity: "0.8", transform: "scale(1.1) rotate(5deg)" },
        },
        "sparkle-pulse": {
          "0%, 100%": { opacity: "0.5", transform: "scale(0.8)" },
          "50%": { opacity: "1", transform: "scale(1.2)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "dot-pop": "dot-pop 0.4s ease-out forwards",
        "fade-in": "fade-in 0.35s ease-out",
        "slide-up": "slide-up 0.4s ease-out",
        "slide-out-left": "slide-out-left 0.15s ease-out",
        "slide-out-right": "slide-out-right 0.15s ease-out",
        "sparkle": "sparkle 1.5s ease-in-out infinite",
        "sparkle-pulse": "sparkle-pulse 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
