import { BarChart } from "@/components/BarChart";
import { DonutChart } from "@/components/DonutChart";
import { Palette } from "@/constants/theme";
import { mockDailyStudy, mockUser } from "@/data/mockData";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: Palette.surfaceAlt }]}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Gradient header */}
      <View style={[styles.headerWrap, { paddingTop: insets.top }]}>
        <Svg
          style={StyleSheet.absoluteFill}
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

        <View style={styles.headerContent}>
          <View style={styles.avatarRing}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarEmoji}>🏞️</Text>
            </View>
          </View>
          <Text style={styles.userName}>{mockUser.name}</Text>
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeValue}>{mockUser.age}</Text>
              <Text style={styles.badgeLabel}>ปี</Text>
            </View>
            <View style={styles.badgeDivider} />
            <View style={styles.badge}>
              <Text style={styles.badgeValue}>{mockUser.grade}</Text>
              <Text style={styles.badgeLabel}>ชั้นเรียน</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Statistics section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: Palette.text }]}>
          สถิติภาพรวม
        </Text>
        <View style={styles.chartsRow}>
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
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: Palette.text }]}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerWrap: {
    overflow: "hidden",
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    minHeight: 280,
  },
  headerContent: {
    alignItems: "center",
    paddingVertical: 28,
  },
  avatarRing: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 3,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarEmoji: {
    fontSize: 44,
  },
  userName: {
    marginTop: 14,
    fontSize: 26,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.5,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  badge: {
    alignItems: "center",
    paddingHorizontal: 12,
  },
  badgeValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  badgeLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
    marginTop: 2,
  },
  badgeDivider: {
    width: 1,
    height: 28,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 16,
  },
  chartsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
});
