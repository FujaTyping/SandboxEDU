import { Palette } from "@/constants/theme";
import { Stack, useRouter } from "expo-router";
import { ArrowLeft, BookOpen, ChevronRight } from "lucide-react-native";
import React, { useMemo } from "react";
import {
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

const lessons = [
  { id: "m1", title: "ม.1", subtitle: "มัธยมศึกษาปีที่ 1", color: "#3B82F6" },
  { id: "m2", title: "ม.2", subtitle: "มัธยมศึกษาปีที่ 2", color: "#8B5CF6" },
  { id: "m3", title: "ม.3", subtitle: "มัธยมศึกษาปีที่ 3", color: "#EC4899" },
  { id: "m4", title: "ม.4", subtitle: "มัธยมศึกษาปีที่ 4", color: "#F59E0B" },
  { id: "m5", title: "ม.5", subtitle: "มัธยมศึกษาปีที่ 5", color: "#10B981" },
  { id: "m6", title: "ม.6", subtitle: "มัธยมศึกษาปีที่ 6", color: "#EF4444" },
];

const cardShadow = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  android: { elevation: 6 },
  default: {},
});

export default function EditLessonScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // สร้าง unique gradient ID เพื่อป้องกัน caching issue
  const gradientId = useMemo(() => `lessonGrad-${Date.now()}`, []);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-surface-alt">
        {/* Gradient Header */}
        <View className="relative">
          <Svg
            style={{ position: "absolute", top: 0, left: 0, right: 0 }}
            width="100%"
            height={160 + insets.top}
          >
            <Defs>
              <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={Palette.gradientStart} />
                <Stop offset="0.5" stopColor={Palette.gradientMid} />
                <Stop offset="1" stopColor={Palette.gradientEnd} />
              </LinearGradient>
            </Defs>
            <Rect
              width="100%"
              height={160 + insets.top}
              fill={`url(#${gradientId})`}
            />
          </Svg>

          <View className="px-5 pb-6" style={{ paddingTop: insets.top + 8 }}>
            {/* Header with back button and title */}
            <View className="flex-row items-center mb-5">
              <TouchableOpacity
                onPress={() => router.push("/(tabs)/settings" as any)}
                className="w-10 h-10 rounded-full bg-white/20 items-center justify-center mr-3"
                activeOpacity={0.7}
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.15,
                  shadowRadius: 4,
                }}
              >
                <ArrowLeft size={20} color="white" strokeWidth={2.5} />
              </TouchableOpacity>
              <Text className="text-xl font-bold text-white tracking-wide">
                แก้ไขบทเรียน
              </Text>
            </View>

            {/* Main header content */}
            <View className="flex-row items-center">
              <View className="w-14 h-14 rounded-2xl bg-white/20 items-center justify-center mr-4">
                <BookOpen size={28} color="white" strokeWidth={2} />
              </View>
              <View className="flex-1">
                <Text className="text-[26px] font-black text-white tracking-wide">
                  จัดการบทเรียน
                </Text>
                <Text className="text-sm text-white/90 mt-1">
                  เลือกระดับชั้นที่ต้องการจัดการ
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Lesson Cards */}
        <ScrollView
          className="flex-1 px-5 -mt-4"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 30 }}
        >
          {lessons.map((lesson, index) => (
            <TouchableOpacity
              key={lesson.id}
              className="bg-surface rounded-2xl p-5 mb-4 overflow-hidden"
              style={cardShadow}
              activeOpacity={0.7}
              onPress={() => router.push(`/editlesson/${lesson.id}` as any)}
            >
              <View className="flex-row items-center">
                <View
                  className="w-14 h-14 rounded-xl items-center justify-center mr-4"
                  style={{ backgroundColor: `${lesson.color}15` }}
                >
                  <Text
                    className="text-2xl font-black"
                    style={{ color: lesson.color }}
                  >
                    {lesson.title}
                  </Text>
                </View>

                <View className="flex-1">
                  <Text className="text-lg font-bold text-brand-text mb-1">
                    {lesson.subtitle}
                  </Text>
                  <Text className="text-sm text-brand-muted">
                    จัดการวิชาและเนื้อหาบทเรียน
                  </Text>
                </View>

                <View
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: `${lesson.color}10` }}
                >
                  <ChevronRight
                    size={20}
                    color={lesson.color}
                    strokeWidth={2.5}
                  />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </>
  );
}
