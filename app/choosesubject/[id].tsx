import { Palette } from "@/constants/theme";
import {
    isDocumentDownloaded,
    isVideoDownloaded,
    saveDownloadedDocument,
    saveDownloadedVideo,
    saveExamQuestions,
} from "@/lib/db/downloads";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
    ArrowLeft,
    BookOpen,
    Check,
    Download,
    FileText,
    PlayCircle,
} from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
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

const subjectNameMap: Record<string, string> = {
  math: "คณิตศาสตร์",
  physics: "วิทยาศาสตร์",
  thai: "ภาษาไทย",
  social: "สังคมศึกษา",
  english: "ภาษาอังกฤษ",
};

const gradeNameMap: Record<string, string> = {
  m1: "ม.1",
  m2: "ม.2",
  m3: "ม.3",
  m4: "ม.4",
  m5: "ม.5",
  m6: "ม.6",
};

const getLessonContent = (subjectId: string, lessonId: string) => [
  {
    id: `${subjectId}_vid_1`,
    title: "บทที่ 1",
    vdo_count: 3,
    thumbnail_url: `https://picsum.photos/seed/${subjectId}1/400/225`,
    duration: 1800,
    exam_id: `${lessonId}_${subjectId}_exam_1`,
    doc_id: `${lessonId}_${subjectId}_doc_1`,
    doc_title: "เอกสารประกอบ บทที่ 1",
  },
  {
    id: `${subjectId}_vid_2`,
    title: "บทที่ 2",
    vdo_count: 5,
    thumbnail_url: `https://picsum.photos/seed/${subjectId}2/400/225`,
    duration: 2400,
    exam_id: `${lessonId}_${subjectId}_exam_2`,
    doc_id: `${lessonId}_${subjectId}_doc_2`,
    doc_title: "เอกสารประกอบ บทที่ 2",
  },
  {
    id: `${subjectId}_vid_3`,
    title: "บทที่ 3",
    vdo_count: 4,
    thumbnail_url: `https://picsum.photos/seed/${subjectId}3/400/225`,
    duration: 2100,
    exam_id: `${lessonId}_${subjectId}_exam_3`,
    doc_id: `${lessonId}_${subjectId}_doc_3`,
    doc_title: "เอกสารประกอบ บทที่ 3",
  },
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

export default function LessonDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [lessonId, subjectId] = (id || "").split("-");
  const gradientId = useMemo(() => `chooseGrad-${Date.now()}`, []);

  const lessonContent = getLessonContent(subjectId || "", lessonId || "");
  const [downloadedIds, setDownloadedIds] = useState<Set<string>>(new Set());
  const [downloadedDocIds, setDownloadedDocIds] = useState<Set<string>>(
    new Set(),
  );
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const checkDownloaded = async () => {
      const [videoResults, docResults] = await Promise.all([
        Promise.all(
          lessonContent.map(async (item) => ({
            id: item.id,
            downloaded: await isVideoDownloaded(item.id),
          })),
        ),
        Promise.all(
          lessonContent.map(async (item) => ({
            id: item.doc_id,
            downloaded: await isDocumentDownloaded(item.doc_id),
          })),
        ),
      ]);
      setDownloadedIds(
        new Set(videoResults.filter((r) => r.downloaded).map((r) => r.id)),
      );
      setDownloadedDocIds(
        new Set(docResults.filter((r) => r.downloaded).map((r) => r.id)),
      );
    };
    checkDownloaded();
  }, [id]);

  const handleDownload = async (
    item: ReturnType<typeof getLessonContent>[0],
  ) => {
    if (downloadedIds.has(item.id)) {
      Alert.alert("ดาวน์โหลดแล้ว", `${item.title} ดาวน์โหลดไว้แล้ว`, [
        {
          text: "ดูคลิป",
          onPress: () => router.push(`/video/${item.id}` as any),
        },
        { text: "ตกลง" },
      ]);
      return;
    }

    setDownloadingIds((prev) => new Set(prev).add(item.id));
    try {
      const subjectName = subjectNameMap[subjectId] ?? subjectId;
      // ดาวน์โหลด VDO
      await saveDownloadedVideo({
        video_id: item.id,
        title: `${subjectName} - ${item.title}`,
        subject_id: subjectId,
        subject_name: subjectName,
        grade: lessonId,
        thumbnail_url: item.thumbnail_url,
        duration: item.duration,
      });
      // ดาวน์โหลด ข้อสอบ
      await saveExamQuestions([
        {
          exam_id: item.exam_id,
          subject_id: subjectId,
          subject_name: subjectName,
          grade: lessonId,
          question: `ตัวอย่างคำถาม ${item.title} ข้อ 1`,
          choice_a: "ตัวเลือก A",
          choice_b: "ตัวเลือก B",
          choice_c: "ตัวเลือก C",
          choice_d: "ตัวเลือก D",
          answer: "A",
          explanation: "คำอธิบายเฉลย",
        },
      ]);
      // ดาวน์โหลด เอกสาร
      await saveDownloadedDocument({
        doc_id: item.doc_id,
        title: item.doc_title,
        subject_id: subjectId,
        subject_name: subjectName,
        grade: lessonId,
        doc_type: "pdf",
      });
      setDownloadedIds((prev) => new Set(prev).add(item.id));
      setDownloadedDocIds((prev) => new Set(prev).add(item.doc_id));
      Alert.alert(
        "ดาวน์โหลดสำเร็จ",
        `${item.title}\n✓ VDO\n✓ ข้อสอบ\n✓ เอกสาร PDF`,
      );
    } catch {
      Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถบันทึกได้ กรุณาลองใหม่");
    } finally {
      setDownloadingIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  };

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
                {gradeNameMap[lessonId] ?? lessonId?.toUpperCase()} ·{" "}
                {subjectNameMap[subjectId] ?? subjectId}
              </Text>
            </View>

            <View className="flex-row items-center">
              <View className="w-14 h-14 rounded-2xl bg-white/20 items-center justify-center mr-4">
                <BookOpen size={28} color="white" strokeWidth={2} />
              </View>
              <View className="flex-1">
                <Text className="text-[26px] font-black text-white tracking-wide">
                  เนื้อหาบทเรียน
                </Text>
                <Text className="text-sm text-white/90 mt-1">
                  ดาวน์โหลดเพื่อเรียนออฟไลน์
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Lesson Content Cards */}
        <ScrollView
          className="flex-1 px-5 -mt-4"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 30 }}
        >
          {lessonContent.map((item) => {
            const isDownloaded = downloadedIds.has(item.id);
            const isDocDownloaded = downloadedDocIds.has(item.doc_id);
            const isDownloading = downloadingIds.has(item.id);
            const accentColor = subjectColorMap[subjectId] ?? Palette.primary;

            return (
              <View
                key={item.id}
                className="bg-surface rounded-2xl mb-4 overflow-hidden"
                style={cardShadow}
              >
                {/* Thumbnail */}
                <TouchableOpacity
                  activeOpacity={isDownloaded ? 0.8 : 1}
                  onPress={() =>
                    isDownloaded
                      ? router.push(`/video/${item.id}` as any)
                      : undefined
                  }
                >
                  <View className="w-full h-[180px] bg-edge-light relative">
                    <Image
                      source={{ uri: item.thumbnail_url }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                    {/* overlay */}
                    <View className="absolute inset-0 bg-black/20" />
                    {/* Play / Lock icon */}
                    <View className="absolute inset-0 items-center justify-center">
                      <View className="w-14 h-14 rounded-full bg-black/40 items-center justify-center">
                        {isDownloaded ? (
                          <PlayCircle
                            size={32}
                            color="white"
                            strokeWidth={1.5}
                          />
                        ) : (
                          <Download size={26} color="white" strokeWidth={2} />
                        )}
                      </View>
                    </View>
                    {/* Grade badge */}
                    <View
                      className="absolute top-3 left-3 px-2.5 py-1 rounded-lg"
                      style={{ backgroundColor: accentColor }}
                    >
                      <Text className="text-white text-xs font-bold">
                        {gradeNameMap[lessonId] ?? lessonId?.toUpperCase()}
                      </Text>
                    </View>
                    {/* Downloaded badge */}
                    {isDownloaded && (
                      <View className="absolute top-3 right-3 bg-success px-2.5 py-1 rounded-lg">
                        <Text className="text-white text-xs font-bold">
                          ✓ ดาวน์โหลดแล้ว
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>

                {/* Info + Download button */}
                <View className="p-4">
                  <Text className="text-lg font-bold text-brand-text mb-1">
                    {item.title}
                  </Text>

                  {/* Content badges */}
                  <View className="flex-row gap-2 mb-3 flex-wrap">
                    <View
                      className="flex-row items-center px-2.5 py-1 rounded-lg"
                      style={{ backgroundColor: accentColor + "15" }}
                    >
                      <PlayCircle
                        size={12}
                        color={accentColor}
                        strokeWidth={2}
                      />
                      <Text
                        className="text-xs font-bold ml-1"
                        style={{ color: accentColor }}
                      >
                        {item.vdo_count} VDO
                      </Text>
                    </View>
                    <View
                      className={`flex-row items-center px-2.5 py-1 rounded-lg ${isDownloaded ? "bg-success/10" : "bg-edge-light"}`}
                    >
                      <Text
                        className={`text-xs font-bold ${isDownloaded ? "text-success" : "text-brand-muted"}`}
                      >
                        {isDownloaded ? "✓" : ""} ข้อสอบ
                      </Text>
                    </View>
                    <View
                      className={`flex-row items-center px-2.5 py-1 rounded-lg ${isDocDownloaded ? "bg-success/10" : "bg-edge-light"}`}
                    >
                      <FileText
                        size={12}
                        color={isDocDownloaded ? "#10B981" : Palette.textMuted}
                        strokeWidth={2}
                      />
                      <Text
                        className={`text-xs font-bold ml-1 ${isDocDownloaded ? "text-success" : "text-brand-muted"}`}
                      >
                        {isDocDownloaded ? "✓" : ""} PDF
                      </Text>
                    </View>
                  </View>

                  {/* Download button */}
                  <TouchableOpacity
                    className="rounded-xl py-3 flex-row items-center justify-center"
                    activeOpacity={0.8}
                    onPress={() => handleDownload(item)}
                    style={{
                      backgroundColor: isDownloaded ? "#10B981" : accentColor,
                    }}
                  >
                    {isDownloading ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : isDownloaded ? (
                      <>
                        <Check size={16} color="white" strokeWidth={2.5} />
                        <Text className="text-white font-bold text-sm ml-2">
                          ดาวน์โหลดแล้ว
                        </Text>
                      </>
                    ) : (
                      <>
                        <Download size={16} color="white" strokeWidth={2.5} />
                        <Text className="text-white font-bold text-sm ml-2">
                          ดาวน์โหลด VDO + ข้อสอบ + PDF
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </>
  );
}
