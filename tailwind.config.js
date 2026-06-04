/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#533afd",
        "primary-deep": "#4434d4",
        "primary-press": "#2e2b8c",
        "primary-soft": "#665efd",
        "brand-dark-900": "#1c1e54",
        ink: "#0d253d",
        "ink-secondary": "#273951",
        "ink-mute": "#64748d",
        canvas: "#ffffff",
        "canvas-soft": "#f6f9fc",
        "canvas-cream": "#f5e9d4",
        hairline: "#e3e8ee",
        ruby: "#ea2261",
        magenta: "#f96bee",
      },
      spacing: {
        xxs: "2px",
        xs: "4px",
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "24px",
        xxl: "32px",
        huge: "64px",
      },
      borderRadius: {
        xs: "4px",
        sm: "6px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        pill: "9999px",
      },
    },
  },
  plugins: [],
};
