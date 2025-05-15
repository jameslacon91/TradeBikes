import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
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
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"), 
    require("@tailwindcss/typography"),
    require("daisyui")
  ],
  daisyui: {
    themes: [
      {
        tradebikes: {
          "primary": "#1D5D9B",      // Deep blue primary
          "primary-focus": "#154980", // Darker blue for focus states
          "primary-content": "#FFFFFF", // White text on primary
          "secondary": "#121212",    // Near black for secondary elements
          "secondary-focus": "#0A0A0A", // Darker black for focus states
          "secondary-content": "#FFFFFF", // White text on secondary
          "accent": "#75C2F6",       // Light blue accent
          "accent-focus": "#5EB7F4",  // Slightly darker accent for focus
          "accent-content": "#FFFFFF", // White text on accent
          "neutral": "#1A1A1A",       // Dark gray/black neutral
          "neutral-focus": "#121212", // Darker gray for focus states
          "neutral-content": "#FFFFFF", // White text on neutral
          "base-100": "#FFFFFF",      // White for clean, modern feel
          "base-200": "#F2F2F2",      // Very light gray for secondary surfaces
          "base-300": "#E6E6E6",      // Light gray for tertiary surfaces
          "base-content": "#1F1F1F",  // Near-black for text on base colors
          "info": "#3ABFF8",         // Standard info blue
          "success": "#36D399",      // Success green
          "warning": "#FBBD23",      // Warning yellow
          "error": "#F87272",        // Error red
          
          // Custom properties
          "--rounded-box": "0.5rem",   // Border radius for larger elements
          "--rounded-btn": "0.25rem",  // Border radius for buttons
          "--btn-text-case": "uppercase", // Uppercase text for buttons
          "--border-btn": "1px",      // Border width for buttons
          "--tab-border": "2px",      // Border width for tabs
          "--tab-radius": "0.5rem",   // Border radius for tabs
        },
      },
    ],
    darkTheme: "dark",
    base: true,
    styled: true,
    utils: true,
  },
} satisfies Config;
