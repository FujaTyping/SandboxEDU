/**
 * Single Source of Truth for all app colors
 * Used by both Tailwind config and inline styles
 */

export const AppColors = {
  // Primary brand - Blue theme
  primary: "#3B82F6", // blue-500
  primaryLight: "#93C5FD", // blue-300
  primaryDark: "#1E40AF", // blue-700
  primaryBg: "#EFF6FF", // blue-50

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

  // Gradient stops for header - Blue gradient
  gradientStart: "#1E3A8A", // blue-900
  gradientMid: "#2563EB", // blue-600
  gradientEnd: "#93C5FD", // blue-300

  // Subject card backgrounds (bright, modern colors)
  subjectCards: ["#3B82F6", "#14B8A6", "#8B5CF6", "#F59E0B"],

  // Donut chart pairs
  donutStudy: { color: "#3B82F6", end: "#93C5FD", track: "#DBEAFE" },
  donutExam: { color: "#F59E0B", end: "#FBBF24", track: "#FEF3C7" },

  // Bar chart gradient - Blue gradient
  barStart: "#3B82F6",
  barEnd: "#93C5FD",
} as const;

// Export as Palette for backward compatibility
export const Palette = AppColors;
