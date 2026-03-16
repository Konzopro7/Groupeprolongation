/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eff7ff",
          100: "#dceeff",
          200: "#bfe0ff",
          300: "#92ccff",
          400: "#5caeff",
          500: "#328cf5",
          600: "#1b6fdb",
          700: "#1958b1",
          800: "#1a4a8f",
          900: "#1b3f75",
        },
        accent: {
          500: "#0ea5a2",
          600: "#0d8e8c",
        },
      },
      boxShadow: {
        soft: "0 12px 30px rgba(16, 70, 112, 0.12)",
        elevate: "0 22px 45px rgba(16, 70, 112, 0.16)",
        glow: "0 0 0 1px rgba(50, 140, 245, 0.25), 0 14px 38px rgba(28, 83, 135, 0.25)",
      },
      fontFamily: {
        heading: ["Sora", "sans-serif"],
        body: ["Manrope", "sans-serif"],
      },
      keyframes: {
        floatSoft: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseRing: {
          "0%": { boxShadow: "0 0 0 0 rgba(50, 140, 245, 0.32)" },
          "100%": { boxShadow: "0 0 0 16px rgba(50, 140, 245, 0)" },
        },
      },
      animation: {
        floatSoft: "floatSoft 6s ease-in-out infinite",
        fadeUp: "fadeUp 500ms ease-out both",
        pulseRing: "pulseRing 1.8s ease-out infinite",
      },
    },
  },
  plugins: [],
};
