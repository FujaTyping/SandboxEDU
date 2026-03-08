import { CourseListSkeleton } from "@/components/LoadingSkeleton";
import { Palette } from "@/constants/theme";
import { getJwt } from "@/lib/auth/token";
import { getVideoProgress } from "@/lib/progress/videoProgress";
import { useFocusEffect } from "@react-navigation/native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
    BookOpen,
    CheckCircle,
    ClipboardList,
    RefreshCw,
    Zap,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
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

async function getAuthHeader(): Promise<string | null> {
  const jwt = await getJwt();
  return jwt ? `Bearer ${jwt}` : null;
}

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

function QuizTab({ courses }: { courses: ApiCourse[] }) {
  const router = useRouter();
  const [selectedCourse, setSelectedCourse] = useState<ApiCourse | null>(null);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    "medium",
  );
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStart = async () => {
    if (!selectedCourse) return;
    setStarting(true);
    setError(null);
    try {
      const token = await getAuthHeader();
      if (!token) {
        setError("กรุณาเข้าสู่ระบบก่อนทำแบบทดสอบ");
        return;
      }
      const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
      const res = await fetch(`${apiBaseUrl}/quiz/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token,
        },
        body: JSON.stringify({ id: selectedCourse.id, difficulty }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).message ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      router.push({
        pathname: "/exam/[id]",
        params: {
          id: selectedCourse.id,
          quizData: JSON.stringify(data),
          courseTitle: selectedCourse.title,
          difficulty,
        },
      } as any);
    } catch (e) {
      setError(e instanceof Error ? e.message : "เริ่มแบบทดสอบไม่ได้");
    } finally {
      setStarting(false);
    }
  };

  if (courses.length === 0) {
    return (
      <View className="items-center py-24 px-6">
        <ClipboardList size={40} color="#CBD5E1" strokeWidth={1.5} />
        <Text className="text-brand-muted text-sm mt-3 text-center">
          โหลดคอร์สก่อนเพื่อเริ่มทำแบบทดสอบ
        </Text>
      </View>
    );
  }

  return (
    <View className="px-6" style={{ gap: 16 }}>
      {/* Step 1: เลือกคอร์ส */}
      <View>
        <Text className="text-sm font-extrabold text-brand-text mb-3">
          1. เลือกบทเรียน
        </Text>
        <View style={{ gap: 8 }}>
          {courses.map((c) => {
            const color = SUBJECT_COLOR[c.subject] ?? Palette.primary;
            const selected = selectedCourse?.id === c.id;
            return (
              <TouchableOpacity
                key={c.id}
                onPress={() => setSelectedCourse(c)}
                className="flex-row items-center p-3 rounded-xl"
                style={{
                  backgroundColor: selected ? color + "18" : "#F8FAFC",
                  borderWidth: 1.5,
                  borderColor: selected ? color : "#E2E8F0",
                }}
                activeOpacity={0.7}
              >
                {selected && (
                  <CheckCircle
                    size={16}
                    color={color}
                    style={{ marginRight: 8 }}
                  />
                )}
                <View className="flex-1">
                  <Text
                    className="text-sm font-semibold text-brand-text"
                    numberOfLines={1}
                  >
                    {c.title}
                  </Text>
                  <Text className="text-[10px] text-brand-muted mt-0.5">
                    {c.subject} · ม.{c.class}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Step 2: เลือกระดับ */}
      <View>
        <Text className="text-sm font-extrabold text-brand-text mb-3">
          2. ระดับความยาก
        </Text>
        <View className="flex-row" style={{ gap: 8 }}>
          {DIFFICULTY_LABELS.map((d) => (
            <TouchableOpacity
              key={d.key}
              onPress={() => setDifficulty(d.key)}
              className="flex-1 py-3 rounded-xl items-center"
              style={{
                backgroundColor:
                  difficulty === d.key ? d.color + "20" : "#F8FAFC",
                borderWidth: 1.5,
                borderColor: difficulty === d.key ? d.color : "#E2E8F0",
              }}
              activeOpacity={0.7}
            >
              <Text
                className="text-xs font-bold"
                style={{
                  color: difficulty === d.key ? d.color : "#64748B",
                }}
              >
                {d.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Error */}
      {error && (
        <View className="bg-red-50 rounded-xl p-3">
          <Text className="text-xs text-red-500">{error}</Text>
        </View>
      )}

      {/* Start button */}
      <TouchableOpacity
        onPress={handleStart}
        disabled={!selectedCourse || starting}
        className="py-4 rounded-2xl items-center"
        style={{
          backgroundColor:
            selectedCourse && !starting ? Palette.primary : "#E2E8F0",
        }}
        activeOpacity={0.8}
      >
        {starting ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <View className="flex-row items-center" style={{ gap: 8 }}>
            <Zap size={16} color={selectedCourse ? "#fff" : "#94A3B8"} />
            <Text
              className="text-base font-extrabold"
              style={{ color: selectedCourse ? "#fff" : "#94A3B8" }}
            >
              เริ่มทำแบบทดสอบ
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [courses, setCourses] = useState<ApiCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});

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

  const fetchCourses = useCallback(async (isRefresh = false) => {
    const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
    if (!apiBaseUrl) {
      setError("ไม่พบ API URL");
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const res = await fetch(`${apiBaseUrl}/courses/all`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list: ApiCourse[] = Array.isArray(data)
        ? data
        : (data.courses ?? []);
      setCourses(list);
      loadProgressMap(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "โหลดข้อมูลไม่ได้");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleRefresh = useCallback(() => {
    fetchCourses(true);
  }, [fetchCourses]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Reload progress every time tab comes into focus
  useFocusEffect(
    useCallback(() => {
      if (courses.length > 0) loadProgressMap(courses);
    }, [courses, loadProgressMap]),
  );

  return (
    <View className="flex-1 bg-surface-alt">
      {/* Header */}
      <View className="px-6 pb-3" style={{ paddingTop: insets.top + 16 }}>
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-[28px] font-extrabold text-brand-text tracking-wide">
            สำรวจ
          </Text>
          <TouchableOpacity
            onPress={handleRefresh}
            className="p-2"
            activeOpacity={0.7}
          >
            <RefreshCw size={18} color={Palette.primary} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40, paddingTop: 8 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Palette.primary}
            colors={[Palette.primary]}
          />
        }
      >
        <CoursesTab
          courses={courses}
          loading={loading}
          error={error}
          progressMap={progressMap}
          onRefresh={handleRefresh}
          onCoursePress={(course) =>
            router.push({
              pathname: "/video/[id]",
              params: { id: course.id, courseTitle: course.title },
            } as any)
          }
        />
      </ScrollView>
    </View>
  );
}
