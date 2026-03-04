import { Palette } from "@/constants/theme";
import { DownloadedVideo, getAllDownloadedVideos } from "@/lib/db/downloads";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { Download } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
  Dimensions,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SCREEN_W = Dimensions.get("window").width;

const gradeNameMap: Record<string, string> = {
  m1: "ม.1",
  m2: "ม.2",
  m3: "ม.3",
  m4: "ม.4",
  m5: "ม.5",
  m6: "ม.6",
};

const subjectColorMap: Record<string, string> = {
  math: "#3B82F6",
  physics: "#10B981",
  thai: "#EC4899",
  social: "#F59E0B",
  english: "#8B5CF6",
};

const cardShadow = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  android: { elevation: 4 },
  default: {},
});

interface GroupedSubject {
  subject_id: string;
  subject_name: string;
  grade: string;
  videos: DownloadedVideo[];
  avg_progress: number;
}

interface GroupedGrade {
  grade: string;
  subjects: GroupedSubject[];
}

function groupVideos(videos: DownloadedVideo[]): GroupedGrade[] {
  const gradeMap: Record<string, Record<string, DownloadedVideo[]>> = {};
  for (const v of videos) {
    if (!gradeMap[v.grade]) gradeMap[v.grade] = {};
    if (!gradeMap[v.grade][v.subject_id]) gradeMap[v.grade][v.subject_id] = [];
    gradeMap[v.grade][v.subject_id].push(v);
  }
  return Object.entries(gradeMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([grade, subjectMap]) => ({
      grade,
      subjects: Object.entries(subjectMap).map(([subject_id, vids]) => ({
        subject_id,
        subject_name: vids[0].subject_name,
        grade,
        videos: vids,
        avg_progress: Math.round(
          vids.reduce((s, v) => s + (v.watch_progress ?? 0), 0) / vids.length,
        ),
      })),
    }));
}

export default function LearnScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [groups, setGroups] = useState<GroupedGrade[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      getAllDownloadedVideos()
        .then((videos) => {
          setGroups(groupVideos(videos));
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }, []),
  );

  const CARD_GAP = 12;
  const CARD_W = (SCREEN_W - 48 - CARD_GAP) / 2;

  const subjectIcons: Record<string, string> = {
    math: "📐",
    physics: "⚗️",
    thai: "📖",
    social: "🌏",
    english: "💬",
  };

  const renderSubjectCard = (subject: GroupedSubject) => {
    const color = subjectColorMap[subject.subject_id] ?? Palette.primary;
    const completed = subject.videos.filter(
      (v) => (v.watch_progress ?? 0) >= 90,
    ).length;
    return (
      <TouchableOpacity
        key={`${subject.grade}-${subject.subject_id}`}
        style={[{ width: CARD_W }, cardShadow]}
        className="bg-surface rounded-2xl mb-3 overflow-hidden"
        activeOpacity={0.82}
        onPress={() =>
          router.push(`/lessons/${subject.subject_id}-${subject.grade}` as any)
        }
      >
        {/* Color header */}
        <View
          className="h-24 items-center justify-center"
          style={{ backgroundColor: color + "18" }}
        >
          <Text style={{ fontSize: 36 }}>
            {subjectIcons[subject.subject_id] ?? "📚"}
          </Text>
          <View
            className="absolute top-2 right-2 px-2 py-0.5 rounded-full"
            style={{ backgroundColor: color }}
          >
            <Text className="text-white text-[10px] font-black">
              {gradeNameMap[subject.grade] ?? subject.grade}
            </Text>
          </View>
        </View>
        <View className="p-3">
          <Text
            className="text-sm font-black text-brand-text"
            numberOfLines={1}
          >
            {subject.subject_name}
          </Text>
          <Text className="text-xs text-brand-muted mt-0.5">
            {subject.videos.length} บท · {completed}/{subject.videos.length}{" "}
            จบแล้ว
          </Text>
          {/* progress bar */}
          <View className="h-1.5 rounded-full bg-edge mt-2 overflow-hidden">
            <View
              className="h-full rounded-full"
              style={{
                width: `${subject.avg_progress}%`,
                backgroundColor: color,
              }}
            />
          </View>
          <Text className="text-[10px] text-brand-muted mt-1">
            {subject.avg_progress}%
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView
      className="flex-1 bg-surface-alt"
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 30 }}
      showsVerticalScrollIndicator={false}
    >
      <Text className="text-[28px] font-extrabold text-brand-text px-6 tracking-wide">
        บทเรียนของฉัน
      </Text>
      <Text className="text-sm text-brand-muted px-6 mt-1 mb-5">
        คลิปที่ดาวน์โหลดไว้สำหรับเรียน
      </Text>

      {loading ? (
        <View className="px-6">
          {[1, 2, 3].map((i) => (
            <View
              key={i}
              className="h-[220px] rounded-2xl bg-edge-light mb-4"
            />
          ))}
        </View>
      ) : groups.length === 0 ? (
        <View className="items-center justify-center px-8 py-24">
          <View className="w-24 h-24 rounded-full bg-primary-bg items-center justify-center mb-5">
            <Download size={40} color={Palette.primary} strokeWidth={1.5} />
          </View>
          <Text className="text-xl font-black text-brand-text mb-2 text-center">
            ยังไม่มีบทเรียน
          </Text>
          <Text className="text-sm text-brand-muted text-center leading-6">
            {"ไปที่ตั้งค่า → แก้ไขบทเรียน\nเพื่อดาวน์โหลดเนื้อหา"}
          </Text>
        </View>
      ) : (
        groups.map((gradeGroup) => (
          <View key={gradeGroup.grade} className="px-6 mb-6">
            {/* Grade header */}
            <View className="flex-row items-center mb-3">
              <View className="w-9 h-9 rounded-full bg-primary items-center justify-center mr-2.5">
                <Text className="text-white text-xs font-black">
                  {gradeNameMap[gradeGroup.grade] ?? gradeGroup.grade}
                </Text>
              </View>
              <Text className="text-lg font-extrabold text-brand-text">
                {gradeNameMap[gradeGroup.grade] ?? gradeGroup.grade}
              </Text>
              <View className="flex-1 h-px bg-edge ml-3" />
              <Text className="text-xs text-brand-muted ml-2">
                {gradeGroup.subjects.reduce(
                  (s, sub) => s + sub.videos.length,
                  0,
                )}{" "}
                บท
              </Text>
            </View>
            {/* Subject cards grid */}
            <View className="flex-row flex-wrap" style={{ gap: CARD_GAP }}>
              {gradeGroup.subjects.map(renderSubjectCard)}
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}
