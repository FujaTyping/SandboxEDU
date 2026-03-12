import { CourseListSkeleton } from "@/components/LoadingSkeleton";
import { OfflineBanner } from "@/components/OfflineBanner";
import { Palette } from "@/constants/theme";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { getDownloadedCourses } from "@/lib/offline/downloadManager";
import { getAvailableSavedDifficulties } from "@/lib/progress/savedQuizzes";
import { getVideoProgress } from "@/lib/progress/videoProgress";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import {
  BookOpen,
  ClipboardList,
  Lock,
  RefreshCw,
  WifiOff,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ApiCourse {
  id: string;
  title: string;
  subject: string;
  class: number;
  by?: string;
  thumbnailURL?: string;
}

const SUBJECT_COLOR: Record<string, string> = {
  คณิตศาสตร์: "#3B82F6",
  ฟิสิกส์: "#10B981",
  เคมี: "#F59E0B",
  ชีววิทยา: "#22C55E",
  ภาษาไทย: "#EC4899",
  สังคม: "#8B5CF6",
  ภาษาอังกฤษ: "#6366F1",
};

const SUBJECT_ICON: Record<string, string> = {
  คณิตศาสตร์: "📐",
  ฟิสิกส์: "⚗️",
  เคมี: "🧪",
  ชีววิทยา: "🌿",
  ภาษาไทย: "📖",
  สังคม: "🌏",
  ภาษาอังกฤษ: "💬",
};

const DIFFICULTY_LABELS = [
  { key: "easy", label: "ง่าย", color: "#22C55E" },
  { key: "medium", label: "ปานกลาง", color: "#F59E0B" },
  { key: "hard", label: "ยาก", color: "#EF4444" },
] as const;

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

function CourseCard({
  course,
  onPress,
  watchPct = 0,
}: {
  course: ApiCourse;
  onPress: () => void;
  watchPct?: number;
}) {
  const color = SUBJECT_COLOR[course.subject] ?? Palette.primary;
  const icon = SUBJECT_ICON[course.subject] ?? "📚";

  return (
    <TouchableOpacity
      style={cardShadow}
      className="bg-surface rounded-2xl overflow-hidden"
      activeOpacity={0.75}
      onPress={onPress}
    >
      <View className="flex-row">
        {course.thumbnailURL ? (
          <Image
            source={{ uri: course.thumbnailURL }}
            style={{ width: 100, height: 100 }}
            contentFit="cover"
          />
        ) : (
          <View
            style={{
              width: 100,
              height: 100,
              backgroundColor: color + "18",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 36 }}>{icon}</Text>
          </View>
        )}
        <View className="flex-1 p-3">
          <View className="flex-row items-center mb-1" style={{ gap: 6 }}>
            <View
              className="px-2 py-0.5 rounded-full"
              style={{ backgroundColor: color + "20" }}
            >
              <Text className="text-[10px] font-bold" style={{ color }}>
                {course.subject}
              </Text>
            </View>
            <Text className="text-[10px] text-brand-muted">
              ม.{course.class}
            </Text>
          </View>
          <Text
            className="text-sm font-bold text-brand-text leading-5"
            numberOfLines={2}
          >
            {course.title}
          </Text>
          {course.by && (
            <Text className="text-[10px] text-brand-disabled mt-1">
              โดย {course.by}
            </Text>
          )}
          {/* Watch progress bar */}
          {watchPct > 0 && (
            <View style={{ marginTop: 6 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 3,
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    color: watchPct >= 90 ? "#22C55E" : color,
                    fontWeight: "700",
                  }}
                >
                  {watchPct >= 90
                    ? "✓ ดูจบแล้ว"
                    : `ดูไปแล้ว ${Math.round(watchPct)}%`}
                </Text>
              </View>
              <View
                style={{
                  height: 4,
                  backgroundColor: color + "20",
                  borderRadius: 2,
                }}
              >
                <View
                  style={{
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: watchPct >= 90 ? "#22C55E" : color,
                    width: `${Math.min(watchPct, 100)}%`,
                  }}
                />
              </View>
            </View>
          )}
          <View className="flex-row items-center mt-2" style={{ gap: 8 }}>
            <View
              className="flex-row items-center px-2 py-1 rounded-lg"
              style={{ backgroundColor: color + "15", gap: 4 }}
            >
              <BookOpen size={10} color={color} />
              <Text className="text-[10px] font-bold" style={{ color }}>
                ดูคอร์ส
              </Text>
            </View>
            <View
              className="flex-row items-center px-2 py-1 rounded-lg"
              style={{ backgroundColor: "#8B5CF620", gap: 4 }}
            >
              <ClipboardList size={10} color="#8B5CF6" />
              <Text
                className="text-[10px] font-bold"
                style={{ color: "#8B5CF6" }}
              >
                ทำแบบทดสอบ
              </Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function CoursesTab({
  courses,
  loading,
  error,
  onRefresh,
  onCoursePress,
  progressMap,
}: {
  courses: ApiCourse[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onCoursePress: (course: ApiCourse) => void;
  progressMap: Record<string, number>;
}) {
  if (loading) {
    return <CourseListSkeleton count={5} />;
  }
  if (error) {
    return (
      <View className="mx-6 bg-surface rounded-2xl p-6 items-center">
        <Text className="text-2xl mb-2">⚠️</Text>
        <Text className="text-sm font-semibold text-brand-text mb-1">
          โหลดข้อมูลไม่ได้
        </Text>
        <Text className="text-xs text-brand-muted text-center mb-4">
          {error}
        </Text>
        <TouchableOpacity
          onPress={onRefresh}
          className="px-5 py-2 rounded-full"
          style={{ backgroundColor: Palette.primary }}
        >
          <Text className="text-white text-xs font-bold">ลองใหม่</Text>
        </TouchableOpacity>
      </View>
    );
  }
  if (courses.length === 0) {
    return (
      <View className="items-center py-24">
        <BookOpen size={40} color="#CBD5E1" strokeWidth={1.5} />
        <Text className="text-brand-muted text-sm mt-3">ไม่พบบทเรียน</Text>
      </View>
    );
  }
  return (
    <View className="px-6" style={{ gap: 12 }}>
      {courses.map((course) => (
        <CourseCard
          key={course.id}
          course={course}
          onPress={() => onCoursePress(course)}
          watchPct={progressMap[course.id] ?? 0}
        />
      ))}
    </View>
  );
}

function QuizCard({
  course,
  isEnrolled,
  savedDifficulties,
}: {
  course: ApiCourse;
  isEnrolled: boolean;
  savedDifficulties: Array<"easy" | "medium" | "hard">;
}) {
  const router = useRouter();
  const { isOnline } = useNetworkStatus();
  const color = SUBJECT_COLOR[course.subject] ?? Palette.primary;
  const icon = SUBJECT_ICON[course.subject] ?? "📚";

  const handlePress = () => {
    router.push({
      pathname: "/quiz/[id]",
      params: {
        id: course.id,
        courseTitle: course.title,
        subject: course.subject,
        isEnrolled: isEnrolled ? "1" : "0",
      },
    } as any);
  };

  return (
    <TouchableOpacity
      style={[
        cardShadow,
        { backgroundColor: "#fff", borderRadius: 20, overflow: "hidden" },
      ]}
      activeOpacity={0.75}
      onPress={handlePress}
    >
      <View style={{ flexDirection: "row" }}>
        {course.thumbnailURL ? (
          <Image
            source={{ uri: course.thumbnailURL }}
            style={{ width: 100, height: 100 }}
            contentFit="cover"
          />
        ) : (
          <View
            style={{
              width: 100,
              height: 100,
              backgroundColor: color + "18",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 36 }}>{icon}</Text>
          </View>
        )}
        <View style={{ flex: 1, padding: 12 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 4,
              gap: 6,
            }}
          >
            <View
              style={{
                backgroundColor: color + "20",
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 20,
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: "700", color }}>
                {course.subject}
              </Text>
            </View>
            <Text style={{ fontSize: 10, color: "#94A3B8" }}>
              ม.{course.class}
            </Text>
          </View>
          <Text
            style={{
              fontSize: 13,
              fontWeight: "700",
              color: "#0F172A",
              lineHeight: 18,
            }}
            numberOfLines={2}
          >
            {course.title}
          </Text>

          {/* Status row */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 6,
              gap: 6,
              flexWrap: "wrap",
            }}
          >
            {!isEnrolled ? (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#FEF3C7",
                  paddingHorizontal: 7,
                  paddingVertical: 3,
                  borderRadius: 8,
                  gap: 3,
                }}
              >
                <Lock size={9} color="#D97706" />
                <Text
                  style={{ fontSize: 10, fontWeight: "700", color: "#D97706" }}
                >
                  ยังไม่ได้ลงทะเบียน
                </Text>
              </View>
            ) : !isOnline && savedDifficulties.length === 0 ? (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#F1F5F9",
                  paddingHorizontal: 7,
                  paddingVertical: 3,
                  borderRadius: 8,
                  gap: 3,
                }}
              >
                <WifiOff size={9} color="#94A3B8" />
                <Text
                  style={{ fontSize: 10, fontWeight: "600", color: "#94A3B8" }}
                >
                  ไม่มีข้อสอบออฟไลน์
                </Text>
              </View>
            ) : savedDifficulties.length > 0 ? (
              savedDifficulties.map((d) => {
                const dl = DIFFICULTY_LABELS.find((l) => l.key === d);
                return (
                  <View
                    key={d}
                    style={{
                      backgroundColor: (dl?.color ?? "#8B5CF6") + "18",
                      paddingHorizontal: 7,
                      paddingVertical: 3,
                      borderRadius: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: "700",
                        color: dl?.color ?? "#8B5CF6",
                      }}
                    >
                      {d === "easy" ? "🟢" : d === "medium" ? "🟡" : "🔴"}{" "}
                      {dl?.label}
                    </Text>
                  </View>
                );
              })
            ) : (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: Palette.primaryBg,
                  paddingHorizontal: 7,
                  paddingVertical: 3,
                  borderRadius: 8,
                  gap: 3,
                }}
              >
                <ClipboardList size={9} color={Palette.primary} />
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: "700",
                    color: Palette.primary,
                  }}
                >
                  แบบทดสอบ
                </Text>
              </View>
            )}
          </View>
        </View>
        {/* Arrow */}
        <View style={{ justifyContent: "center", paddingRight: 14 }}>
          <Text style={{ fontSize: 14, color: "#CBD5E1" }}>›</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function QuizTab({
  courses,
  initialCourseId,
  enrolledIds,
}: {
  courses: ApiCourse[];
  initialCourseId?: string;
  enrolledIds: Set<string>;
}) {
  const router = useRouter();
  const [savedMap, setSavedMap] = useState<
    Record<string, Array<"easy" | "medium" | "hard">>
  >({});

  React.useEffect(() => {
    // โหลด saved difficulties ของทุก course
    Promise.all(
      courses.map(async (c) => {
        const diffs = await getAvailableSavedDifficulties(c.id);
        return [c.id, diffs] as const;
      }),
    ).then((entries) => {
      setSavedMap(Object.fromEntries(entries));
    });
  }, [courses]);

  // Auto-navigate เมื่อมี initialCourseId
  React.useEffect(() => {
    if (initialCourseId && courses.length > 0) {
      const course = courses.find((c) => c.id === initialCourseId);
      if (course) {
        router.push({
          pathname: "/quiz/[id]",
          params: {
            id: course.id,
            courseTitle: course.title,
            subject: course.subject,
            isEnrolled: enrolledIds.has(course.id) ? "1" : "0",
          },
        } as any);
      }
    }
  }, [initialCourseId, courses, enrolledIds]);

  if (courses.length === 0) {
    return (
      <View className="items-center py-24 px-6">
        <ClipboardList size={40} color="#CBD5E1" strokeWidth={1.5} />
        <Text className="text-brand-muted text-sm mt-3 text-center">
          ไม่พบบทเรียน
        </Text>
      </View>
    );
  }

  return (
    <View className="px-6" style={{ gap: 12 }}>
      {courses.map((c) => (
        <QuizCard
          key={c.id}
          course={c}
          isEnrolled={enrolledIds.has(c.id)}
          savedDifficulties={savedMap[c.id] ?? []}
        />
      ))}
    </View>
  );
}

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isOnline } = useNetworkStatus();
  const params = useLocalSearchParams<{
    quizCourseId?: string;
    initialTab?: string;
  }>();
  const quizCourseId = params.quizCourseId;
  const initialTab = params.initialTab as "courses" | "quiz" | undefined;
  const [courses, setCourses] = useState<ApiCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"courses" | "quiz">(
    quizCourseId ? "quiz" : (initialTab ?? "courses"),
  );

  // Auto-switch tab เมื่อมี quizCourseId หรือ initialTab
  useEffect(() => {
    if (quizCourseId) setActiveTab("quiz");
    else if (initialTab) setActiveTab(initialTab);
  }, [quizCourseId, initialTab]);

  const loadEnrolledIds = useCallback(async (courseList: ApiCourse[]) => {
    const ids = new Set<string>();
    await Promise.all(
      courseList.map(async (c) => {
        const val = await AsyncStorage.getItem(`@enrolled_${c.id}`);
        if (val === "1") ids.add(c.id);
      }),
    );
    setEnrolledIds(ids);
  }, []);

  const loadProgressMap = useCallback(async (courseList: ApiCourse[]) => {
    const map: Record<string, number> = {};
    await Promise.all(
      courseList.map(async (c) => {
        const p = await getVideoProgress(c.id);
        if (p) map[c.id] = p.percentage;
      }),
    );
    setProgressMap(map);
  }, []);

  const fetchCourses = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError(null);

        if (!isOnline) {
          // Offline: แสดงเฉพาะ downloaded courses
          const downloaded = await getDownloadedCourses();
          const offlineCourses: ApiCourse[] = downloaded.map((d) => ({
            id: d.id,
            title: d.title,
            subject: "ดาวน์โหลดแล้ว",
            class: 0,
          }));
          setCourses(offlineCourses);
          loadProgressMap(offlineCourses);
          loadEnrolledIds(offlineCourses);
          return;
        }

        const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
        if (!apiBaseUrl) {
          setError("ไม่พบ API URL");
          return;
        }
        const res = await fetch(`${apiBaseUrl}/courses/all`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const list: ApiCourse[] = Array.isArray(data)
          ? data
          : (data.courses ?? []);
        setCourses(list);
        loadProgressMap(list);
        loadEnrolledIds(list);
      } catch (e) {
        setError(e instanceof Error ? e.message : "โหลดข้อมูลไม่ได้");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [isOnline],
  );

  const handleRefresh = useCallback(() => {
    fetchCourses(true);
  }, [fetchCourses]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses, isOnline]);

  // Reload progress and enrolled state every time tab comes into focus
  useFocusEffect(
    useCallback(() => {
      if (courses.length > 0) {
        loadProgressMap(courses);
        loadEnrolledIds(courses);
      }
    }, [courses, loadProgressMap, loadEnrolledIds]),
  );

  return (
    <View className="flex-1 bg-surface-alt">
      {!isOnline && <OfflineBanner insetTop={insets.top} />}
      {/* Header */}
      <View
        className="px-6 pb-3"
        style={{ paddingTop: isOnline ? insets.top + 16 : 16 }}
      >
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-[28px] font-extrabold text-brand-text tracking-wide">
            {isOnline ? "สำรวจ" : "📥 Offline"}
          </Text>
          {isOnline && (
            <TouchableOpacity
              onPress={handleRefresh}
              className="p-2"
              activeOpacity={0.7}
            >
              <RefreshCw size={18} color={Palette.primary} strokeWidth={2} />
            </TouchableOpacity>
          )}
        </View>
        {/* Tab selector — ซ่อน quiz tab ตอน offline */}
        {isOnline && (
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 4 }}>
            {(["courses", "quiz"] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={{
                  flex: 1,
                  paddingVertical: 9,
                  borderRadius: 12,
                  alignItems: "center",
                  backgroundColor:
                    activeTab === tab ? Palette.primary : Palette.surfaceAlt,
                  borderWidth: 1.5,
                  borderColor:
                    activeTab === tab ? Palette.primary : Palette.borderLight,
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "700",
                    color: activeTab === tab ? "#fff" : Palette.textMuted,
                  }}
                >
                  {tab === "courses" ? "📚 บทเรียน" : "✏️ แบบทดสอบ"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 80 + insets.bottom + 16,
          paddingTop: 8,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Palette.primary}
            colors={[Palette.primary]}
          />
        }
      >
        {(!isOnline || activeTab === "courses") && (
          <CoursesTab
            courses={courses}
            loading={loading}
            error={error}
            progressMap={progressMap ?? {}}
            onRefresh={handleRefresh}
            onCoursePress={(course) =>
              router.push({
                pathname: "/video/[id]",
                params: { id: course.id, courseTitle: course.title },
              } as any)
            }
          />
        )}
        {isOnline && activeTab === "quiz" && (
          <QuizTab
            courses={courses}
            initialCourseId={quizCourseId}
            enrolledIds={enrolledIds}
          />
        )}
      </ScrollView>
    </View>
  );
}
