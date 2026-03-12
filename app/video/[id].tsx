import { Palette } from "@/constants/theme";
import { getJwtWithRefresh } from "@/lib/auth/jwtRefresh";
import {
  deleteCourse,
  downloadCourse,
  getLocalCourseUri,
  isCourseDownloaded,
} from "@/lib/offline/downloadManager";
import { saveQuizRecord } from "@/lib/progress/quizHistory";
import {
  clearVideoProgress,
  formatProgress,
  formatTime,
  getVideoProgress,
  saveVideoProgress,
} from "@/lib/progress/videoProgress";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import { useVideoPlayer, VideoView } from "expo-video";
import {
  ArrowLeft,
  Check,
  CheckCircle,
  ClipboardList,
  Play,
  Sparkles,
  Zap,
} from "lucide-react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MathJaxView from "react-native-mathjax";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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

function hasMath(text: string): boolean {
  return /\$|\\\(|\\\[|\\frac|\\sqrt|\\sum|\\int|\\pi|\\alpha|\\beta|\\theta/.test(
    text,
  );
}

function MathText({
  content,
  fontSize = 16,
  color = "#111",
  fontWeight = "normal",
}: {
  content: string;
  fontSize?: number;
  color?: string;
  fontWeight?: string;
}) {
  if (!hasMath(content)) {
    return (
      <Text
        style={{
          fontSize,
          color,
          fontWeight: fontWeight as any,
          lineHeight: fontSize * 1.5,
        }}
      >
        {content}
      </Text>
    );
  }
  const mathJaxOptions = {
    messageStyle: "none",
    extensions: ["tex2jax.js"],
    jax: ["input/TeX", "output/HTML-CSS"],
    tex2jax: {
      inlineMath: [
        ["$", "$"],
        ["\\(", "\\)"],
      ],
      displayMath: [
        ["$$", "$$"],
        ["\\[", "\\]"],
      ],
      processEscapes: true,
    },
    TeX: {
      extensions: [
        "AMSmath.js",
        "AMSsymbols.js",
        "noErrors.js",
        "noUndefined.js",
      ],
    },
  };
  return (
    <MathJaxView
      mathJaxOptions={mathJaxOptions}
      html={`<span style="font-size:${fontSize}px;color:${color};font-weight:${fontWeight};">${content}</span>`}
      style={{ minHeight: fontSize * 2 }}
    />
  );
}

async function getToken(): Promise<string | null> {
  return getJwtWithRefresh();
}

type Phase = "preview" | "player" | "quiz";
type Difficulty = "easy" | "medium" | "hard";

const DIFFICULTY_OPTIONS: {
  key: Difficulty;
  label: string;
  desc: string;
  color: string;
  emoji: string;
}[] = [
  {
    key: "easy",
    label: "ง่าย",
    desc: "คำถามพื้นฐาน",
    color: "#22C55E",
    emoji: "🟢",
  },
  {
    key: "medium",
    label: "ปานกลาง",
    desc: "คำถามกลาง",
    color: "#F59E0B",
    emoji: "🟡",
  },
  {
    key: "hard",
    label: "ยาก",
    desc: "คำถามขั้นสูง",
    color: "#EF4444",
    emoji: "🔴",
  },
];

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
  const [completing, setCompleting] = useState(false);
  const [hasResumed, setHasResumed] = useState(false);
  const [videoSource, setVideoSource] = useState<string | null>(null);
  const isMounted = useRef(true);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [liveProgress, setLiveProgress] = useState<{
    pct: number;
    current: number;
    duration: number;
  } | null>(null);

  // Resolve local file first, fallback to online URL
  useEffect(() => {
    (async () => {
      const localUri = await getLocalCourseUri(course.id);
      if (localUri) {
        console.log("[Player] Using offline video:", localUri);
        setVideoSource(localUri);
      } else {
        console.log("[Player] Using online video:", course.courseURL);
        setVideoSource(course.courseURL ?? null);
      }
    })();
  }, [course.id, course.courseURL]);

  // expo-video v3: useVideoPlayer(source, setupCallback)
  const player = useVideoPlayer(
    videoSource ? { uri: videoSource } : { uri: "" },
    (p) => {
      p.loop = false;
    },
  );

  // Track mounted state and cleanup
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
      // Restore portrait on unmount
      ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP,
      ).catch(() => {});
      try {
        player.pause();
      } catch (e) {}
      try {
        player.release();
      } catch (e) {}
    };
  }, []);

  // When source is resolved, replaceAsync and play
  useEffect(() => {
    if (!videoSource) return;
    player.replaceAsync({ uri: videoSource }).catch((e: unknown) => {
      console.warn("[Player] replaceAsync() failed:", e);
    });
  }, [videoSource]);

  // Handle fullscreen orientation
  const handleFullscreenEnter = async () => {
    setIsFullscreen(true);
    await ScreenOrientation.lockAsync(
      ScreenOrientation.OrientationLock.LANDSCAPE,
    ).catch(() => {});
  };

  const handleFullscreenExit = async () => {
    setIsFullscreen(false);
    await ScreenOrientation.lockAsync(
      ScreenOrientation.OrientationLock.PORTRAIT_UP,
    ).catch(() => {});
  };

  // Resume from last saved position
  useEffect(() => {
    if (!videoSource || hasResumed) return;

    (async () => {
      const progress = await getVideoProgress(course.id);
      if (!isMounted.current) return;

      const delay = progress && progress.percentage < 90 ? 800 : 300;
      resumeTimer.current = setTimeout(() => {
        if (!isMounted.current) return;
        try {
          if (progress && progress.percentage < 90) {
            player.currentTime = progress.currentTime;
            console.log(
              `[Player] Resuming from ${formatTime(progress.currentTime)} (${formatProgress(progress)})`,
            );
          }
          player.play();
        } catch (e) {
          console.warn("[Player] play/seek failed:", e);
        }
      }, delay);

      setHasResumed(true);
    })();
  }, [videoSource, course.id, hasResumed]);

  // Poll currentTime every second for live progress display + save every 5s
  useEffect(() => {
    if (!videoSource) return;
    let tick = 0;
    const interval = setInterval(() => {
      if (!isMounted.current) return;
      try {
        const currentTime = player.currentTime ?? 0;
        const duration = player.duration ?? 0;
        tick++;
        // Guard against 0, Infinity, NaN
        const validDuration = isFinite(duration) && duration > 0;
        if (validDuration && currentTime >= 0) {
          const pct = (currentTime / duration) * 100;
          setLiveProgress({ pct, current: currentTime, duration });
          if (tick % 5 === 0) {
            saveVideoProgress(course.id, currentTime, duration);
          }
        }
      } catch (e) {
        console.warn("[Progress] poll error:", e);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [course.id, videoSource]);

  const handleDone = async () => {
    setCompleting(true);
    try {
      // Save final progress as 100%
      if (player) {
        await saveVideoProgress(course.id, player.duration, player.duration);
      }

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

      // Clear progress after completion
      await clearVideoProgress(course.id);

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

  const [descExpanded, setDescExpanded] = useState(false);

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* ── Header bar (above video, below Dynamic Island) ── */}
      <View
        style={{
          backgroundColor: "#000",
          paddingTop: insetTop,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 12,
            paddingVertical: 8,
            gap: 10,
          }}
        >
          <TouchableOpacity
            onPress={onBack}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: "rgba(255,255,255,0.12)",
              alignItems: "center",
              justifyContent: "center",
            }}
            activeOpacity={0.7}
          >
            <ArrowLeft size={18} color="white" strokeWidth={2.5} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text
              style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}
              numberOfLines={1}
            >
              {course.title}
            </Text>
            {liveProgress && liveProgress.duration > 0 ? (
              <Text
                style={{
                  color: "rgba(255,255,255,0.6)",
                  fontSize: 11,
                  marginTop: 1,
                }}
              >
                {formatTime(liveProgress.current)} /{" "}
                {formatTime(liveProgress.duration)}
                {"  •  "}
                {Math.round(liveProgress.pct)}%
              </Text>
            ) : null}
          </View>
        </View>
      </View>

      {/* ── Video area ── */}
      <View
        style={{ backgroundColor: "#000", width: "100%", aspectRatio: 16 / 9 }}
      >
        {videoSource === null ? (
          <View
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
          >
            <ActivityIndicator size="large" color="#fff" />
            <Text
              style={{
                color: "#fff",
                marginTop: 12,
                fontSize: 13,
                opacity: 0.7,
              }}
            >
              กำลังโหลดวิดีโอ...
            </Text>
          </View>
        ) : (
          <VideoView
            player={player}
            style={{ width: "100%", height: "100%" }}
            fullscreenOptions={{ enable: true }}
            allowsPictureInPicture
            contentFit="contain"
            nativeControls
            onFullscreenEnter={handleFullscreenEnter}
            onFullscreenExit={handleFullscreenExit}
          />
        )}
      </View>

      {/* ── Progress bar under video ── */}
      <View
        style={{
          backgroundColor: "#000",
          paddingHorizontal: 12,
          paddingBottom: 10,
          paddingTop: 4,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 5,
          }}
        >
          <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 11 }}>
            {liveProgress && liveProgress.duration > 0
              ? `ดูไปแล้ว ${formatTime(liveProgress.current)}`
              : "ผู้ผลิตกำลังโหลด..."}
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 11 }}>
            {liveProgress && liveProgress.duration > 0
              ? formatTime(liveProgress.duration)
              : ""}
          </Text>
        </View>
        <View
          style={{
            height: 3,
            backgroundColor: "rgba(255,255,255,0.15)",
            borderRadius: 2,
          }}
        >
          <View
            style={{
              height: 3,
              borderRadius: 2,
              backgroundColor: accentColor,
              width: liveProgress
                ? `${Math.min(liveProgress.pct, 100)}%`
                : "0%",
            }}
          />
        </View>
      </View>

      {/* ── Info panel ── */}
      <ScrollView
        style={{ flex: 1, backgroundColor: "#ffffff" }}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Title + meta */}
        <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
          <Text
            style={{
              color: "#111111",
              fontSize: 17,
              fontWeight: "800",
              lineHeight: 24,
              marginBottom: 8,
            }}
          >
            {course.title}
          </Text>

          {/* Tags row */}
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 6,
              marginBottom: 12,
            }}
          >
            {course.subject ? (
              <View
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 20,
                  backgroundColor: accentColor + "22",
                  borderWidth: 1,
                  borderColor: accentColor + "55",
                }}
              >
                <Text
                  style={{
                    color: accentColor,
                    fontSize: 12,
                    fontWeight: "600",
                  }}
                >
                  {course.subject}
                </Text>
              </View>
            ) : null}
            {course.class ? (
              <View
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 20,
                  backgroundColor: "#F0F0F0",
                }}
              >
                <Text
                  style={{ color: "#666", fontSize: 12, fontWeight: "600" }}
                >
                  ม.{course.class}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Divider */}
          <View
            style={{
              height: 1,
              backgroundColor: "#E5E5E5",
              marginBottom: 14,
            }}
          />

          {/* Channel-style row */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: accentColor,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "800" }}>
                {(course.by ?? "T").charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#111", fontWeight: "700", fontSize: 14 }}>
                {course.by ?? "ผู้สอน"}
              </Text>
              <Text style={{ color: "#888", fontSize: 12, marginTop: 1 }}>
                SandboxEDU
              </Text>
            </View>
          </View>

          {/* Description (collapsible) */}
          {course.decs ? (
            <TouchableOpacity
              onPress={() => setDescExpanded((v) => !v)}
              activeOpacity={0.8}
              style={{
                backgroundColor: "#F5F5F5",
                borderRadius: 12,
                padding: 14,
                marginBottom: 20,
              }}
            >
              <Text
                style={{ color: "#444", fontSize: 13, lineHeight: 20 }}
                numberOfLines={descExpanded ? undefined : 3}
              >
                {course.decs}
              </Text>
              <Text
                style={{
                  color: accentColor,
                  fontSize: 12,
                  fontWeight: "700",
                  marginTop: 6,
                }}
              >
                {descExpanded ? "▲ ย่อ" : "▼ อ่านเพิ่มเติม"}
              </Text>
            </TouchableOpacity>
          ) : null}

          {/* ── Done button ── */}
          <TouchableOpacity
            onPress={handleDone}
            disabled={completing}
            activeOpacity={0.85}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 16,
              borderRadius: 14,
              backgroundColor: completing ? "#555" : accentColor,
              shadowColor: accentColor,
              shadowOpacity: completing ? 0 : 0.45,
              shadowRadius: 14,
              shadowOffset: { width: 0, height: 5 },
              elevation: 6,
            }}
          >
            {completing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <CheckCircle size={20} color="#fff" strokeWidth={2.5} />
                <Text
                  style={{
                    color: "#fff",
                    fontWeight: "800",
                    fontSize: 16,
                    marginLeft: 8,
                    letterSpacing: 0.3,
                  }}
                >
                  เรียนจบแล้ว!
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function QuizScreen({
  course,
  accentColor,
  insetTop,
  onBack,
}: {
  course: CourseDetail;
  accentColor: string;
  insetTop: number;
  onBack: () => void;
}) {
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [starting, setStarting] = useState(false);
  const [phase, setPhase] = useState<"select" | "playing" | "result">("select");
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStart = async () => {
    setStarting(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) {
        setError("กรุณาเข้าสู่ระบบก่อน");
        return;
      }
      const apiBase = process.env.EXPO_PUBLIC_API_BASE_URL;
      const reqBody = { id: String(course.id), difficulty };
      console.log("[QuizScreen] POST /quiz/generate body:", reqBody);
      const res = await fetch(`${apiBase}/quiz/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(reqBody),
      });
      if (!res.ok) {
        const errText = await res.text();
        console.error("[QuizScreen] /quiz/generate error:", errText);
        let msg = `HTTP ${res.status}`;
        try {
          msg = (JSON.parse(errText) as any).message ?? msg;
        } catch {}
        throw new Error(msg);
      }
      const data = await res.json();
      const qs = Array.isArray(data)
        ? data
        : (data.questions ?? data.quiz ?? []);
      if (qs.length === 0) throw new Error("ไม่พบคำถาม");
      setQuestions(qs);
      setCurrentQ(0);
      setAnswers([]);
      setSelected(null);
      setPhase("playing");
    } catch (e) {
      setError(e instanceof Error ? e.message : "โหลดแบบทดสอบไม่ได้");
    } finally {
      setStarting(false);
    }
  };

  const handleAnswer = async (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    const q = questions[currentQ];
    const choicesArr: string[] = q.choices ?? q.options ?? [];
    let correctIdx: number;
    if (q.key !== undefined && q.key !== null && !isNaN(Number(q.key))) {
      // key เป็น index ของ choices array
      correctIdx = Number(q.key);
    } else {
      // key เป็น text — หา index จาก choices
      correctIdx = choicesArr.indexOf(String(q.key ?? q.answer ?? ""));
    }
    const isCorrect = idx === correctIdx;
    const newAnswers = [...answers, isCorrect];

    setTimeout(async () => {
      if (currentQ + 1 < questions.length) {
        setCurrentQ((p) => p + 1);
        setSelected(null);
        setAnswers(newAnswers);
      } else {
        // Done - submit result
        setAnswers(newAnswers);
        setPhase("result");
        setSubmitting(true);
        try {
          const correct = newAnswers.filter(Boolean).length;
          const wrong = newAnswers.length - correct;
          const token = await getToken();
          // บันทึก local history
          await saveQuizRecord({
            courseId: course.id,
            courseTitle: course.title,
            correct,
            wrong,
            total: newAnswers.length,
            timestamp: Date.now(),
          });
          if (token) {
            const apiBase = process.env.EXPO_PUBLIC_API_BASE_URL;
            await fetch(`${apiBase}/quiz/complete`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ id: course.id, correct, wrong }),
            });
          }
        } catch (_) {
        } finally {
          setSubmitting(false);
        }
      }
    }, 900);
  };

  // ── Select difficulty screen ──
  if (phase === "select") {
    return (
      <View style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
        <Stack.Screen options={{ headerShown: false }} />
        {/* Header */}
        <View style={{ backgroundColor: accentColor, paddingTop: insetTop }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: 16,
              gap: 12,
            }}
          >
            <TouchableOpacity
              onPress={onBack}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: "rgba(255,255,255,0.2)",
                alignItems: "center",
                justifyContent: "center",
              }}
              activeOpacity={0.7}
            >
              <ArrowLeft size={18} color="#fff" strokeWidth={2.5} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text
                style={{ color: "#fff", fontWeight: "800", fontSize: 16 }}
                numberOfLines={1}
              >
                {course.title}
              </Text>
              <Text
                style={{
                  color: "rgba(255,255,255,0.75)",
                  fontSize: 12,
                  marginTop: 1,
                }}
              >
                แบบทดสอบ
              </Text>
            </View>
            <ClipboardList size={22} color="rgba(255,255,255,0.8)" />
          </View>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <Text
            style={{
              fontSize: 22,
              fontWeight: "800",
              color: "#111",
              marginBottom: 6,
            }}
          >
            เลือกระดับความยาก
          </Text>
          <Text style={{ fontSize: 14, color: "#64748B", marginBottom: 24 }}>
            ระบบจะสร้างคำถามให้อัตโนมัติตามระดับที่เลือก
          </Text>

          <View style={{ gap: 12, marginBottom: 28 }}>
            {DIFFICULTY_OPTIONS.map((opt) => {
              const active = difficulty === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  onPress={() => setDifficulty(opt.key)}
                  activeOpacity={0.8}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    padding: 18,
                    borderRadius: 16,
                    backgroundColor: active ? opt.color + "15" : "#fff",
                    borderWidth: 2,
                    borderColor: active ? opt.color : "#E2E8F0",
                    gap: 14,
                  }}
                >
                  <Text style={{ fontSize: 28 }}>{opt.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontWeight: "800",
                        fontSize: 16,
                        color: active ? opt.color : "#111",
                      }}
                    >
                      {opt.label}
                    </Text>
                    <Text
                      style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}
                    >
                      {opt.desc}
                    </Text>
                  </View>
                  {active && (
                    <View
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        backgroundColor: opt.color,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Check size={13} color="#fff" strokeWidth={3} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {error && (
            <View
              style={{
                backgroundColor: "#FEF2F2",
                borderRadius: 12,
                padding: 14,
                marginBottom: 16,
              }}
            >
              <Text style={{ color: "#DC2626", fontSize: 13 }}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            onPress={handleStart}
            disabled={starting}
            activeOpacity={0.85}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 18,
              borderRadius: 16,
              backgroundColor: starting ? "#94A3B8" : accentColor,
              gap: 10,
              shadowColor: accentColor,
              shadowOpacity: starting ? 0 : 0.4,
              shadowRadius: 14,
              shadowOffset: { width: 0, height: 6 },
              elevation: 6,
            }}
          >
            {starting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Zap size={20} color="#fff" strokeWidth={2.5} />
                <Text
                  style={{ color: "#fff", fontWeight: "800", fontSize: 17 }}
                >
                  เริ่มทำแบบทดสอบ
                </Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ── Playing screen ──
  if (phase === "playing") {
    const q = questions[currentQ];
    const choices: string[] = q.choices ?? q.options ?? [];
    const answerKey: string = q.key ?? q.answer ?? "";
    const correctIdx: number =
      typeof answerKey === "number" ? answerKey : choices.indexOf(answerKey);
    const questionText: string = q.title ?? q.question ?? q.text ?? q.q ?? "";
    const diffOpt = DIFFICULTY_OPTIONS.find((d) => d.key === difficulty)!;

    return (
      <View style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
        <Stack.Screen options={{ headerShown: false }} />
        {/* Header — no back button once exam starts */}
        <View
          style={{
            backgroundColor: accentColor,
            paddingTop: insetTop,
            paddingBottom: 14,
            paddingHorizontal: 16,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingTop: 8,
            }}
          >
            <View>
              <Text style={{ color: "#fff", fontWeight: "800", fontSize: 15 }}>
                ข้อ {currentQ + 1} / {questions.length}
              </Text>
              <Text
                style={{
                  color: "rgba(255,255,255,0.7)",
                  fontSize: 12,
                  marginTop: 1,
                }}
              >
                {diffOpt.emoji} {diffOpt.label}
              </Text>
            </View>
            {/* Score so far */}
            <View
              style={{
                backgroundColor: "rgba(255,255,255,0.18)",
                borderRadius: 20,
                paddingHorizontal: 14,
                paddingVertical: 6,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>
                ถูก {answers.filter(Boolean).length} ข้อ
              </Text>
            </View>
          </View>
          {/* Progress bar */}
          <View
            style={{
              marginTop: 12,
              height: 5,
              backgroundColor: "rgba(255,255,255,0.25)",
              borderRadius: 3,
            }}
          >
            <View
              style={{
                height: 5,
                borderRadius: 3,
                backgroundColor: "#fff",
                width: `${((currentQ + 1) / questions.length) * 100}%`,
              }}
            />
          </View>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 16,
              padding: 18,
              marginBottom: 20,
              borderLeftWidth: 4,
              borderLeftColor: accentColor,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: "700",
                color: accentColor,
                marginBottom: 8,
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              คำถามข้อที่ {currentQ + 1}
            </Text>
            <MathText
              content={questionText}
              fontSize={17}
              color="#111"
              fontWeight="700"
            />
          </View>

          <View style={{ gap: 12 }}>
            {choices.map((choice, idx) => {
              const isSelected = selected === idx;
              const isCorrect = idx === correctIdx;
              let bg = "#fff";
              let border = "#E2E8F0";
              let textColor = "#111";
              if (selected !== null) {
                if (isCorrect) {
                  bg = "#F0FDF4";
                  border = "#22C55E";
                  textColor = "#16A34A";
                } else if (isSelected) {
                  bg = "#FEF2F2";
                  border = "#EF4444";
                  textColor = "#DC2626";
                }
              } else if (isSelected) {
                bg = accentColor + "15";
                border = accentColor;
              }
              return (
                <TouchableOpacity
                  key={idx}
                  onPress={() => handleAnswer(idx)}
                  activeOpacity={0.8}
                  style={{
                    padding: 16,
                    borderRadius: 14,
                    backgroundColor: bg,
                    borderWidth: 2,
                    borderColor: border,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: border + "33",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontWeight: "800",
                        fontSize: 13,
                        color: border === "#E2E8F0" ? "#94A3B8" : border,
                      }}
                    >
                      {String.fromCharCode(65 + idx)}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <MathText
                      content={choice}
                      fontSize={15}
                      color={textColor}
                      fontWeight="600"
                    />
                  </View>
                  {selected !== null && isCorrect && (
                    <CheckCircle size={18} color="#22C55E" />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>
    );
  }

  // ── Result screen ──
  const correct = answers.filter(Boolean).length;
  const total = answers.length;
  const wrong = total - correct;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  const passed = pct >= 60;

  return (
    <View style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* Header — no back until done */}
      <View
        style={{
          backgroundColor: accentColor,
          paddingTop: insetTop,
          paddingBottom: 14,
          paddingHorizontal: 16,
        }}
      >
        <View style={{ paddingTop: 8 }}>
          <Text style={{ color: "#fff", fontWeight: "800", fontSize: 16 }}>
            ผลการสอบ
          </Text>
          <Text
            style={{
              color: "rgba(255,255,255,0.7)",
              fontSize: 12,
              marginTop: 2,
            }}
          >
            {course.title}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* Main score card */}
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 24,
            padding: 28,
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <Text style={{ fontSize: 56, marginBottom: 6 }}>
            {passed ? "🎉" : "📚"}
          </Text>
          <Text
            style={{
              fontSize: 48,
              fontWeight: "900",
              color: passed ? "#16A34A" : "#DC2626",
              lineHeight: 56,
            }}
          >
            {pct}%
          </Text>
          <Text
            style={{
              fontSize: 15,
              fontWeight: "700",
              color: passed ? "#16A34A" : "#DC2626",
              marginTop: 4,
            }}
          >
            {passed ? "✅ ผ่านแบบทดสอบ" : "❌ ยังไม่ผ่าน (ต้องได้ ≥ 60%)"}
          </Text>

          {/* Score bar */}
          <View
            style={{
              width: "100%",
              height: 10,
              backgroundColor: "#E2E8F0",
              borderRadius: 5,
              marginTop: 20,
              marginBottom: 20,
            }}
          >
            <View
              style={{
                height: 10,
                borderRadius: 5,
                backgroundColor: passed ? "#22C55E" : "#EF4444",
                width: `${pct}%`,
              }}
            />
          </View>

          {/* Stat row */}
          <View style={{ flexDirection: "row", gap: 12, width: "100%" }}>
            <View
              style={{
                flex: 1,
                backgroundColor: "#F0FDF4",
                borderRadius: 14,
                padding: 14,
                alignItems: "center",
              }}
            >
              <Text
                style={{ fontSize: 26, fontWeight: "900", color: "#16A34A" }}
              >
                {correct}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: "#16A34A",
                  fontWeight: "600",
                  marginTop: 2,
                }}
              >
                ตอบถูก
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: "#FEF2F2",
                borderRadius: 14,
                padding: 14,
                alignItems: "center",
              }}
            >
              <Text
                style={{ fontSize: 26, fontWeight: "900", color: "#DC2626" }}
              >
                {wrong}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: "#DC2626",
                  fontWeight: "600",
                  marginTop: 2,
                }}
              >
                ตอบผิด
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: "#F8FAFC",
                borderRadius: 14,
                padding: 14,
                alignItems: "center",
                borderWidth: 1,
                borderColor: "#E2E8F0",
              }}
            >
              <Text
                style={{ fontSize: 26, fontWeight: "900", color: "#475569" }}
              >
                {total}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: "#475569",
                  fontWeight: "600",
                  marginTop: 2,
                }}
              >
                ทั้งหมด
              </Text>
            </View>
          </View>
        </View>

        {/* Submitting status */}
        {submitting ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              backgroundColor: "#fff",
              borderRadius: 14,
              padding: 14,
              marginBottom: 16,
            }}
          >
            <ActivityIndicator size="small" color={accentColor} />
            <Text style={{ color: "#475569", fontSize: 13, fontWeight: "600" }}>
              กำลังบันทึกผลการสอบ...
            </Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            <TouchableOpacity
              onPress={() => {
                setPhase("select");
                setSelected(null);
                setAnswers([]);
                setCurrentQ(0);
              }}
              activeOpacity={0.85}
              style={{
                paddingVertical: 16,
                borderRadius: 16,
                backgroundColor: accentColor,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "800", fontSize: 16 }}>
                ทำใหม่อีกครั้ง
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onBack}
              activeOpacity={0.85}
              style={{
                paddingVertical: 16,
                borderRadius: 16,
                backgroundColor: "#F1F5F9",
                alignItems: "center",
              }}
            >
              <Text
                style={{ color: "#475569", fontWeight: "700", fontSize: 16 }}
              >
                กลับหน้าคอร์ส
              </Text>
            </TouchableOpacity>
          </View>
        )}
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
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [watchProgress, setWatchProgress] = useState<number>(0);
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryExpanded, setSummaryExpanded] = useState(false);

  const ENROLL_KEY = `@enrolled_${id}`;

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);

        // Restore cached enrolled state first (works offline)
        const AsyncStorage = (
          await import("@react-native-async-storage/async-storage")
        ).default;
        const cachedEnrolled = await AsyncStorage.getItem(ENROLL_KEY);
        if (cachedEnrolled === "1") setEnrolled(true);

        // Check downloaded & progress from local storage
        const downloaded = await isCourseDownloaded(id);
        setIsDownloaded(downloaded);
        const progress = await getVideoProgress(id);
        if (progress) setWatchProgress(progress.percentage);

        // Fetch course data (may fail offline)
        try {
          const token = await getToken();
          const apiBase = process.env.EXPO_PUBLIC_API_BASE_URL;
          const res = await fetch(`${apiBase}/courses/${id}`, {
            headers: token ? { authorization: `Bearer ${token}` } : {},
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          setCourse(data);
          // ถ้า API บอกว่า enrolled แล้ว ให้ sync ลง local cache ด้วย
          if (data.enrolled || data.isEnrolled) {
            setEnrolled(true);
            const AS = (
              await import("@react-native-async-storage/async-storage")
            ).default;
            await AS.setItem(ENROLL_KEY, "1");
          }
        } catch (fetchErr) {
          // Offline: try to build minimal course from download index
          const { getDownloadedCourses } =
            await import("@/lib/offline/downloadManager");
          const cached = await getDownloadedCourses();
          const cachedCourse = cached.find((c) => c.id === id);
          if (cachedCourse) {
            setCourse({
              id: cachedCourse.id,
              title: cachedCourse.title,
              decs: "",
              subject: "",
              class: 0,
              by: "",
              courseURL: cachedCourse.localUri,
              thumbnailURL: cachedCourse.thumbnailUri,
            });
          } else {
            throw fetchErr;
          }
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "โหลดข้อมูลไม่ได้");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleDownload = async () => {
    console.log(
      "[Download] course:",
      course?.id,
      "courseURL:",
      course?.courseURL,
      "enrolled:",
      enrolled,
    );
    if (!course || !course.courseURL) return;

    setDownloading(true);
    setDownloadProgress(0);

    try {
      await downloadCourse(
        course.id,
        course.title,
        course.courseURL,
        course.thumbnailURL,
        (progress) => {
          setDownloadProgress(progress);
        },
      );

      setIsDownloaded(true);
      Alert.alert(
        "สำเร็จ! 🎉",
        "ดาวน์โหลดวิดีโอเสร็จแล้ว สามารถดูแบบ offline ได้",
      );
    } catch (e) {
      Alert.alert(
        "เกิดข้อผิดพลาด",
        e instanceof Error ? e.message : "ดาวน์โหลดไม่สำเร็จ",
      );
    } finally {
      setDownloading(false);
      setDownloadProgress(0);
    }
  };

  const handleDeleteDownload = async () => {
    if (!course) return;

    Alert.alert(
      "ลบไฟล์ดาวน์โหลด?",
      "คุณต้องการลบวิดีโอที่ดาวน์โหลดไว้หรือไม่?",
      [
        { text: "ยกเลิก", style: "cancel" },
        {
          text: "ลบ",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteCourse(course.id);
              setIsDownloaded(false);
              Alert.alert("สำเร็จ", "ลบไฟล์ดาวน์โหลดแล้ว");
            } catch (e) {
              Alert.alert("เกิดข้อผิดพลาด", "ลบไฟล์ไม่สำเร็จ");
            }
          },
        },
      ],
    );
  };

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
      // Persist enrolled state so it survives app restarts and offline mode
      const AsyncStorage = (
        await import("@react-native-async-storage/async-storage")
      ).default;
      await AsyncStorage.setItem(ENROLL_KEY, "1");
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

  const handleSummarize = async () => {
    if (!id) return;
    setSummaryLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        Alert.alert("กรุณาเข้าสู่ระบบก่อน");
        setSummaryLoading(false);
        return;
      }
      const apiBase = process.env.EXPO_PUBLIC_API_BASE_URL;
      const res = await fetch(`${apiBase}/content/summarize/${id}`, {
        headers: { authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).message ?? `HTTP ${res.status}`);
      }
      const raw = await res.text();
      // รองรับทั้ง plain text และ JSON { summary/content/text }
      let text = raw;
      try {
        const parsed = JSON.parse(raw);
        if (typeof parsed === "string") {
          text = parsed;
        } else if (parsed && typeof parsed === "object") {
          text = parsed.summary ?? parsed.content ?? parsed.text ?? raw;
        }
      } catch {
        // plain text — ใช้ raw ตรงๆ
      }
      setSummary(text);
      setSummaryExpanded(true);
    } catch (e) {
      Alert.alert(
        "สรุปเนื้อหาไม่สำเร็จ",
        e instanceof Error ? e.message : "ลองใหม่อีกครั้ง",
      );
    } finally {
      setSummaryLoading(false);
    }
  };

  // Refresh watchProgress when returning from player
  const handlePlayerBack = async () => {
    const progress = await getVideoProgress(id);
    if (progress) setWatchProgress(progress.percentage);
    setPhase("preview");
  };

  if (phase === "player" && course) {
    return (
      <CoursePlayer
        course={course}
        accentColor={accentColor}
        insetTop={insets.top}
        onBack={handlePlayerBack}
        onDone={() => router.back()}
      />
    );
  }

  if (phase === "quiz" && course) {
    return (
      <QuizScreen
        course={course}
        accentColor={accentColor}
        insetTop={insets.top}
        onBack={() => setPhase("preview")}
      />
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-surface-alt">
        {/* Compact Header */}
        <View
          style={{
            backgroundColor: accentColor,
            paddingTop: insets.top,
            paddingBottom: 12,
            paddingHorizontal: 16,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: "rgba(255,255,255,0.2)",
                alignItems: "center",
                justifyContent: "center",
              }}
              activeOpacity={0.7}
            >
              <ArrowLeft size={18} color="white" strokeWidth={2.5} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text
                style={{ color: "#fff", fontWeight: "800", fontSize: 16 }}
                numberOfLines={1}
              >
                {displayTitle}
              </Text>
              {course && course.subject ? (
                <Text
                  style={{
                    color: "rgba(255,255,255,0.75)",
                    fontSize: 12,
                    marginTop: 1,
                  }}
                >
                  {course.subject}
                  {course.class ? ` · ม.${course.class}` : ""}
                  {course.by ? ` · ${course.by}` : ""}
                </Text>
              ) : null}
            </View>
          </View>
        </View>

        <ScrollView
          className="flex-1 px-5"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40, paddingTop: 12 }}
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
              {/* Thumbnail */}
              <View className="mt-4 mb-4" style={cardShadow}>
                <View className="rounded-2xl overflow-hidden">
                  {/* Base image or placeholder */}
                  {course.thumbnailURL ? (
                    <Image
                      source={{ uri: course.thumbnailURL }}
                      style={{ width: "100%", height: 200 }}
                      contentFit="cover"
                    />
                  ) : (
                    <View
                      style={{
                        height: 200,
                        backgroundColor: accentColor + "18",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Play size={52} color={accentColor} strokeWidth={1.5} />
                    </View>
                  )}

                  {/* Overlay play button - only shows when enrolled AND downloaded */}
                  {enrolled && isDownloaded && (
                    <TouchableOpacity
                      onPress={() => setPhase("player")}
                      activeOpacity={0.85}
                      style={{
                        position: "absolute",
                        inset: 0,
                        backgroundColor: "rgba(0,0,0,0.35)",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <View
                        style={{
                          width: 64,
                          height: 64,
                          borderRadius: 32,
                          backgroundColor: "rgba(255,255,255,0.92)",
                          alignItems: "center",
                          justifyContent: "center",
                          shadowColor: "#000",
                          shadowOpacity: 0.3,
                          shadowRadius: 8,
                          shadowOffset: { width: 0, height: 4 },
                          elevation: 6,
                        }}
                      >
                        <Play
                          size={28}
                          color={accentColor}
                          strokeWidth={2.5}
                          style={{ marginLeft: 3 }}
                        />
                      </View>
                      {watchProgress > 0 && watchProgress < 100 && (
                        <View
                          style={{
                            position: "absolute",
                            bottom: 12,
                            left: 12,
                            right: 12,
                          }}
                        >
                          <Text
                            style={{
                              color: "#fff",
                              fontSize: 12,
                              fontWeight: "600",
                              marginBottom: 4,
                            }}
                          >
                            ดูต่อ - {Math.round(watchProgress)}%
                          </Text>
                          <View
                            style={{
                              height: 4,
                              backgroundColor: "rgba(255,255,255,0.3)",
                              borderRadius: 2,
                            }}
                          >
                            <View
                              style={{
                                height: 4,
                                width: `${watchProgress}%`,
                                backgroundColor: "#fff",
                                borderRadius: 2,
                              }}
                            />
                          </View>
                        </View>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Course Info Card */}
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
                    <Text className="text-sm text-brand-secondary leading-6 mb-4">
                      {course.decs}
                    </Text>
                  </>
                ) : null}

                {/* ===== Action Buttons ===== */}
                <View style={{ gap: 10 }}>
                  {/* Enroll button or enrolled badge */}
                  {!enrolled ? (
                    <TouchableOpacity
                      onPress={handleEnroll}
                      disabled={enrolling}
                      activeOpacity={0.85}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        paddingVertical: 16,
                        borderRadius: 16,
                        backgroundColor: accentColor,
                        opacity: enrolling ? 0.7 : 1,
                        shadowColor: accentColor,
                        shadowOpacity: 0.4,
                        shadowRadius: 12,
                        shadowOffset: { width: 0, height: 5 },
                        elevation: 5,
                      }}
                    >
                      {enrolling ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Text style={{ fontSize: 18, marginRight: 8 }}>
                            🎓
                          </Text>
                          <Text
                            style={{
                              color: "#fff",
                              fontWeight: "800",
                              fontSize: 16,
                              letterSpacing: 0.3,
                            }}
                          >
                            ลงทะเบียนเรียน
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  ) : (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingVertical: 12,
                        paddingHorizontal: 16,
                        borderRadius: 14,
                        backgroundColor: "#F0FDF4",
                        borderWidth: 1.5,
                        borderColor: "#86EFAC",
                      }}
                    >
                      <Check size={18} color="#22C55E" strokeWidth={3} />
                      <Text
                        style={{
                          color: "#16A34A",
                          fontWeight: "700",
                          marginLeft: 8,
                          fontSize: 15,
                        }}
                      >
                        ลงทะเบียนแล้ว
                      </Text>
                    </View>
                  )}

                  {/* Download button - shown after enroll, hidden once downloaded, hidden on web */}
                  {enrolled &&
                    course.courseURL &&
                    !isDownloaded &&
                    Platform.OS !== "web" && (
                      <TouchableOpacity
                        onPress={handleDownload}
                        disabled={downloading}
                        activeOpacity={0.85}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "center",
                          paddingVertical: 16,
                          borderRadius: 16,
                          backgroundColor: "#059669",
                          opacity: downloading ? 0.85 : 1,
                          shadowColor: "#059669",
                          shadowOpacity: 0.35,
                          shadowRadius: 12,
                          shadowOffset: { width: 0, height: 5 },
                          elevation: 5,
                        }}
                      >
                        {downloading ? (
                          <>
                            <ActivityIndicator size="small" color="#fff" />
                            <Text
                              style={{
                                color: "#fff",
                                fontWeight: "800",
                                fontSize: 16,
                                marginLeft: 10,
                              }}
                            >
                              กำลังดาวน์โหลด...{" "}
                              {Math.round(downloadProgress * 100)}%
                            </Text>
                          </>
                        ) : (
                          <>
                            <Text style={{ fontSize: 18, marginRight: 8 }}>
                              ⬇️
                            </Text>
                            <Text
                              style={{
                                color: "#fff",
                                fontWeight: "800",
                                fontSize: 16,
                                letterSpacing: 0.3,
                              }}
                            >
                              ดาวน์โหลดวิดีโอ (Offline)
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}

                  {/* Download progress bar */}
                  {downloading && (
                    <View style={{ paddingHorizontal: 2 }}>
                      <View
                        style={{
                          height: 6,
                          backgroundColor: "#D1FAE5",
                          borderRadius: 3,
                          overflow: "hidden",
                        }}
                      >
                        <View
                          style={{
                            height: 6,
                            width: `${downloadProgress * 100}%`,
                            backgroundColor: "#10B981",
                            borderRadius: 3,
                          }}
                        />
                      </View>
                    </View>
                  )}

                  {/* Downloaded badge */}
                  {enrolled && isDownloaded && (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingVertical: 10,
                        paddingHorizontal: 16,
                        borderRadius: 12,
                        backgroundColor: "#ECFDF5",
                        borderWidth: 1,
                        borderColor: "#A7F3D0",
                      }}
                    >
                      <Check size={16} color="#059669" strokeWidth={3} />
                      <Text
                        style={{
                          color: "#059669",
                          fontWeight: "600",
                          marginLeft: 8,
                          fontSize: 13,
                        }}
                      >
                        ดาวน์โหลดแล้ว · กดที่รูปด้านบนเพื่อเล่น
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* ── Summary Card ── */}
              {enrolled && (
                <View
                  style={[
                    cardShadow,
                    {
                      backgroundColor: "#fff",
                      borderRadius: 20,
                      padding: 20,
                      marginTop: 4,
                      borderLeftWidth: 4,
                      borderLeftColor: "#8B5CF6",
                    },
                  ]}
                >
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={
                      summary
                        ? () => setSummaryExpanded((v) => !v)
                        : handleSummarize
                    }
                    disabled={summaryLoading}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <View
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 22,
                          backgroundColor: "#8B5CF615",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {summaryLoading ? (
                          <ActivityIndicator size="small" color="#8B5CF6" />
                        ) : (
                          <Sparkles size={22} color="#8B5CF6" strokeWidth={2} />
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontWeight: "800",
                            fontSize: 15,
                            color: "#111",
                          }}
                        >
                          สรุปเนื้อหา AI
                        </Text>
                        <Text
                          style={{
                            fontSize: 12,
                            color: "#64748B",
                            marginTop: 2,
                          }}
                        >
                          {summary
                            ? summaryExpanded
                              ? "กดเพื่อย่อ"
                              : "กดเพื่อดูสรุป"
                            : summaryLoading
                              ? "กำลังสรุปเนื้อหา..."
                              : "สรุปเนื้อหาคอร์สด้วย AI"}
                        </Text>
                      </View>
                      {!summary && !summaryLoading && (
                        <View
                          style={{
                            backgroundColor: "#8B5CF6",
                            paddingHorizontal: 14,
                            paddingVertical: 8,
                            borderRadius: 12,
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <Sparkles size={14} color="#fff" strokeWidth={2.5} />
                          <Text
                            style={{
                              color: "#fff",
                              fontWeight: "800",
                              fontSize: 13,
                            }}
                          >
                            สรุป
                          </Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>

                  {summary && summaryExpanded && (
                    <View
                      style={{
                        marginTop: 14,
                        paddingTop: 14,
                        borderTopWidth: 1,
                        borderTopColor: "#F1F5F9",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          color: "#334155",
                          lineHeight: 22,
                        }}
                      >
                        {summary}
                      </Text>
                      <TouchableOpacity
                        onPress={handleSummarize}
                        disabled={summaryLoading}
                        style={{ marginTop: 10, alignSelf: "flex-end" }}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            color: "#8B5CF6",
                            fontWeight: "700",
                          }}
                        >
                          {summaryLoading ? "กำลังโหลด..." : "โหลดใหม่"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}

              {/* ── Quiz Card ── */}
              {enrolled && (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() =>
                    router.push({
                      pathname: "/quiz/[id]",
                      params: {
                        id,
                        courseTitle: course.title,
                        subject: course.subject,
                        isEnrolled: "1",
                      },
                    } as any)
                  }
                  style={[
                    cardShadow,
                    {
                      backgroundColor: "#fff",
                      borderRadius: 20,
                      padding: 20,
                      marginTop: 4,
                      borderLeftWidth: 4,
                      borderLeftColor: "#8B5CF6",
                    },
                  ]}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        backgroundColor: "#8B5CF615",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <ClipboardList
                        size={22}
                        color="#8B5CF6"
                        strokeWidth={2}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontWeight: "800",
                          fontSize: 15,
                          color: "#111",
                        }}
                      >
                        แบบทดสอบ
                      </Text>
                      <Text
                        style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}
                      >
                        กดเพื่อเลือกระดับและเริ่มทำแบบทดสอบ
                      </Text>
                    </View>
                    <View
                      style={{
                        backgroundColor: "#8B5CF6",
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: 12,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <Zap size={14} color="#fff" strokeWidth={2.5} />
                      <Text
                        style={{
                          color: "#fff",
                          fontWeight: "800",
                          fontSize: 13,
                        }}
                      >
                        ทำเลย
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            </>
          ) : null}
        </ScrollView>
      </View>
    </>
  );
}
