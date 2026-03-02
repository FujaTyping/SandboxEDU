/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from "react-native";

/**
 * Unified App Palette — warm emerald/teal education theme
 */
export const Palette = {
  // Primary brand
  primary: "#0D9488", // teal-600
  primaryLight: "#5EEAD4", // teal-300
  primaryDark: "#115E59", // teal-800
  primaryBg: "#F0FDFA", // teal-50

  // Accent (warm amber for highlights / CTAs)
  accent: "#F59E0B", // amber-500
  accentLight: "#FDE68A", // amber-200
  accentDark: "#B45309", // amber-700

  // Semantic
  success: "#10B981", // emerald-500
  successLight: "#A7F3D0", // emerald-200
  info: "#3B82F6", // blue-500
  infoLight: "#BFDBFE", // blue-200
  warning: "#F59E0B",
  danger: "#EF4444", // red-500
  dangerLight: "#FEE2E2", // red-100
  dangerBorder: "#FECACA", // red-200
  exam: "#8B5CF6", // violet-500
  examLight: "#DDD6FE", // violet-200

  // Neutrals
  text: "#1E293B", // slate-800
  textSecondary: "#64748B", // slate-500
  textMuted: "#94A3B8", // slate-400
  surface: "#FFFFFF",
  surfaceAlt: "#F8FAFC", // slate-50
  border: "#E2E8F0", // slate-200
  borderLight: "#F1F5F9", // slate-100
  disabled: "#CBD5E1", // slate-300

  // Gradient stops for header
  gradientStart: "#0F4C4C",
  gradientMid: "#0D7D73",
  gradientEnd: "#5EEAD4",

  // Subject card backgrounds (bright, modern colors)
  subjectCards: ["#14B8A6", "#3B82F6", "#8B5CF6", "#F59E0B"],

  // Donut chart pairs  [stroke, gradientEnd, track]
  donutStudy: { color: "#0D9488", end: "#5EEAD4", track: "#CCFBF1" },
  donutExam: { color: "#F59E0B", end: "#FBBF24", track: "#FEF3C7" },

  // Bar chart gradient
  barStart: "#0D9488",
  barEnd: "#5EEAD4",
};

const tintColorLight = Palette.primary;
const tintColorDark = "#fff";

export const Colors = {
  light: {
    text: Palette.text,
    background: Palette.surface,
    tint: tintColorLight,
    icon: Palette.textMuted,
    tabIconDefault: Palette.textMuted,
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: "#ECEDEE",
    background: "#151718",
    tint: tintColorDark,
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
