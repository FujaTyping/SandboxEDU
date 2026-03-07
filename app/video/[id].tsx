import { Palette } from "@/constants/theme";
import { getJwt } from "@/lib/auth/token";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import {
  ArrowLeft,
  CheckCircle,
  ClipboardList,
  Play,
  UserCheck,
} from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

interface CourseDetail {
  id: string;
  title: string;
  decs?: string;
  subject: string;
  class: number;
  by?: string;
  thumbnailURL?: string;
  courseURL?: string;
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

async function getToken(): Promise<string | null> {
  return getJwt();
}

type Phase = "preview" | "player";

function CoursePlayer({
  course,
  accentColor,
  onDone,
  onBack,
  insetTop,
}: {
  course: CourseDetail;
  accentColor: string;
  onDone: () => void;
  onBack: () => void;
  insetTop: number;
}) {
  const videoUrl = course.courseURL ?? "";
  const player = useVideoPlayer(videoUrl, (p) => {
    p.loop = false;
    p.play();
  });
  const [completing, setCompleting] = useState(false);

  // Cleanup video player on unmount
  useEffect(() => {
    return () => {
      if (player) {
        player.pause();
        player.release();
      }
    };
  }, [player]);

  const handleDone = async () => {
    setCompleting(true);
    try {
      const token = await getToken();
      if (!token) {
        Alert.alert("กรุณาเข้าสู่ระบบก่อน");
        return;
      }
      const apiBase = process.env.EXPO_PUBLIC_API_BASE_URL;
      const res = await fetch(`${apiBase}/courses/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: course.id }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).message ?? `HTTP ${res.status}`);
      }
      Alert.alert("ยินดีด้วย! 🎉", "คุณเรียนจบคอร์สนี้แล้ว", [
        { text: "ตกลง", onPress: onDone },
      ]);
    } catch (e) {
      Alert.alert(
        "เกิดข้อผิดพลาด",
        e instanceof Error ? e.message : "ลองใหม่อีกครั้ง",
      );
    } finally {
      setCompleting(false);
    }
  };

  return (
    <View className="flex-1 bg-black">
      <Stack.Screen options={{ headerShown: false }} />
      {/* Back button */}
      <View
        style={{
          position: "absolute",
          top: insetTop + 8,
          left: 16,
          zIndex: 10,
        }}
      >
        <TouchableOpacity
          onPress={onBack}
          className="w-10 h-10 rounded-full bg-black/40 items-center justify-center"
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color="white" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* Video Player */}
      <VideoView
        player={player}
        style={{ width: "100%", aspectRatio: 16 / 9 }}
        allowsFullscreen
        allowsPictureInPicture
        contentFit="contain"
        nativeControls
      />

      {/* Info + Done */}
      <ScrollView
        className="flex-1 bg-surface-alt px-5"
        contentContainerStyle={{ paddingTop: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-xl font-black text-brand-text mb-1">
          {course.title}
        </Text>
        <Text className="text-sm text-brand-muted mb-4">
          {course.subject} · ม.{course.class}
          {course.by ? ` · โดย ${course.by}` : ""}
        </Text>

        {course.decs ? (
          <View className="bg-surface rounded-2xl p-4 mb-6" style={cardShadow}>
            <Text className="text-sm text-brand-secondary leading-6">
              {course.decs}
            </Text>
          </View>
        ) : null}

        {/* Done button */}
        <TouchableOpacity
          onPress={handleDone}
          disabled={completing}
          className="flex-row items-center justify-center py-4 rounded-2xl"
          style={{
            backgroundColor: completing ? "#94A3B8" : accentColor,
          }}
          activeOpacity={0.8}
        >
          {completing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <CheckCircle size={18} color="#fff" strokeWidth={2.5} />
              <Text className="text-white font-black ml-2 text-base">Done</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

export default function VideoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id, courseTitle } = useLocalSearchParams<{
    id: string;
    courseTitle?: string;
  }>();
  const gradientId = useMemo(() => `vGrad-${Date.now()}`, []);

  const [phase, setPhase] = useState<Phase>("preview");
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [enrolled, setEnrolled] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        const token = await getToken();
        const apiBase = process.env.EXPO_PUBLIC_API_BASE_URL;
        const res = await fetch(`${apiBase}/courses/${id}`, {
          headers: token ? { authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setCourse(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "โหลดข้อมูลไม่ได้");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      const token = await getToken();
      if (!token) {
        Alert.alert("กรุณาเข้าสู่ระบบก่อน");
        return;
      }
      const apiBase = process.env.EXPO_PUBLIC_API_BASE_URL;
      const res = await fetch(`${apiBase}/courses/enroll`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).message ?? `HTTP ${res.status}`);
      }
      setEnrolled(true);
    } catch (e) {
      Alert.alert(
        "เกิดข้อผิดพลาด",
        e instanceof Error ? e.message : "ลองใหม่อีกครั้ง",
      );
    } finally {
      setEnrolling(false);
    }
  };

  const accentColor = course
    ? (SUBJECT_COLOR[course.subject] ?? Palette.primary)
    : Palette.primary;
  const displayTitle = course?.title ?? courseTitle ?? "คอร์สเรียน";

  if (phase === "player" && course) {
    return (
      <CoursePlayer
        course={course}
        accentColor={accentColor}
        insetTop={insets.top}
        onBack={() => setPhase("preview")}
        onDone={() => router.back()}
      />
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-surface-alt">
        {/* Gradient Header */}
        <View className="relative" style={{ height: 160 + insets.top }}>
          <Svg
            style={{ position: "absolute", top: 0, left: 0, right: 0 }}
            width="100%"
            height={160 + insets.top}
          >
            <Defs>
              <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={accentColor} />
                <Stop offset="1" stopColor={accentColor + "AA"} />
              </LinearGradient>
            </Defs>
            <Rect
              width="100%"
              height={160 + insets.top}
              fill={`url(#${gradientId})`}
            />
          </Svg>
          <View style={{ paddingTop: insets.top + 8 }} className="px-5 pb-5">
            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={() => router.back()}
                className="w-10 h-10 rounded-full bg-white/20 items-center justify-center mr-3"
                activeOpacity={0.7}
              >
                <ArrowLeft size={20} color="white" strokeWidth={2.5} />
              </TouchableOpacity>
              <View className="flex-1">
                <Text
                  className="text-xl font-black text-white"
                  numberOfLines={1}
                >
                  {displayTitle}
                </Text>
                {course && (
                  <Text className="text-sm text-white/80">
                    {course.subject} · ม.{course.class}
                    {course.by ? ` · โดย ${course.by}` : ""}
                  </Text>
                )}
              </View>
            </View>
          </View>
        </View>

        <ScrollView
          className="flex-1 px-5"
          style={{ marginTop: -8 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {loading ? (
            <View className="items-center py-20">
              <ActivityIndicator size="large" color={accentColor} />
              <Text className="text-brand-muted text-sm mt-3">
                กำลังโหลด...
              </Text>
            </View>
          ) : error ? (
            <View
              className="bg-surface rounded-2xl p-6 mt-4 items-center"
              style={cardShadow}
            >
              <Text className="text-2xl mb-2">⚠️</Text>
              <Text className="text-sm font-semibold text-brand-text mb-1">
                โหลดข้อมูลไม่ได้
              </Text>
              <Text className="text-xs text-brand-muted text-center">
                {error}
              </Text>
            </View>
          ) : course ? (
            <>
              {/* Thumbnail — tap to play */}
              <TouchableOpacity
                onPress={() =>
                  course.courseURL ? setPhase("player") : undefined
                }
                activeOpacity={course.courseURL ? 0.85 : 1}
                className="rounded-2xl overflow-hidden mt-4 mb-4"
                style={cardShadow}
              >
                {course.thumbnailURL ? (
                  <View>
                    <Image
                      source={{ uri: course.thumbnailURL }}
                      style={{ width: "100%", height: 210 }}
                      contentFit="cover"
                    />
                    {course.courseURL && (
                      <View
                        style={{
                          position: "absolute",
                          inset: 0,
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: "rgba(0,0,0,0.25)",
                        }}
                      >
                        <View
                          style={{
                            width: 64,
                            height: 64,
                            borderRadius: 32,
                            backgroundColor: "rgba(255,255,255,0.9)",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Play size={28} color={accentColor} strokeWidth={2} />
                        </View>
                      </View>
                    )}
                  </View>
                ) : (
                  <View
                    className="items-center justify-center"
                    style={{ height: 180, backgroundColor: accentColor + "18" }}
                  >
                    <Play size={56} color={accentColor} strokeWidth={1.5} />
                  </View>
                )}
              </TouchableOpacity>

              {/* Title & Decs */}
              <View
                className="bg-surface rounded-2xl p-5 mb-4"
                style={cardShadow}
              >
                <Text className="text-lg font-black text-brand-text mb-1">
                  {course.title}
                </Text>
                {course.by && (
                  <Text className="text-xs text-brand-muted mb-3">
                    โดย {course.by}
                  </Text>
                )}
                {course.decs ? (
                  <>
                    <View className="h-px bg-edge-light mb-3" />
                    <Text className="text-sm text-brand-secondary leading-6">
                      {course.decs}
                    </Text>
                  </>
                ) : null}
              </View>

              {/* Actions */}
              <View style={{ gap: 10 }}>
                {/* Enroll */}
                <TouchableOpacity
                  onPress={handleEnroll}
                  disabled={enrolling || enrolled}
                  className="flex-row items-center justify-center py-4 rounded-2xl"
                  style={{
                    backgroundColor: enrolled ? "#22C55E" : accentColor,
                    opacity: enrolling ? 0.7 : 1,
                  }}
                  activeOpacity={0.8}
                >
                  {enrolling ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : enrolled ? (
                    <>
                      <CheckCircle size={18} color="#fff" />
                      <Text className="text-white font-bold ml-2">
                        ลงทะเบียนแล้ว
                      </Text>
                    </>
                  ) : (
                    <>
                      <UserCheck size={18} color="#fff" />
                      <Text className="text-white font-bold ml-2">Enroll</Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* Watch video */}
                {course.courseURL && (
                  <TouchableOpacity
                    onPress={() => setPhase("player")}
                    className="flex-row items-center justify-center py-4 rounded-2xl border-2"
                    style={{ borderColor: accentColor }}
                    activeOpacity={0.8}
                  >
                    <Play size={18} color={accentColor} />
                    <Text
                      className="font-bold ml-2"
                      style={{ color: accentColor }}
                    >
                      เล่นวิดีโอ
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Quiz */}
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: "/exam/[id]",
                      params: { id, courseTitle: course.title },
                    } as any)
                  }
                  className="flex-row items-center justify-center py-4 rounded-2xl"
                  style={{ backgroundColor: "#8B5CF6" }}
                  activeOpacity={0.8}
                >
                  <ClipboardList size={18} color="#fff" />
                  <Text className="text-white font-bold ml-2">ทำแบบทดสอบ</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : null}
        </ScrollView>
      </View>
    </>
  );
}
