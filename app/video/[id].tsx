import { Palette } from "@/constants/theme";
import { DownloadedVideo, deleteDownloadedVideo, getVideoById, updateWatchProgress } from "@/lib/db/downloads";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, BookOpen, ClipboardList, Play, Trash2 } from "lucide-react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

const { width: SCREEN_W } = Dimensions.get("window");

const subjectColorMap: Record<string, string> = {
  math: "#3B82F6",
  physics: "#10B981",
  thai: "#EC4899",
  social: "#F59E0B",
  english: "#8B5CF6",
};

const gradeNameMap: Record<string, string> = {
  m1: "ม.1", m2: "ม.2", m3: "ม.3", m4: "ม.4", m5: "ม.5", m6: "ม.6",
};

const cardShadow = Platform.select({
  ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
  android: { elevation: 4 },
  default: {},
});

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const mockChapters = [
  { id: "ch1", title: "บทนำ", duration: 480, watched: true },
  { id: "ch2", title: "เนื้อหาหลัก", duration: 720, watched: true },
  { id: "ch3", title: "ตัวอย่างโจทย์", duration: 600, watched: false },
  { id: "ch4", title: "สรุป", duration: 300, watched: false },
];

export default function VideoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const gradientId = useMemo(() => `videoGrad-${Date.now()}`, []);

  const [video, setVideo] = useState<DownloadedVideo | null>(null);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!id) return;
    getVideoById(id).then((v) => {
      if (v) {
        setVideo(v);
        setProgress(v.watch_progress ?? 0);
      }
    });
  }, [id]);

  const handlePlay = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying && progress < 100) {
      const newProgress = Math.min(progress + 10, 100);
      setProgress(newProgress);
      if (id) updateWatchProgress(id, newProgress);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "ลบบทเรียน",
      "ต้องการลบบทเรียนนี้ออกจากเครื่องใช่ไหม?",
      [
        { text: "ยกเลิก", style: "cancel" },
        {
          text: "ลบ",
          style: "destructive",
          onPress: async () => {
            if (id) {
              await deleteDownloadedVideo(id);
              router.back();
            }
          },
        },
      ]
    );
  };

  const handleExam = () => {
    if (!video) return;
    router.push(`/exam/${video.subject_id}-${video.grade}` as any);
  };

  const accentColor = video ? (subjectColorMap[video.subject_id] ?? Palette.primary) : Palette.primary;

  if (!video) {
    return (
      <View className="flex-1 bg-surface-alt items-center justify-center">
        <Stack.Screen options={{ headerShown: false }} />
        <Text className="text-brand-muted">กำลังโหลด...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-surface-alt">
        {/* Gradient Header */}
        <View className="relative">
          <Svg
            style={{ position: "absolute", top: 0, left: 0, right: 0 }}
            width="100%"
            height={200 + insets.top}
          >
            <Defs>
              <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={accentColor} />
                <Stop offset="1" stopColor={accentColor + "99"} />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height={200 + insets.top} fill={`url(#${gradientId})`} />
          </Svg>

          <View className="pb-6" style={{ paddingTop: insets.top + 8 }}>
            {/* Top bar */}
            <View className="flex-row items-center px-5 mb-4">
              <TouchableOpacity
                onPress={() => router.back()}
                className="w-10 h-10 rounded-full bg-white/20 items-center justify-center mr-3"
                activeOpacity={0.7}
              >
                <ArrowLeft size={20} color="white" strokeWidth={2.5} />
              </TouchableOpacity>
              <Text className="flex-1 text-lg font-bold text-white" numberOfLines={1}>
                {video.title}
              </Text>
              <TouchableOpacity
                onPress={handleDelete}
                className="w-10 h-10 rounded-full bg-white/20 items-center justify-center"
                activeOpacity={0.7}
              >
                <Trash2 size={18} color="white" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            {/* Video Player Area */}
            <View
              className="mx-5 rounded-2xl overflow-hidden items-center justify-center bg-black/30"
              style={{ height: SCREEN_W * 0.5 }}
            >
              <TouchableOpacity
                onPress={handlePlay}
                className="w-20 h-20 rounded-full bg-white/30 items-center justify-center"
                activeOpacity={0.8}
              >
                <Play size={36} color="white" strokeWidth={2} fill="white" />
              </TouchableOpacity>
              <Text className="text-white/80 text-xs mt-3">
                {isPlaying ? "กำลังเล่น..." : "แตะเพื่อเล่น"}
              </Text>
              {/* Duration badge */}
              <View className="absolute bottom-3 right-3 bg-black/50 px-2 py-0.5 rounded">
                <Text className="text-white text-xs">{formatDuration(video.duration ?? 0)}</Text>
              </View>
            </View>
          </View>
        </View>

        <ScrollView
          className="flex-1 px-5 -mt-2"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Info card */}
          <View className="bg-surface rounded-2xl p-5 mb-4" style={cardShadow}>
            <View className="flex-row items-center mb-4">
              <View className="w-10 h-10 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: accentColor + "20" }}>
                <BookOpen size={20} color={accentColor} strokeWidth={2} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-brand-text">{video.subject_name}</Text>
                <Text className="text-xs text-brand-muted">
                  {gradeNameMap[video.grade] ?? video.grade}
                </Text>
              </View>
            </View>

            {/* Progress */}
            <View className="flex-row justify-between mb-2">
              <Text className="text-sm text-brand-muted">ความคืบหน้า</Text>
              <Text className="text-sm font-bold" style={{ color: accentColor }}>{progress}%</Text>
            </View>
            <View className="h-3 rounded-full bg-edge overflow-hidden mb-4">
              <View
                className="h-full rounded-full"
                style={{ width: `${progress}%`, backgroundColor: accentColor }}
              />
            </View>

            {/* Go to exam button */}
            <TouchableOpacity
              className="flex-row items-center justify-center rounded-xl py-3.5"
              style={{ backgroundColor: accentColor }}
              activeOpacity={0.8}
              onPress={handleExam}
            >
              <ClipboardList size={18} color="white" strokeWidth={2} />
              <Text className="text-white font-bold ml-2">ทำข้อสอบ</Text>
            </TouchableOpacity>
          </View>

          {/* Chapter list */}
          <Text className="text-base font-bold text-brand-text mb-3">บทในวิดีโอ</Text>
          {mockChapters.map((ch, index) => (
            <TouchableOpacity
              key={ch.id}
              className="bg-surface rounded-xl p-4 mb-2.5 flex-row items-center"
              style={cardShadow}
              activeOpacity={0.7}
            >
              <View
                className="w-8 h-8 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: ch.watched ? accentColor : "#E2E8F0" }}
              >
                {ch.watched ? (
                  <Play size={14} color="white" strokeWidth={2} fill="white" />
                ) : (
                  <Text className="text-xs font-bold text-brand-muted">{index + 1}</Text>
                )}
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-brand-text">{ch.title}</Text>
                <Text className="text-xs text-brand-muted">{formatDuration(ch.duration)}</Text>
              </View>
              {ch.watched && (
                <View className="px-2 py-0.5 rounded-md" style={{ backgroundColor: accentColor + "20" }}>
                  <Text className="text-xs font-bold" style={{ color: accentColor }}>ดูแล้ว</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </>
  );
}
