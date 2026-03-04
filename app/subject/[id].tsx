import { Palette } from "@/constants/theme";
import { mockSubjects } from "@/data/mockData";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Check, ClipboardList, Lock, Play } from "lucide-react-native";
import React from "react";
import {
    Dimensions,
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Line } from "react-native-svg";

const { width: SCREEN_W } = Dimensions.get("window");

type IconComponent = React.ComponentType<{
  size: number;
  color: string;
  strokeWidth: number;
}>;
const statusConfig: Record<
  string,
  { icon: IconComponent; bg: string; ring: string }
> = {
  completed: { icon: Check, bg: Palette.success, ring: Palette.successLight },
  in_progress: { icon: Play, bg: Palette.primary, ring: Palette.primaryLight },
  locked: { icon: Lock, bg: Palette.textMuted, ring: Palette.disabled },
};
const examConfig: { icon: IconComponent; bg: string; ring: string } = {
  icon: ClipboardList,
  bg: Palette.exam,
  ring: Palette.examLight,
};

const activeGlowStyle = Platform.select({
  ios: {
    shadowColor: Palette.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
  },
  android: { elevation: 10 },
  default: {},
});

const bottomBarShadow = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  android: { elevation: 8 },
  default: {},
});

export default function SubjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const subject = mockSubjects.find((s) => s.id === id);

  if (!subject) {
    return (
      <View
        className="flex-1 bg-surface-alt"
        style={{ paddingTop: insets.top + 40 }}
      >
        <Text className="text-center text-brand-muted">ไม่พบวิชา</Text>
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
    <View className="flex-1 bg-surface-alt" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center px-5 py-3.5">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-[42px] h-[42px] rounded-[14px] bg-edge-light justify-center items-center mr-3.5"
        >
          <Text className="text-[28px] text-brand-text font-semibold -mt-0.5">
            ‹
          </Text>
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-2xl font-extrabold text-brand-text">
            {subject.name}
          </Text>
          <Text className="text-[13px] text-brand-muted mt-0.5">
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
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
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
                className="absolute w-[88px] items-center"
                style={{ left: pos.x - 44, top: pos.y - 44 }}
              >
                <View
                  className="w-[78px] h-[78px] rounded-full border-[3px] justify-center items-center"
                  style={{ borderColor: cfg.ring }}
                >
                  <View
                    className="w-16 h-16 rounded-full justify-center items-center"
                    style={[
                      { backgroundColor: cfg.bg },
                      isActive && activeGlowStyle,
                    ]}
                  >
                    <cfg.icon
                      size={isCompleted ? 26 : 22}
                      color="#fff"
                      strokeWidth={2}
                    />
                  </View>
                </View>
                <Text
                  className={`mt-2 text-[13px] font-semibold ${isActive ? "text-primary font-bold" : "text-brand-secondary"}`}
                >
                  {chapter.title}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Bottom progress bar */}
      <View
        className="px-6 pt-3.5 pb-5 bg-surface rounded-t-3xl"
        style={bottomBarShadow}
      >
        <View className="flex-row justify-between mb-2.5">
          <Text className="text-sm font-semibold text-brand-secondary">
            ความคืบหน้า
          </Text>
          <Text className="text-sm font-bold text-brand-text">
            {progressPercent}%
          </Text>
        </View>
        <View className="h-3 rounded-md bg-edge overflow-hidden">
          <View
            className="h-full rounded-md"
            style={{
              width: `${progressPercent}%`,
              backgroundColor: subject.color,
            }}
          />
        </View>
      </View>
    </View>
  );
}
