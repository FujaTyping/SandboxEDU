import { Palette } from "@/constants/theme";
import { mockSubjects } from "@/data/mockData";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
    Dimensions,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Line } from "react-native-svg";

const { width: SCREEN_W } = Dimensions.get("window");

const statusConfig: Record<string, { icon: string; bg: string; ring: string }> =
  {
    completed: { icon: "✓", bg: Palette.success, ring: Palette.successLight },
    in_progress: { icon: "▶", bg: Palette.primary, ring: Palette.primaryLight },
    locked: { icon: "🔒", bg: Palette.textMuted, ring: Palette.disabled },
  };
const examConfig = { icon: "📝", bg: Palette.exam, ring: Palette.examLight };

export default function SubjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const subject = mockSubjects.find((s) => s.id === id);

  if (!subject) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 40 }]}>
        <Text style={{ textAlign: "center", color: Palette.textMuted }}>
          ไม่พบวิชา
        </Text>
      </View>
    );
  }

  const completedCount = subject.chapters.filter(
    (c) => c.status === "completed",
  ).length;
  const totalCount = subject.chapters.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  const centerX = SCREEN_W / 2;
  const nodeSpacing = 150;
  const swingX = 80;

  const nodePositions = subject.chapters.map((_, index) => {
    const isLeft = index % 2 === 0;
    return {
      x: centerX + (isLeft ? -swingX : swingX),
      y: 70 + index * nodeSpacing,
    };
  });

  const contentHeight = 70 + subject.chapters.length * nodeSpacing + 40;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.subjectTitle}>{subject.name}</Text>
          <Text style={styles.subjectSubtitle}>
            {completedCount}/{totalCount} บทเรียน
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ height: contentHeight, position: "relative" }}>
          {/* Connecting lines */}
          <Svg
            style={StyleSheet.absoluteFill}
            width="100%"
            height={contentHeight}
          >
            {nodePositions.map((pos, index) => {
              if (index < nodePositions.length - 1) {
                const next = nodePositions[index + 1];
                return (
                  <Line
                    key={`line-${index}`}
                    x1={pos.x}
                    y1={pos.y + 38}
                    x2={next.x}
                    y2={next.y - 38}
                    stroke={Palette.disabled}
                    strokeWidth={2.5}
                    strokeDasharray="8,6"
                  />
                );
              }
              return null;
            })}
          </Svg>

          {/* Nodes */}
          {subject.chapters.map((chapter, index) => {
            const pos = nodePositions[index];
            const isExam = chapter.type === "exam";
            const cfg = isExam
              ? examConfig
              : statusConfig[chapter.status] || statusConfig.locked;
            const isCompleted = chapter.status === "completed";
            const isActive = chapter.status === "in_progress";

            return (
              <View
                key={chapter.id}
                style={[
                  styles.nodeContainer,
                  { left: pos.x - 44, top: pos.y - 44 },
                ]}
              >
                <View style={[styles.nodeRing, { borderColor: cfg.ring }]}>
                  <View
                    style={[
                      styles.nodeCircle,
                      { backgroundColor: cfg.bg },
                      isActive && styles.activeGlow,
                    ]}
                  >
                    <Text
                      style={[styles.nodeIcon, isCompleted && { fontSize: 26 }]}
                    >
                      {cfg.icon}
                    </Text>
                  </View>
                </View>
                <Text
                  style={[styles.nodeLabel, isActive && styles.activeLabelText]}
                >
                  {chapter.title}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Bottom progress bar */}
      <View style={styles.bottomBar}>
        <View style={styles.progressInfo}>
          <Text style={styles.progressLabel}>ความคืบหน้า</Text>
          <Text style={styles.progressValue}>{progressPercent}%</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${progressPercent}%`, backgroundColor: subject.color },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.surfaceAlt,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: Palette.borderLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  backIcon: {
    fontSize: 28,
    color: Palette.text,
    fontWeight: "600",
    marginTop: -2,
  },
  headerTextWrap: {
    flex: 1,
  },
  subjectTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: Palette.text,
  },
  subjectSubtitle: {
    fontSize: 13,
    color: Palette.textMuted,
    marginTop: 2,
  },
  nodeContainer: {
    position: "absolute",
    width: 88,
    alignItems: "center",
  },
  nodeRing: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  nodeCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  activeGlow: {
    ...Platform.select({
      ios: {
        shadowColor: Palette.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 14,
      },
      android: { elevation: 10 },
      default: {},
    }),
  },
  nodeIcon: {
    fontSize: 22,
    color: "#fff",
    fontWeight: "700",
  },
  nodeLabel: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: "600",
    color: Palette.textSecondary,
  },
  activeLabelText: {
    color: Palette.primary,
    fontWeight: "700",
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 20,
    backgroundColor: Palette.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
      },
      android: { elevation: 8 },
      default: {},
    }),
  },
  progressInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Palette.textSecondary,
  },
  progressValue: {
    fontSize: 14,
    fontWeight: "700",
    color: Palette.text,
  },
  progressBarBg: {
    height: 12,
    borderRadius: 6,
    backgroundColor: Palette.border,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 6,
  },
});
