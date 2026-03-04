import { Palette } from "@/constants/theme";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, BookOpen, ChevronRight } from "lucide-react-native";
import React from "react";
import {
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

const subjects = [
  { id: "math", title: "คณิตศาสตร์", color: "#3B82F6" },
  { id: "physics", title: "วิทยาศาสตร์", color: "#10B981" },
  { id: "thai", title: "ภาษาไทย", color: "#EC4899" },
  { id: "social", title: "สังคมศึกษา", color: "#F59E0B" },
  { id: "english", title: "ภาษาอังกฤษ", color: "#8B5CF6" },
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

export default function ChooseSubjectScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-surface-alt">
        {/* Gradient Header */}
        <View className="relative" style={{ paddingTop: insets.top }}>
          <Svg
            style={{ position: "absolute", top: 0, left: 0, right: 0 }}
            width="100%"
            height={160 + insets.top}
          >
            <Defs>
              <LinearGradient id="editGrad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={Palette.gradientStart} />
                <Stop offset="0.5" stopColor={Palette.gradientMid} />
                <Stop offset="1" stopColor={Palette.gradientEnd} />
              </LinearGradient>
            </Defs>
            <Rect
              width="100%"
              height={160 + insets.top}
              fill="url(#editGrad)"
            />
          </Svg>

          <View className="px-5 pt-2 pb-6">
            <View className="flex-row items-center mb-5">
              <TouchableOpacity
                onPress={() => router.back()}
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
                {id?.toUpperCase()}
              </Text>
            </View>

            <View className="flex-row items-center">
              <View className="w-14 h-14 rounded-2xl bg-white/20 items-center justify-center mr-4">
                <BookOpen size={28} color="white" strokeWidth={2} />
              </View>
              <View className="flex-1">
                <Text className="text-[26px] font-black text-white tracking-wide">
                  เลือกวิชา
                </Text>
                <Text className="text-sm text-white/90 mt-1">
                  เลือกวิชาที่ต้องการจัดการเนื้อหา
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Subject Cards */}
        <ScrollView
          className="flex-1 px-5 -mt-4"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 30 }}
        >
          {subjects.map((subject) => (
            <TouchableOpacity
              key={subject.id}
              className="bg-surface rounded-2xl p-5 mb-4 overflow-hidden"
              style={cardShadow}
              activeOpacity={0.7}
              onPress={() =>
                router.push(`/choosesubject/${id}-${subject.id}` as any)
              }
            >
              <View className="flex-row items-center">
                <View
                  className="w-14 h-14 rounded-xl items-center justify-center mr-4"
                  style={{ backgroundColor: `${subject.color}15` }}
                >
                  <Text
                    className="text-2xl font-black"
                    style={{ color: subject.color }}
                  >
                    {subject.title.charAt(0)}
                  </Text>
                </View>

                <View className="flex-1">
                  <Text className="text-lg font-bold text-brand-text mb-1">
                    {subject.title}
                  </Text>
                  <Text className="text-sm text-brand-muted">
                    จัดการเนื้อหาและบทเรียน
                  </Text>
                </View>

                <View
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: `${subject.color}10` }}
                >
                  <ChevronRight
                    size={20}
                    color={subject.color}
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
