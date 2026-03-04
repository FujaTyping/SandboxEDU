import { Palette } from "@/constants/theme";
import { DownloadedVideo, getAllDownloadedVideos } from "@/lib/db/downloads";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import {
  BookOpen,
  ChevronRight,
  Download,
  PlayCircle,
} from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
  Image,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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

  const renderEmpty = () => (
    <View className="flex-1 items-center justify-center px-8 py-24">
      <View className="w-24 h-24 rounded-full bg-primary-bg items-center justify-center mb-5">
        <Download size={40} color={Palette.primary} strokeWidth={1.5} />
      </View>
      <Text className="text-xl font-black text-brand-text mb-2 text-center">
        ยังไม่มีบทเรียน
      </Text>
      <Text className="text-sm text-brand-muted text-center leading-6">
        ไปที่ตั้งค่า → แก้ไขบทเรียน{"\n"}เพื่อดาวน์โหลดเนื้อหา
      </Text>
    </View>
  );

  const renderVideoCard = (video: DownloadedVideo) => {
    const color = subjectColorMap[video.subject_id] ?? Palette.primary;
    const progress = video.watch_progress ?? 0;
    return (
      <TouchableOpacity
        key={video.video_id}
        className="bg-surface rounded-2xl mb-3 overflow-hidden"
        style={cardShadow}
        activeOpacity={0.8}
        onPress={() => router.push(`/video/${video.video_id}` as any)}
      >
        {/* Thumbnail */}
        <View className="w-full h-[160px] bg-edge-light relative">
          {video.thumbnail_url ? (
            <Image
              source={{ uri: video.thumbnail_url }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <View
              className="w-full h-full items-center justify-center"
              style={{ backgroundColor: color + "15" }}
            >
              <BookOpen size={36} color={color} strokeWidth={1.5} />
            </View>
          )}
          {/* Play overlay */}
          <View className="absolute inset-0 items-center justify-center">
            <View className="w-12 h-12 rounded-full bg-black/40 items-center justify-center">
              <PlayCircle size={28} color="white" strokeWidth={1.5} />
            </View>
          </View>
          {/* Grade badge */}
          <View
            className="absolute top-2 right-2 px-2 py-0.5 rounded-md"
            style={{ backgroundColor: color }}
          >
            <Text className="text-white text-xs font-bold">
              {gradeNameMap[video.grade] ?? video.grade}
            </Text>
          </View>
        </View>

        <View className="p-3">
          <Text
            className="text-sm font-bold text-brand-text mb-1"
            numberOfLines={2}
          >
            {video.title}
          </Text>
          <Text className="text-xs text-brand-muted mb-2">
            {video.subject_name}
          </Text>
          {/* Progress bar */}
          <View className="h-1.5 rounded-full bg-edge overflow-hidden">
            <View
              className="h-full rounded-full"
              style={{ width: `${progress}%`, backgroundColor: color }}
            />
          </View>
          <Text className="text-xs text-brand-muted mt-1">
            {progress}% เรียนแล้ว
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSubjectSection = (subject: GroupedSubject) => {
    const color = subjectColorMap[subject.subject_id] ?? Palette.primary;
    return (
      <View key={`${subject.grade}-${subject.subject_id}`} className="mb-6">
        {/* Subject header */}
        <TouchableOpacity
          className="flex-row items-center mb-3 px-1"
          activeOpacity={0.7}
          onPress={() => router.push(`/subject/${subject.subject_id}` as any)}
        >
          <View
            className="w-8 h-8 rounded-xl items-center justify-center mr-2.5"
            style={{ backgroundColor: color + "20" }}
          >
            <BookOpen size={16} color={color} strokeWidth={2} />
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-brand-text">
              {subject.subject_name}
            </Text>
            <Text className="text-xs text-brand-muted">
              {subject.videos.length} บทเรียน · เฉลี่ย {subject.avg_progress}%
            </Text>
          </View>
          {/* Subject progress mini bar */}
          <View className="w-20 h-2 rounded-full bg-edge overflow-hidden mr-2">
            <View
              className="h-full rounded-full"
              style={{
                width: `${subject.avg_progress}%`,
                backgroundColor: color,
              }}
            />
          </View>
          <ChevronRight size={16} color={Palette.textMuted} strokeWidth={2} />
        </TouchableOpacity>

        {subject.videos.map(renderVideoCard)}
      </View>
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
        renderEmpty()
      ) : (
        groups.map((gradeGroup) => (
          <View key={gradeGroup.grade} className="px-6 mb-4">
            {/* Grade header */}
            <View className="flex-row items-center mb-4">
              <View className="w-8 h-8 rounded-full bg-primary items-center justify-center mr-2">
                <Text className="text-white text-xs font-black">
                  {gradeNameMap[gradeGroup.grade] ?? gradeGroup.grade}
                </Text>
              </View>
              <Text className="text-lg font-extrabold text-brand-text">
                {gradeNameMap[gradeGroup.grade] ?? gradeGroup.grade}
              </Text>
              <View className="flex-1 h-px bg-edge ml-3" />
            </View>

            {gradeGroup.subjects.map(renderSubjectSection)}
          </View>
        ))
      )}
    </ScrollView>
  );
}
