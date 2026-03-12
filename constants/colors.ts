/**
 * Single Source of Truth for all app colors
 * Fixed theme: Sky/Cerulean Blue + Gold + White (no auto dark mode)
 */

export const AppColors = {
  // Primary — Sky Blue
  primary: "#0EA5E9", // sky-500
  primaryLight: "#38BDF8", // sky-400
  primaryDark: "#0284C7", // sky-600
  primaryBg: "#E0F2FE", // sky-100

  // Accent — Amber / Gold
  accent: "#F59E0B", // amber-500
  accentLight: "#FDE68A", // amber-200
  accentDark: "#B45309", // amber-700

  // Semantic
  success: "#10B981",
  successLight: "#D1FAE5",
  info: "#0EA5E9",
  infoLight: "#E0F2FE",
  warning: "#F59E0B",
  danger: "#EF4444",
  dangerLight: "#FEE2E2",
  dangerBorder: "#FECACA",
  exam: "#8B5CF6",
  examLight: "#EDE9FE",

  // Neutrals
  text: "#0F172A",
  textSecondary: "#334155",
  textMuted: "#64748B",
  surface: "#FFFFFF",
  surfaceAlt: "#F0F9FF", // sky-50
  border: "#BAE6FD", // sky-200
  borderLight: "#E0F2FE", // sky-100
  disabled: "#94A3B8",

  // Gradient — sky blue diagonal
  gradientStart: "#0284C7", // sky-600
  gradientMid: "#0EA5E9", // sky-500
  gradientEnd: "#38BDF8", // sky-400

  // Subject card backgrounds
  subjectCards: ["#0EA5E9", "#F59E0B", "#8B5CF6", "#10B981"],

  // Donut chart pairs
  donutStudy: { color: "#0EA5E9", end: "#38BDF8", track: "#E0F2FE" },
  donutExam: { color: "#F59E0B", end: "#FDE68A", track: "#FFFBEB" },

  // Bar chart
  barStart: "#0EA5E9",
  barEnd: "#38BDF8",
} as const;

// DarkColors kept as alias to AppColors — auto theme disabled
export const DarkColors = AppColors;

// Palette — single fixed theme
export const Palette = AppColors;
