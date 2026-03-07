import { Palette } from "@/constants/theme";
import {
    getDocumentById,
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
    ClipboardList,
    Download,
    Eye,
    FileText,
    Play,
    Video,
} from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Linking,
    Modal,
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

type FileItem = {
  type: "video" | "exam" | "doc";
  fileId: string;
  title: string;
  subtitle?: string;
  thumbnail?: string;
  duration?: number;
};

function formatDuration(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function LessonDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [lessonId, subjectId] = (id || "").split("-");
  const gradientId = useMemo(() => `chooseGrad-${Date.now()}`, []);

  const accentColor = subjectColorMap[subjectId] ?? Palette.primary;
  const lessonContent = getLessonContent(subjectId || "", lessonId || "");

  const handleOpenDocument = async (doc_id: string) => {
    const doc = await getDocumentById(doc_id);
    const uri = doc?.local_file_uri ?? doc?.file_path;
    if (!uri) {
      Alert.alert("เปิดไม่ได้", "ไม่พบไฟล์ในเครื่อง กรุณาดาวน์โหลดใหม่");
      return;
    }
    try {
      const supported = await Linking.canOpenURL(uri);
      if (supported) {
        await Linking.openURL(uri);
      } else {
        Alert.alert("เปิดไม่ได้", "ไม่มีแอพรองรับไฟล์ประเภทนี้");
      }
    } catch {
      Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถเปิดไฟล์ได้");
    }
  };

  const [downloadedIds, setDownloadedIds] = useState<Set<string>>(new Set());
  const [downloadedDocIds, setDownloadedDocIds] = useState<Set<string>>(
    new Set(),
  );
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());

  // Preview modal state
  const [preview, setPreview] = useState<{
    type: "video" | "exam" | "doc";
    item: ReturnType<typeof getLessonContent>[0];
  } | null>(null);

  useEffect(() => {
    Promise.all([
      Promise.all(
        lessonContent.map(async (item) => ({
          id: item.id,
          ok: await isVideoDownloaded(item.id),
        })),
      ),
      Promise.all(
        lessonContent.map(async (item) => ({
          id: item.doc_id,
          ok: await isDocumentDownloaded(item.doc_id),
        })),
      ),
    ]).then(([vids, docs]) => {
      setDownloadedIds(new Set(vids.filter((r) => r.ok).map((r) => r.id)));
      setDownloadedDocIds(new Set(docs.filter((r) => r.ok).map((r) => r.id)));
    });
  }, [id]);

  const handleDownload = async (
    item: ReturnType<typeof getLessonContent>[0],
  ) => {
    setDownloadingIds((prev) => new Set(prev).add(item.id));
    try {
      const subjectName = subjectNameMap[subjectId] ?? subjectId;
      await saveDownloadedVideo({
        video_id: item.id,
        title: `${subjectName} - ${item.title}`,
        subject_id: subjectId,
        subject_name: subjectName,
        grade: lessonId,
        thumbnail_url: item.thumbnail_url,
        duration: item.duration,
      });
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
      Alert.alert("ดาวน์โหลดสำเร็จ", `${item.title}\n✓ VDO · ✓ ข้อสอบ · ✓ PDF`);
    } catch {
      Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถบันทึกได้");
    } finally {
      setDownloadingIds((prev) => {
        const n = new Set(prev);
        n.delete(item.id);
        return n;
      });
    }
  };

  // Build flat file list for each lesson
  const buildFileList = (
    item: ReturnType<typeof getLessonContent>[0],
  ): FileItem[] => [
    {
      type: "video",
      fileId: item.id,
      title: `${item.title} — วิดีโอ`,
      subtitle: `${item.vdo_count} คลิป · ${formatDuration(item.duration)}`,
      thumbnail: item.thumbnail_url,
      duration: item.duration,
    },
    {
      type: "exam",
      fileId: item.exam_id,
      title: `${item.title} — แบบทดสอบ`,
      subtitle: "ข้อสอบทบทวนความเข้าใจ",
    },
    {
      type: "doc",
      fileId: item.doc_id,
      title: item.doc_title,
      subtitle: "PDF · เอกสารประกอบ",
    },
  ];

  const isFileDownloaded = (f: FileItem) =>
    f.type === "video"
      ? downloadedIds.has(f.fileId)
      : f.type === "doc"
        ? downloadedDocIds.has(f.fileId)
        : downloadedIds.has(f.fileId.replace(/_exam_\d+$/, "_vid_1")); // exam follows video

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
                  {lessonContent.length} บท · กดเพื่อ preview หรือดาวน์โหลด
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Content */}
        <ScrollView
          className="flex-1 px-4 -mt-4"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          {lessonContent.map((item) => {
            const isDownloaded = downloadedIds.has(item.id);
            const isDownloading = downloadingIds.has(item.id);
            const files = buildFileList(item);

            return (
              <View
                key={item.id}
                className="bg-surface rounded-2xl mb-4 overflow-hidden"
                style={cardShadow}
              >
                {/* Lesson header row */}
                <View className="flex-row items-center px-4 pt-4 pb-3">
                  {/* Thumbnail mini */}
                  <View className="w-16 h-12 rounded-xl overflow-hidden mr-3 bg-edge-light">
                    <Image
                      source={{ uri: item.thumbnail_url }}
                      style={{ width: 64, height: 48 }}
                      resizeMode="cover"
                    />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2 mb-0.5">
                      <View
                        className="px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: accentColor }}
                      >
                        <Text className="text-white text-[10px] font-black">
                          {gradeNameMap[lessonId] ?? lessonId}
                        </Text>
                      </View>
                      {isDownloaded && (
                        <View className="flex-row items-center gap-1 px-2 py-0.5 rounded-full bg-success/15">
                          <Check size={9} color="#10B981" strokeWidth={3} />
                          <Text className="text-success text-[10px] font-bold">
                            ดาวน์โหลดแล้ว
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-sm font-black text-brand-text">
                      {item.title}
                    </Text>
                  </View>
                  {/* Download all button */}
                  <TouchableOpacity
                    onPress={() => handleDownload(item)}
                    disabled={isDownloaded || isDownloading}
                    className="w-9 h-9 rounded-full items-center justify-center ml-2"
                    style={{
                      backgroundColor: isDownloaded
                        ? "#10B98120"
                        : accentColor + "20",
                    }}
                    activeOpacity={0.7}
                  >
                    {isDownloading ? (
                      <ActivityIndicator size="small" color={accentColor} />
                    ) : isDownloaded ? (
                      <Check size={16} color="#10B981" strokeWidth={2.5} />
                    ) : (
                      <Download
                        size={16}
                        color={accentColor}
                        strokeWidth={2.5}
                      />
                    )}
                  </TouchableOpacity>
                </View>

                {/* Divider */}
                <View className="h-px bg-edge mx-4 mb-1" />

                {/* File list */}
                {files.map((f, fi) => {
                  const dl = isFileDownloaded(f);
                  const iconColor =
                    f.type === "video"
                      ? accentColor
                      : f.type === "exam"
                        ? "#F59E0B"
                        : "#EF4444";
                  const Icon =
                    f.type === "video"
                      ? Video
                      : f.type === "exam"
                        ? ClipboardList
                        : FileText;
                  // action button logic per file type + download state
                  const rowAction = () => {
                    if (dl && f.type === "doc") {
                      handleOpenDocument(f.fileId);
                    } else if (dl && f.type === "video") {
                      router.push(`/player/${f.fileId}` as any);
                    } else if (dl && f.type === "exam") {
                      router.push(`/exam/${subjectId}-${lessonId}` as any);
                    } else {
                      setPreview({ type: f.type, item });
                    }
                  };

                  const actionLabel = dl
                    ? f.type === "doc"
                      ? "เปิด"
                      : f.type === "video"
                        ? "เล่น"
                        : "ทำข้อสอบ"
                    : "Preview";

                  const actionBg = dl
                    ? f.type === "doc"
                      ? "#EF444415"
                      : f.type === "video"
                        ? accentColor + "15"
                        : "#F59E0B15"
                    : "#F1F5F9";

                  const actionTextColor = dl
                    ? f.type === "doc"
                      ? "#EF4444"
                      : f.type === "video"
                        ? accentColor
                        : "#F59E0B"
                    : Palette.textMuted;

                  const ActionIcon = dl
                    ? f.type === "doc"
                      ? FileText
                      : f.type === "video"
                        ? Play
                        : ClipboardList
                    : Eye;

                  return (
                    <TouchableOpacity
                      key={f.fileId}
                      onPress={rowAction}
                      className="flex-row items-center px-4 py-3"
                      style={{
                        borderBottomWidth: fi < files.length - 1 ? 1 : 0,
                        borderBottomColor: "#F1F5F9",
                      }}
                      activeOpacity={0.7}
                    >
                      {/* Icon box */}
                      <View
                        className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                        style={{ backgroundColor: iconColor + "15" }}
                      >
                        <Icon size={18} color={iconColor} strokeWidth={1.8} />
                      </View>
                      {/* Info */}
                      <View className="flex-1">
                        <Text
                          className="text-sm font-semibold text-brand-text"
                          numberOfLines={1}
                        >
                          {f.title}
                        </Text>
                        <Text className="text-xs text-brand-muted mt-0.5">
                          {f.subtitle}
                        </Text>
                      </View>
                      {/* Action button */}
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          paddingHorizontal: 10,
                          paddingVertical: 5,
                          borderRadius: 20,
                          backgroundColor: actionBg,
                          gap: 4,
                        }}
                      >
                        <ActionIcon
                          size={11}
                          color={actionTextColor}
                          strokeWidth={2.5}
                        />
                        <Text
                          style={{
                            fontSize: 10,
                            fontWeight: "700",
                            color: actionTextColor,
                          }}
                        >
                          {actionLabel}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}

                {/* Download all row */}
                {!isDownloaded && (
                  <TouchableOpacity
                    onPress={() => handleDownload(item)}
                    className="mx-4 mb-4 mt-2 rounded-xl py-3 flex-row items-center justify-center"
                    style={{ backgroundColor: accentColor }}
                    activeOpacity={0.85}
                  >
                    {isDownloading ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <>
                        <Download size={15} color="white" strokeWidth={2.5} />
                        <Text className="text-white font-bold text-sm ml-2">
                          ดาวน์โหลดทั้งหมด
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </ScrollView>

        {/* Preview Modal */}
        <Modal
          visible={!!preview}
          transparent
          animationType="slide"
          onRequestClose={() => setPreview(null)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.55)",
              justifyContent: "flex-end",
            }}
          >
            <View
              style={{
                backgroundColor: "white",
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                paddingBottom: insets.bottom + 16,
              }}
            >
              {/* Handle */}
              <View
                style={{
                  width: 40,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: "#CBD5E1",
                  alignSelf: "center",
                  marginTop: 12,
                  marginBottom: 16,
                }}
              />

              {preview?.type === "video" && (
                <>
                  {/* Video preview */}
                  <View
                    style={{
                      marginHorizontal: 16,
                      borderRadius: 16,
                      overflow: "hidden",
                      height: 200,
                      backgroundColor: "#000",
                      marginBottom: 16,
                    }}
                  >
                    <Image
                      source={{ uri: preview.item.thumbnail_url }}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="cover"
                    />
                    <View
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(0,0,0,0.35)",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <View
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: 28,
                          backgroundColor: "rgba(255,255,255,0.25)",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Play
                          size={26}
                          color="white"
                          strokeWidth={2}
                          fill="white"
                        />
                      </View>
                    </View>
                    <View
                      style={{
                        position: "absolute",
                        bottom: 8,
                        right: 10,
                        backgroundColor: "rgba(0,0,0,0.7)",
                        borderRadius: 4,
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                      }}
                    >
                      <Text
                        style={{
                          color: "white",
                          fontSize: 11,
                          fontWeight: "600",
                        }}
                      >
                        {formatDuration(preview.item.duration)}
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "800",
                      color: "#0f0f0f",
                      marginHorizontal: 16,
                    }}
                  >
                    {preview.item.title} — วิดีโอ
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      color: "#606060",
                      marginHorizontal: 16,
                      marginTop: 4,
                    }}
                  >
                    {preview.item.vdo_count} คลิป ·{" "}
                    {subjectNameMap[subjectId] ?? subjectId} ·{" "}
                    {gradeNameMap[lessonId] ?? lessonId}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: "#94A3B8",
                      marginHorizontal: 16,
                      marginTop: 6,
                      lineHeight: 18,
                    }}
                  >
                    คลิปวิดีโออธิบายเนื้อหาบทเรียนแบบละเอียด พร้อมตัวอย่างโจทย์
                    และการแก้ปัญหา สามารถดูซ้ำได้ไม่จำกัด
                  </Text>
                </>
              )}

              {preview?.type === "exam" && (
                <>
                  <View style={{ alignItems: "center", marginBottom: 12 }}>
                    <View
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: 36,
                        backgroundColor: "#FEF3C7",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: 8,
                      }}
                    >
                      <ClipboardList
                        size={32}
                        color="#F59E0B"
                        strokeWidth={1.5}
                      />
                    </View>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "800",
                        color: "#0f0f0f",
                      }}
                    >
                      {preview.item.title} — แบบทดสอบ
                    </Text>
                    <Text
                      style={{ fontSize: 12, color: "#606060", marginTop: 4 }}
                    >
                      {subjectNameMap[subjectId] ?? subjectId} ·{" "}
                      {gradeNameMap[lessonId] ?? lessonId}
                    </Text>
                  </View>
                  <View
                    style={{
                      marginHorizontal: 16,
                      backgroundColor: "#FFFBEB",
                      borderRadius: 16,
                      padding: 16,
                      marginBottom: 12,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-around",
                      }}
                    >
                      {[
                        ["ข้อทั้งหมด", "5"],
                        ["เกณฑ์ผ่าน", "60%"],
                        ["เวลา", "∞"],
                      ].map(([label, val]) => (
                        <View key={label} style={{ alignItems: "center" }}>
                          <Text
                            style={{
                              fontSize: 22,
                              fontWeight: "900",
                              color: "#F59E0B",
                            }}
                          >
                            {val}
                          </Text>
                          <Text
                            style={{
                              fontSize: 11,
                              color: "#92400E",
                              marginTop: 2,
                            }}
                          >
                            {label}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                  <Text
                    style={{
                      fontSize: 12,
                      color: "#94A3B8",
                      marginHorizontal: 16,
                      lineHeight: 18,
                    }}
                  >
                    แบบทดสอบทบทวนความเข้าใจในบทเรียน
                    แสดงเฉลยและคำอธิบายหลังตอบทุกข้อ ทำซ้ำได้ไม่จำกัด
                  </Text>
                </>
              )}

              {preview?.type === "doc" && (
                <>
                  <View style={{ alignItems: "center", marginBottom: 12 }}>
                    <View
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: 36,
                        backgroundColor: "#FEE2E2",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: 8,
                      }}
                    >
                      <FileText size={32} color="#EF4444" strokeWidth={1.5} />
                    </View>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "800",
                        color: "#0f0f0f",
                      }}
                    >
                      {preview.item.doc_title}
                    </Text>
                    <Text
                      style={{ fontSize: 12, color: "#606060", marginTop: 4 }}
                    >
                      PDF · {subjectNameMap[subjectId] ?? subjectId} ·{" "}
                      {gradeNameMap[lessonId] ?? lessonId}
                    </Text>
                  </View>
                  <View
                    style={{
                      marginHorizontal: 16,
                      backgroundColor: "#FEF2F2",
                      borderRadius: 16,
                      padding: 16,
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 12,
                    }}
                  >
                    <FileText size={24} color="#EF4444" strokeWidth={1.5} />
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "700",
                          color: "#0f0f0f",
                        }}
                      >
                        {preview.item.doc_title}
                      </Text>
                      <Text
                        style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}
                      >
                        เอกสารประกอบการเรียน · PDF
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={{
                      fontSize: 12,
                      color: "#94A3B8",
                      marginHorizontal: 16,
                      lineHeight: 18,
                    }}
                  >
                    เอกสารสรุปเนื้อหาสำคัญ สูตร และตัวอย่างโจทย์
                    ใช้ประกอบการเรียนและทบทวน
                  </Text>
                </>
              )}

              {/* Action buttons */}
              <View
                style={{
                  flexDirection: "row",
                  gap: 10,
                  marginHorizontal: 16,
                  marginTop: 16,
                }}
              >
                <TouchableOpacity
                  onPress={() => setPreview(null)}
                  style={{
                    flex: 1,
                    paddingVertical: 13,
                    borderRadius: 14,
                    backgroundColor: "#F1F5F9",
                    alignItems: "center",
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={{
                      fontWeight: "700",
                      color: "#475569",
                      fontSize: 14,
                    }}
                  >
                    ปิด
                  </Text>
                </TouchableOpacity>
                {preview && !downloadedIds.has(preview.item.id) && (
                  <TouchableOpacity
                    onPress={() => {
                      setPreview(null);
                      handleDownload(preview.item);
                    }}
                    style={{
                      flex: 2,
                      paddingVertical: 13,
                      borderRadius: 14,
                      backgroundColor: accentColor,
                      alignItems: "center",
                      flexDirection: "row",
                      justifyContent: "center",
                      gap: 6,
                    }}
                    activeOpacity={0.85}
                  >
                    <Download size={15} color="white" strokeWidth={2.5} />
                    <Text
                      style={{
                        fontWeight: "800",
                        color: "white",
                        fontSize: 14,
                      }}
                    >
                      ดาวน์โหลด
                    </Text>
                  </TouchableOpacity>
                )}
                {preview &&
                  downloadedIds.has(preview.item.id) &&
                  preview.type === "video" && (
                    <TouchableOpacity
                      onPress={() => {
                        setPreview(null);
                        router.push(`/player/${preview.item.id}` as any);
                      }}
                      style={{
                        flex: 2,
                        paddingVertical: 13,
                        borderRadius: 14,
                        backgroundColor: accentColor,
                        alignItems: "center",
                        flexDirection: "row",
                        justifyContent: "center",
                        gap: 6,
                      }}
                      activeOpacity={0.85}
                    >
                      <Play
                        size={15}
                        color="white"
                        strokeWidth={2.5}
                        fill="white"
                      />
                      <Text
                        style={{
                          fontWeight: "800",
                          color: "white",
                          fontSize: 14,
                        }}
                      >
                        เล่นวิดีโอ
                      </Text>
                    </TouchableOpacity>
                  )}
                {preview &&
                  downloadedIds.has(preview.item.id) &&
                  preview.type === "exam" && (
                    <TouchableOpacity
                      onPress={() => {
                        setPreview(null);
                        router.push(`/exam/${subjectId}-${lessonId}` as any);
                      }}
                      style={{
                        flex: 2,
                        paddingVertical: 13,
                        borderRadius: 14,
                        backgroundColor: "#F59E0B",
                        alignItems: "center",
                        flexDirection: "row",
                        justifyContent: "center",
                        gap: 6,
                      }}
                      activeOpacity={0.85}
                    >
                      <ClipboardList
                        size={15}
                        color="white"
                        strokeWidth={2.5}
                      />
                      <Text
                        style={{
                          fontWeight: "800",
                          color: "white",
                          fontSize: 14,
                        }}
                      >
                        เริ่มทำข้อสอบ
                      </Text>
                    </TouchableOpacity>
                  )}
                {preview &&
                  downloadedDocIds.has(preview.item.doc_id) &&
                  preview.type === "doc" && (
                    <TouchableOpacity
                      onPress={() => {
                        setPreview(null);
                        handleOpenDocument(preview.item.doc_id);
                      }}
                      style={{
                        flex: 2,
                        paddingVertical: 13,
                        borderRadius: 14,
                        backgroundColor: "#EF4444",
                        alignItems: "center",
                        flexDirection: "row",
                        justifyContent: "center",
                        gap: 6,
                      }}
                      activeOpacity={0.85}
                    >
                      <FileText size={15} color="white" strokeWidth={2.5} />
                      <Text
                        style={{
                          fontWeight: "800",
                          color: "white",
                          fontSize: 14,
                        }}
                      >
                        เปิดเอกสาร
                      </Text>
                    </TouchableOpacity>
                  )}
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </>
  );
}
