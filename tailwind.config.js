/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./data/**/*.{js,jsx,ts,tsx}",
    "./constants/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0D9488",
          light: "#5EEAD4",
          dark: "#115E59",
          bg: "#F0FDFA",
        },
        accent: {
          DEFAULT: "#F59E0B",
          light: "#FDE68A",
          dark: "#B45309",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          alt: "#F8FAFC",
        },
        brand: {
          text: "#1E293B",
          muted: "#94A3B8",
          secondary: "#64748B",
          border: "#E2E8F0",
          disabled: "#CBD5E1",
        },
      },
    },
  },
  plugins: [],
};
