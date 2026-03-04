const { AppColors } = require("./constants/colors");

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
        // Primary brand - imported from colors.ts
        primary: {
          DEFAULT: AppColors.primary,
          light: AppColors.primaryLight,
          dark: AppColors.primaryDark,
          bg: AppColors.primaryBg,
        },
        // Accent
        accent: {
          DEFAULT: AppColors.accent,
          light: AppColors.accentLight,
          dark: AppColors.accentDark,
        },
        // Semantic - imported from colors.ts
        success: {
          DEFAULT: AppColors.success,
          light: AppColors.successLight,
        },
        info: {
          DEFAULT: AppColors.info,
          light: AppColors.infoLight,
        },
        warning: AppColors.warning,
        danger: {
          DEFAULT: AppColors.danger,
          light: AppColors.dangerLight,
          border: AppColors.dangerBorder,
        },
        exam: {
          DEFAULT: AppColors.exam,
          light: AppColors.examLight,
        },
        // Neutrals / surface - imported from colors.ts
        surface: {
          DEFAULT: AppColors.surface,
          alt: AppColors.surfaceAlt,
        },
        // Text - imported from colors.ts
        brand: {
          text: AppColors.text,
          secondary: AppColors.textSecondary,
          muted: AppColors.textMuted,
          disabled: AppColors.disabled,
        },
        // Borders - imported from colors.ts
        edge: {
          DEFAULT: AppColors.border,
          light: AppColors.borderLight,
        },
        // Gradient stops - imported from colors.ts
        grad: {
          start: AppColors.gradientStart,
          mid: AppColors.gradientMid,
          end: AppColors.gradientEnd,
        },
      },
      borderRadius: {
        "2xl": 20,
        "3xl": 24,
        "4xl": 32,
      },
    },
  },
  plugins: [],
};
