import { BarChart } from "@/components/BarChart";
import { DonutChart } from "@/components/DonutChart";
import { Palette } from "@/constants/theme";
import { mockDailyStudy, mockUser } from "@/data/mockData";
import { User } from "lucide-react-native";
import React from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      className="flex-1 bg-surface-alt"
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Gradient header */}
      <View
        className="overflow-hidden rounded-b-4xl min-h-[280px]"
        style={{ paddingTop: insets.top }}
      >
        <Svg
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          width="100%"
          height="100%"
          preserveAspectRatio="none"
        >
          <Defs>
            <LinearGradient id="hg" x1="0" y1="0" x2="0.3" y2="1">
              <Stop offset="0" stopColor={Palette.gradientStart} />
              <Stop offset="0.5" stopColor={Palette.gradientMid} />
              <Stop offset="1" stopColor={Palette.gradientEnd} />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#hg)" />
        </Svg>

        <View className="items-center py-7">
          <View className="w-[110px] h-[110px] rounded-full border-[3px] border-white/35 justify-center items-center">
            <View className="w-24 h-24 rounded-full bg-white/15 border-[3px] border-white justify-center items-center">
              <User size={44} color="rgba(255,255,255,0.9)" strokeWidth={1.5} />
            </View>
          </View>
          <Text className="mt-3.5 text-[26px] font-extrabold text-white tracking-wide">
            {mockUser.name}
          </Text>
          <View className="flex-row items-center mt-3 bg-white/15 rounded-2xl px-6 py-2">
            <View className="items-center px-3">
              <Text className="text-lg font-bold text-white">
                {mockUser.age}
              </Text>
              <Text className="text-[11px] text-white/70 mt-0.5">ปี</Text>
            </View>
            <View className="w-px h-7 bg-white/30" />
            <View className="items-center px-3">
              <Text className="text-lg font-bold text-white">
                {mockUser.grade}
              </Text>
              <Text className="text-[11px] text-white/70 mt-0.5">
                ชั้นเรียน
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Statistics section */}
      <View className="mt-6 px-5">
        <Text className="text-[17px] font-bold text-brand-text mb-4">
          สถิติภาพรวม
        </Text>
        <View className="flex-row justify-around">
          <DonutChart
            percentage={mockUser.studyProgress}
            label="เรียนไปแล้ว"
            color={Palette.donutStudy.color}
            gradientEnd={Palette.donutStudy.end}
            backgroundColor={Palette.donutStudy.track}
          />
          <DonutChart
            percentage={mockUser.examScore}
            label="คะแนนสอบ"
            color={Palette.donutExam.color}
            gradientEnd={Palette.donutExam.end}
            backgroundColor={Palette.donutExam.track}
          />
        </View>
      </View>

      {/* Bar chart section */}
      <View className="mt-6 px-5">
        <Text className="text-[17px] font-bold text-brand-text mb-4">
          เรียนแต่ละวัน (ชั่วโมง)
        </Text>
        <BarChart
          data={mockDailyStudy}
          colorStart={Palette.barStart}
          colorEnd={Palette.barEnd}
          maxHeight={150}
        />
      </View>
    </ScrollView>
  );
}
