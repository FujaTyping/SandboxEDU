import { Palette } from "@/constants/theme";
import { mockSubjects } from "@/data/mockData";
import { useRouter } from "expo-router";
import * as LucideIcons from "lucide-react-native";
import React from "react";
import {
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function LearnScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 30, paddingTop: insets.top + 16 }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>บทเรียน</Text>
      <Text style={styles.subtitle}>เลือกวิชาที่ต้องการเรียน</Text>

      {mockSubjects.map((subject, idx) => (
        <TouchableOpacity
          key={subject.id}
          style={[
            styles.subjectCard,
            {
              backgroundColor:
                Palette.subjectCards[idx % Palette.subjectCards.length],
            },
          ]}
          activeOpacity={0.85}
          onPress={() => router.push(`/subject/${subject.id}` as any)}
        >
          <View style={styles.cardContent}>
            <View
              style={[
                styles.subjectIcon,
                { backgroundColor: "rgba(255,255,255,0.15)" },
              ]}
            >
              {(() => {
                const IconComponent = (LucideIcons as any)[subject.icon];
                return IconComponent ? (
                  <IconComponent size={28} color="#fff" strokeWidth={2} />
                ) : null;
              })()}
            </View>
            <View style={styles.cardRight}>
              <View style={styles.cardHeader}>
                <Text style={styles.subjectName}>{subject.name}</Text>
                <Text style={styles.progressPercent}>{subject.progress}%</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${subject.progress}%`,
                      backgroundColor: subject.color,
                    },
                  ]}
                />
              </View>
            </View>
            <View style={styles.arrowWrap}>
              <Text style={styles.arrowIcon}>›</Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.surfaceAlt,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: Palette.text,
    paddingHorizontal: 24,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: Palette.textMuted,
    paddingHorizontal: 24,
    marginTop: 4,
    marginBottom: 20,
  },
  subjectCard: {
    marginHorizontal: 20,
    marginBottom: 14,
    borderRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: { elevation: 6 },
      default: {},
    }),
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
  },
  subjectIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  cardRight: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  subjectName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.7)",
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  arrowWrap: {
    marginLeft: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  arrowIcon: {
    fontSize: 20,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "700",
    marginTop: -2,
  },
});
