import { Palette } from "@/constants/theme";
import {
    DownloadedDocument,
    DownloadedVideo,
    ExamQuestion,
    getDocumentsBySubject,
    getExamQuestions,
    getVideosBySubject,
} from "@/lib/db/downloads";
import { useFocusEffect } from "@react-navigation/native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
    ArrowLeft,
    BookOpen,
    ChevronRight,
    ClipboardList,
    FileText,
    PlayCircle,
} from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import {
    Image,
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

const subjectColorMap: Record<string, string> = {
  math: "#3B82F6",
  physics: "#10B981",
  thai: "#EC4899",
  social: "#F59E0B",
  english: "#8B5CF6",
};

const gradeNameMap: Record<string, string> = {
  m1: "ม.1",
  m2: "ม.2",
  m3: "ม.3",
  m4: "ม.4",
  m5: "ม.5",
  m6: "ม.6",
};

const subjectIconMap: Record<string, string> = {
  math: "📐",
  physics: "⚗️",
  thai: "📖",
  social: "🌏",
  english: "💬",
};

const cardShadow = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
  },
  android: { elevation: 3 },
  default: {},
});

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function LessonsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const gradientId = useMemo(() => `lessonsGrad-${Date.now()}`, []);

  const [subjectId, grade] = (id || "").split("-");
  const accentColor = subjectColorMap[subjectId] ?? Palette.primary;

  const [videos, setVideos] = useState<DownloadedVideo[]>([]);
  const [docs, setDocs] = useState<DownloadedDocument[]>([]);
  const [exams, setExams] = useState<ExamQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"lessons" | "docs" | "exam">(
    "lessons",
  );

  useFocusEffect(
    useCallback(() => {
      const examId = `${grade}_${subjectId}_exam_1`;
      Promise.all([
        getVideosBySubject(subjectId),
        getDocumentsBySubject(subjectId, grade),
        getExamQuestions(examId),
      ])
        .then(([vids, documents, questions]) => {
          setVideos(vids.filter((v) => v.grade === grade));
          setDocs(documents);
          setExams(questions);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }, [subjectId, grade]),
  );

  const subjectName = videos[0]?.subject_name ?? subjectId;
  const avgProgress = videos.length
    ? Math.round(
        videos.reduce((s, v) => s + (v.watch_progress ?? 0), 0) / videos.length,
      )
    : 0;
  const completedCount = videos.filter(
    (v) => (v.watch_progress ?? 0) >= 90,
  ).length;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-surface-alt">
        {/* Gradient Header */}
        <View>
          <Svg
            style={{ position: "absolute", top: 0, left: 0, right: 0 }}
            width="100%"
            height={180 + insets.top}
          >
            <Defs>
              <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={accentColor} />
                <Stop offset="1" stopColor={accentColor + "99"} />
              </LinearGradient>
            </Defs>
            <Rect
              width="100%"
              height={180 + insets.top}
              fill={`url(#${gradientId})`}
            />
          </Svg>

          <View className="px-5 pb-4" style={{ paddingTop: insets.top + 10 }}>
            {/* Back button */}
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-white/20 items-center justify-center mb-4"
              activeOpacity={0.7}
            >
              <ArrowLeft size={20} color="white" strokeWidth={2.5} />
            </TouchableOpacity>

            <View className="flex-row items-center">
              <View className="w-14 h-14 rounded-2xl bg-white/20 items-center justify-center mr-4">
                <Text style={{ fontSize: 28 }}>
                  {subjectIconMap[subjectId] ?? "📚"}
                </Text>
              </View>
              <View className="flex-1">
                <View className="flex-row items-center gap-2 mb-1">
                  <View className="bg-white/25 px-2 py-0.5 rounded-full">
                    <Text className="text-white text-xs font-bold">
                      {gradeNameMap[grade] ?? grade}
                    </Text>
                  </View>
                  <Text className="text-white/70 text-xs">
                    {videos.length} บท · {completedCount} จบแล้ว
                  </Text>
                </View>
                <Text className="text-2xl font-black text-white">
                  {subjectName}
                </Text>
              </View>
            </View>

            {/* Progress */}
            <View className="mt-4">
              <View className="flex-row justify-between mb-1">
                <Text className="text-white/80 text-xs">ความคืบหน้ารวม</Text>
                <Text className="text-white font-bold text-xs">
                  {avgProgress}%
                </Text>
              </View>
              <View className="h-2 rounded-full bg-white/20 overflow-hidden">
                <View
                  className="h-full rounded-full bg-white"
                  style={{ width: `${avgProgress}%` }}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View className="flex-row px-5 mt-3 mb-1 gap-2">
          {(
            [
              {
                key: "lessons",
                icon: (
                  <PlayCircle
                    size={14}
                    color={
                      activeTab === "lessons" ? "white" : Palette.textMuted
                    }
                    strokeWidth={2}
                  />
                ),
                label: `บทเรียน (${videos.length})`,
              },
              {
                key: "exam",
                icon: (
                  <ClipboardList
                    size={14}
                    color={activeTab === "exam" ? "white" : Palette.textMuted}
                    strokeWidth={2}
                  />
                ),
                label: `แบบทดสอบ (${exams.length})`,
              },
              {
                key: "docs",
                icon: (
                  <FileText
                    size={14}
                    color={activeTab === "docs" ? "white" : Palette.textMuted}
                    strokeWidth={2}
                  />
                ),
                label: `เอกสาร (${docs.length})`,
              },
            ] as const
          ).map(({ key, icon, label }) => (
            <TouchableOpacity
              key={key}
              onPress={() => setActiveTab(key)}
              className="flex-row items-center px-3 py-2 rounded-full"
              style={{
                backgroundColor: activeTab === key ? accentColor : "#E2E8F0",
              }}
              activeOpacity={0.8}
            >
              {icon}
              <Text
                className="text-xs font-bold ml-1.5"
                style={{
                  color: activeTab === key ? "white" : Palette.textMuted,
                }}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        <ScrollView
          className="flex-1 px-5"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 36, paddingTop: 8 }}
        >
          {loading ? (
            <View className="py-12 items-center">
              <View className="h-4 w-48 rounded-full bg-edge-light mb-3" />
              <View className="h-24 rounded-2xl bg-edge-light mb-3 w-full" />
              <View className="h-24 rounded-2xl bg-edge-light mb-3 w-full" />
            </View>
          ) : activeTab === "lessons" ? (
            videos.length === 0 ? (
              <View className="py-16 items-center">
                <BookOpen
                  size={40}
                  color={Palette.textMuted}
                  strokeWidth={1.5}
                />
                <Text className="text-brand-muted mt-3">ยังไม่มีบทเรียน</Text>
              </View>
            ) : (
              videos.map((video, index) => {
                const progress = video.watch_progress ?? 0;
                const isDone = progress >= 90;
                return (
                  <TouchableOpacity
                    key={video.video_id}
                    className="bg-surface rounded-2xl mb-3 overflow-hidden"
                    style={cardShadow}
                    activeOpacity={0.82}
                    onPress={() =>
                      router.push(`/player/${video.video_id}` as any)
                    }
                  >
                    <View className="flex-row">
                      {/* Thumbnail */}
                      <View className="w-28 h-20 bg-edge-light relative overflow-hidden rounded-l-2xl">
                        {video.thumbnail_url ? (
                          <Image
                            source={{ uri: video.thumbnail_url }}
                            className="w-full h-full"
                            resizeMode="cover"
                          />
                        ) : (
                          <View
                            className="w-full h-full items-center justify-center"
                            style={{ backgroundColor: accentColor + "15" }}
                          >
                            <PlayCircle
                              size={24}
                              color={accentColor}
                              strokeWidth={1.5}
                            />
                          </View>
                        )}
                        {/* play overlay */}
                        <View className="absolute inset-0 bg-black/25 items-center justify-center">
                          <View className="w-8 h-8 rounded-full bg-black/40 items-center justify-center">
                            <PlayCircle
                              size={16}
                              color="white"
                              strokeWidth={2}
                            />
                          </View>
                        </View>
                        {isDone && (
                          <View className="absolute top-1 left-1 w-5 h-5 rounded-full bg-success items-center justify-center">
                            <Text className="text-white text-[9px] font-black">
                              ✓
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Info */}
                      <View className="flex-1 p-3 justify-between">
                        <View>
                          <View className="flex-row items-center gap-1.5 mb-1">
                            <View
                              className="w-5 h-5 rounded-full items-center justify-center"
                              style={{ backgroundColor: accentColor + "20" }}
                            >
                              <Text
                                className="text-[9px] font-black"
                                style={{ color: accentColor }}
                              >
                                {index + 1}
                              </Text>
                            </View>
                            <Text
                              className="text-sm font-bold text-brand-text flex-1"
                              numberOfLines={1}
                            >
                              {video.title}
                            </Text>
                          </View>
                          {video.duration ? (
                            <Text className="text-xs text-brand-muted">
                              {formatDuration(video.duration)}
                            </Text>
                          ) : null}
                        </View>
                        {/* progress bar */}
                        <View>
                          <View className="h-1.5 rounded-full bg-edge overflow-hidden mt-1">
                            <View
                              className="h-full rounded-full"
                              style={{
                                width: `${progress}%`,
                                backgroundColor: isDone
                                  ? "#10B981"
                                  : accentColor,
                              }}
                            />
                          </View>
                          <Text className="text-[10px] text-brand-muted mt-0.5">
                            {progress}%
                          </Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )
          ) : activeTab === "exam" ? (
            /* Exam tab */
            exams.length === 0 ? (
              <View className="py-16 items-center">
                <ClipboardList
                  size={40}
                  color={Palette.textMuted}
                  strokeWidth={1.5}
                />
                <Text className="text-brand-muted mt-3">ยังไม่มีแบบทดสอบ</Text>
                <Text className="text-xs text-brand-muted mt-1">
                  ดาวน์โหลดบทเรียนเพื่อรับข้อสอบ
                </Text>
              </View>
            ) : (
              <View>
                {/* Exam info card */}
                <View
                  className="bg-surface rounded-2xl p-5 mb-4"
                  style={cardShadow}
                >
                  {/* Icon */}
                  <View className="items-center mb-4">
                    <View
                      className="w-20 h-20 rounded-full items-center justify-center mb-3"
                      style={{ backgroundColor: accentColor + "18" }}
                    >
                      <ClipboardList
                        size={36}
                        color={accentColor}
                        strokeWidth={1.5}
                      />
                    </View>
                    <Text className="text-lg font-black text-brand-text text-center">
                      แบบทดสอบ{subjectName}
                    </Text>
                    <Text className="text-sm text-brand-muted text-center mt-1">
                      {gradeNameMap[grade] ?? grade}
                    </Text>
                  </View>

                  {/* Stats row */}
                  <View className="flex-row gap-3 mb-5">
                    <View
                      className="flex-1 rounded-xl py-3 items-center"
                      style={{ backgroundColor: accentColor + "12" }}
                    >
                      <Text
                        className="text-2xl font-black"
                        style={{ color: accentColor }}
                      >
                        {exams.length}
                      </Text>
                      <Text className="text-xs text-brand-muted mt-0.5">
                        ข้อทั้งหมด
                      </Text>
                    </View>
                    <View className="flex-1 rounded-xl py-3 items-center bg-surface-alt">
                      <Text className="text-2xl font-black text-success">
                        60%
                      </Text>
                      <Text className="text-xs text-brand-muted mt-0.5">
                        เกณฑ์ผ่าน
                      </Text>
                    </View>
                    <View className="flex-1 rounded-xl py-3 items-center bg-surface-alt">
                      <Text className="text-2xl font-black text-brand-text">
                        ∞
                      </Text>
                      <Text className="text-xs text-brand-muted mt-0.5">
                        ไม่จำกัดเวลา
                      </Text>
                    </View>
                  </View>

                  {/* Hint */}
                  <View className="flex-row items-center bg-surface-alt rounded-xl px-4 py-3 mb-4">
                    <Text className="text-base mr-2">💡</Text>
                    <Text className="text-xs text-brand-muted flex-1 leading-5">
                      ข้อสอบจะแสดงเฉลยและคำอธิบายหลังตอบแต่ละข้อ
                      ทำซ้ำได้ไม่จำกัด
                    </Text>
                  </View>

                  {/* Start button */}
                  <TouchableOpacity
                    className="rounded-xl py-4 flex-row items-center justify-center"
                    style={{ backgroundColor: accentColor }}
                    activeOpacity={0.85}
                    onPress={() =>
                      router.push(`/exam/${subjectId}-${grade}` as any)
                    }
                  >
                    <ClipboardList size={20} color="white" strokeWidth={2} />
                    <Text className="text-white font-black text-base ml-2">
                      เริ่มทำแบบทดสอบ
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )
          ) : /* Docs tab */
          docs.length === 0 ? (
            <View className="py-16 items-center">
              <FileText size={40} color={Palette.textMuted} strokeWidth={1.5} />
              <Text className="text-brand-muted mt-3">ยังไม่มีเอกสาร</Text>
            </View>
          ) : (
            docs.map((doc) => (
              <TouchableOpacity
                key={doc.doc_id}
                className="bg-surface rounded-2xl p-4 mb-3 flex-row items-center"
                style={cardShadow}
                activeOpacity={0.82}
              >
                <View
                  className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                  style={{ backgroundColor: accentColor + "15" }}
                >
                  <FileText size={22} color={accentColor} strokeWidth={1.5} />
                </View>
                <View className="flex-1">
                  <Text
                    className="text-sm font-bold text-brand-text mb-0.5"
                    numberOfLines={2}
                  >
                    {doc.title}
                  </Text>
                  <View className="flex-row items-center gap-2">
                    <View
                      className="px-1.5 py-0.5 rounded-md"
                      style={{ backgroundColor: accentColor + "15" }}
                    >
                      <Text
                        className="text-[10px] font-bold uppercase"
                        style={{ color: accentColor }}
                      >
                        {doc.doc_type ?? "pdf"}
                      </Text>
                    </View>
                    <Text className="text-xs text-brand-muted">
                      {gradeNameMap[doc.grade] ?? doc.grade}
                    </Text>
                  </View>
                </View>
                <ChevronRight
                  size={16}
                  color={Palette.textMuted}
                  strokeWidth={2}
                />
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>
    </>
  );
}
