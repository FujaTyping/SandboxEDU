/**
 * Single Source of Truth for all app colors
 * Theme: Primary Blue #2A6EDF + Vibrant Orange #FF8C00 + Dark Blue Shadow #1A458B
 */

export const AppColors = {
  // Primary — Primary Blue
  primary: "#2A6EDF",
  primaryLight: "#5B93F0",
  primaryDark: "#1A458B",
  primaryBg: "#E8EFFC",

  // Accent — Vibrant Orange (highlights, important icons)
  accent: "#FF8C00",
  accentLight: "#FFD580",
  accentDark: "#CC7000",

  // Semantic
  success: "#10B981",
  successLight: "#D1FAE5",
  info: "#2A6EDF",
  infoLight: "#E8EFFC",
  warning: "#FF8C00",
  danger: "#EF4444",
  dangerLight: "#FEE2E2",
  dangerBorder: "#FECACA",
  exam: "#FF8C00",
  examLight: "#FFF3E0",

  // Neutrals
  text: "#0F172A",
  textSecondary: "#334155",
  textMuted: "#64748B",
  surface: "#FFFFFF",
  surfaceAlt: "#F4F7FD",
  border: "#E0E0E0",
  borderLight: "#EEEEEE",
  disabled: "#E0E0E0",

  // Gradient — Dark Blue → Primary Blue
  gradientStart: "#1A458B",
  gradientMid: "#2A6EDF",
  gradientEnd: "#5B93F0",

  // Subject card backgrounds
  subjectCards: ["#2A6EDF", "#FF8C00", "#8B5CF6", "#10B981"],

  // Donut chart pairs
  donutStudy: { color: "#2A6EDF", end: "#5B93F0", track: "#E8EFFC" },
  donutExam: { color: "#FF8C00", end: "#FFD580", track: "#FFF3E0" },

  // Bar chart
  barStart: "#2A6EDF",
  barEnd: "#5B93F0",
} as const;

// DarkColors kept as alias to AppColors — auto theme disabled
export const DarkColors = AppColors;

// Palette — single fixed theme
export const Palette = AppColors;
