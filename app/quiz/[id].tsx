import { Palette } from "@/constants/theme";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { getJwtWithRefresh } from "@/lib/auth/jwtRefresh";
import {
  getAvailableSavedDifficulties,
  loadSavedQuiz,
  saveQuizData,
} from "@/lib/progress/savedQuizzes";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle,
  ClipboardList,
  Lock as LockIcon,
  WifiOff,
  Zap,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
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

const DIFFICULTY_LABELS = [
  { key: "easy" as const, label: "ง่าย", color: "#22C55E", emoji: "🟢" },
  { key: "medium" as const, label: "ปานกลาง", color: "#F59E0B", emoji: "🟡" },
  { key: "hard" as const, label: "ยาก", color: "#EF4444", emoji: "🔴" },
];

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
  const jwt = await getJwtWithRefresh();
  return jwt ? `Bearer ${jwt}` : null;
}

export default function QuizDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isOnline } = useNetworkStatus();

  const {
    id,
    courseTitle,
    subject,
    isEnrolled: isEnrolledParam,
  } = useLocalSearchParams<{
    id: string;
    courseTitle?: string;
    subject?: string;
    isEnrolled?: string;
  }>();
  const isEnrolled = isEnrolledParam !== "0";

  const [savedDifficulties, setSavedDifficulties] = useState<
    Array<"easy" | "medium" | "hard">
  >([]);
  const [starting, setStarting] = useState<string | null>(null); // key = difficulty
  const [loadingPage, setLoadingPage] = useState(true);

  const loadSaved = useCallback(async () => {
    if (!id) return;
    setLoadingPage(true);
    const diffs = await getAvailableSavedDifficulties(id);
    setSavedDifficulties(diffs);
    setLoadingPage(false);
  }, [id]);

  useEffect(() => {
    loadSaved();
  }, [loadSaved]);

  const handleStartOnline = async (difficulty: "easy" | "medium" | "hard") => {
    setStarting(difficulty);
    try {
      const token = await getAuthHeader();
      if (!token) {
        Alert.alert("กรุณาเข้าสู่ระบบก่อนทำแบบทดสอบ");
        setStarting(null);
        return;
      }
      const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
      const res = await fetch(`${apiBaseUrl}/quiz/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", authorization: token },
        body: JSON.stringify({ id: String(id), difficulty }),
      });
      if (!res.ok) {
        const errText = await res.text();
        let errMsg = `HTTP ${res.status}`;
        try {
          errMsg = (JSON.parse(errText) as any).message ?? errMsg;
        } catch {}
        throw new Error(errMsg);
      }
      const data = await res.json();
      // บันทึกไว้สำหรับ offline
      const questions = Array.isArray(data) ? data : (data.questions ?? data);
      await saveQuizData(id, courseTitle ?? "แบบทดสอบ", difficulty, questions);
      setSavedDifficulties(await getAvailableSavedDifficulties(id));
      router.push({
        pathname: "/exam/[id]",
        params: {
          id,
          quizData: JSON.stringify(data),
          courseTitle: courseTitle ?? "แบบทดสอบ",
          difficulty,
        },
      } as any);
    } catch (e) {
      Alert.alert(
        "เริ่มแบบทดสอบไม่ได้",
        e instanceof Error ? e.message : "ลองใหม่อีกครั้ง",
      );
    } finally {
      setStarting(null);
    }
  };

  const handleStartOffline = async (difficulty: "easy" | "medium" | "hard") => {
    setStarting(difficulty);
    try {
      const saved = await loadSavedQuiz(id, difficulty);
      if (!saved) {
        Alert.alert("ไม่พบข้อสอบที่บันทึกไว้");
        setStarting(null);
        return;
      }
      router.push({
        pathname: "/exam/[id]",
        params: {
          id,
          quizData: JSON.stringify(saved.questions),
          courseTitle: courseTitle ?? "แบบทดสอบ",
          difficulty,
        },
      } as any);
    } catch (e) {
      Alert.alert("โหลดข้อสอบไม่ได้", e instanceof Error ? e.message : "");
    } finally {
      setStarting(null);
    }
  };

  const title = courseTitle ?? "แบบทดสอบ";

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ flex: 1, backgroundColor: Palette.surfaceAlt }}>
        {/* Header */}
        <View
          style={{
            backgroundColor: Palette.primary,
            paddingTop: insets.top + 8,
            paddingBottom: 20,
            paddingHorizontal: 20,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: "rgba(255,255,255,0.2)",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 14,
            }}
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color="#fff" strokeWidth={2.5} />
          </TouchableOpacity>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                backgroundColor: "rgba(255,255,255,0.2)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ClipboardList size={22} color="#fff" strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "900",
                  color: "#fff",
                  lineHeight: 22,
                }}
                numberOfLines={2}
              >
                {title}
              </Text>
              {subject ? (
                <Text
                  style={{
                    fontSize: 12,
                    color: "rgba(255,255,255,0.75)",
                    marginTop: 2,
                  }}
                >
                  {subject}
                </Text>
              ) : null}
            </View>
          </View>

          {/* Online/Offline badge */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              marginTop: 14,
              alignSelf: "flex-start",
              backgroundColor: isOnline
                ? "rgba(255,255,255,0.2)"
                : "rgba(0,0,0,0.2)",
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 20,
            }}
          >
            {isOnline ? (
              <Zap size={12} color="#fff" strokeWidth={2.5} />
            ) : (
              <WifiOff size={12} color="#fff" strokeWidth={2} />
            )}
            <Text style={{ fontSize: 11, fontWeight: "700", color: "#fff" }}>
              {isOnline
                ? "ออนไลน์ — สร้างข้อสอบใหม่ด้วย AI"
                : "ออฟไลน์ — ใช้ข้อสอบที่บันทึกไว้"}
            </Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={{
            padding: 20,
            paddingBottom: insets.bottom + 32,
            gap: 16,
          }}
          showsVerticalScrollIndicator={false}
        >
          {!isEnrolled ? (
            /* ── NOT ENROLLED ── */
            <View style={{ alignItems: "center", paddingTop: 40, gap: 14 }}>
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  backgroundColor: "#F1F5F9",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <LockIcon size={32} color="#94A3B8" strokeWidth={1.5} />
              </View>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "800",
                  color: Palette.text,
                  textAlign: "center",
                }}
              >
                ต้องลงทะเบียนบทเรียนก่อน
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: Palette.textMuted,
                  textAlign: "center",
                  lineHeight: 20,
                }}
              >
                ลงทะเบียนบทเรียนนี้เพื่อปลดล็อกแบบทดสอบ
              </Text>
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: "/video/[id]",
                    params: { id, courseTitle: courseTitle ?? "" },
                  } as any)
                }
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  paddingHorizontal: 24,
                  paddingVertical: 12,
                  borderRadius: 14,
                  backgroundColor: Palette.primary,
                  marginTop: 4,
                }}
                activeOpacity={0.85}
              >
                <BookOpen size={16} color="#fff" strokeWidth={2} />
                <Text
                  style={{ fontSize: 14, fontWeight: "800", color: "#fff" }}
                >
                  ไปลงทะเบียนบทเรียน
                </Text>
              </TouchableOpacity>
            </View>
          ) : loadingPage ? (
            <View style={{ alignItems: "center", paddingTop: 40 }}>
              <ActivityIndicator size="large" color={Palette.primary} />
            </View>
          ) : isOnline ? (
            /* ── ONLINE MODE ── */
            <>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "800",
                  color: Palette.text,
                  marginBottom: 4,
                }}
              >
                เลือกระดับความยาก
              </Text>
              {DIFFICULTY_LABELS.map((d) => {
                const isStarting = starting === d.key;
                return (
                  <TouchableOpacity
                    key={d.key}
                    onPress={() => handleStartOnline(d.key)}
                    disabled={starting !== null}
                    activeOpacity={0.85}
                    style={[
                      cardShadow,
                      {
                        backgroundColor: "#fff",
                        borderRadius: 16,
                        padding: 18,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 14,
                        opacity: starting !== null && !isStarting ? 0.5 : 1,
                        borderWidth: 1.5,
                        borderColor: d.color + "40",
                      },
                    ]}
                  >
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 14,
                        backgroundColor: d.color + "18",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {isStarting ? (
                        <ActivityIndicator size="small" color={d.color} />
                      ) : (
                        <Text style={{ fontSize: 24 }}>{d.emoji}</Text>
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "800",
                          color: Palette.text,
                        }}
                      >
                        ระดับ{d.label}
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          color: Palette.textMuted,
                          marginTop: 2,
                        }}
                      >
                        {d.key === "easy"
                          ? "เหมาะสำหรับฝึกพื้นฐาน"
                          : d.key === "medium"
                            ? "ท้าทายขึ้นอีกระดับ"
                            : "สำหรับผู้เชี่ยวชาญ"}
                      </Text>
                      {savedDifficulties.includes(d.key) && (
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 4,
                            marginTop: 4,
                          }}
                        >
                          <CheckCircle
                            size={11}
                            color={d.color}
                            strokeWidth={2.5}
                          />
                          <Text
                            style={{
                              fontSize: 10,
                              fontWeight: "700",
                              color: d.color,
                            }}
                          >
                            มีข้อสอบบันทึกไว้แล้ว
                          </Text>
                        </View>
                      )}
                    </View>
                    <Zap size={18} color={d.color} strokeWidth={2.5} />
                  </TouchableOpacity>
                );
              })}
            </>
          ) : (
            /* ── OFFLINE MODE ── */
            <>
              {/* Offline header */}
              <View
                style={[
                  cardShadow,
                  {
                    backgroundColor: "#fff",
                    borderRadius: 16,
                    padding: 16,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    borderWidth: 1,
                    borderColor: "#E0E0E0",
                  },
                ]}
              >
                <WifiOff size={20} color="#94A3B8" strokeWidth={1.5} />
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "700",
                      color: Palette.textSecondary,
                    }}
                  >
                    โหมดออฟไลน์
                  </Text>
                  <Text
                    style={{
                      fontSize: 11,
                      color: Palette.textMuted,
                      marginTop: 2,
                    }}
                  >
                    ทำได้เฉพาะข้อสอบที่เคยโหลดไว้แล้ว
                  </Text>
                </View>
              </View>

              {savedDifficulties.length === 0 ? (
                /* ไม่มีข้อสอบเลย */
                <View
                  style={{
                    alignItems: "center",
                    paddingVertical: 48,
                    gap: 12,
                  }}
                >
                  <ClipboardList size={48} color="#CBD5E1" strokeWidth={1.5} />
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "700",
                      color: Palette.textMuted,
                      textAlign: "center",
                    }}
                  >
                    ยังไม่มีข้อสอบที่บันทึกไว้
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: Palette.disabled,
                      textAlign: "center",
                    }}
                  >
                    เชื่อมต่ออินเทอร์เน็ตแล้วทำแบบทดสอบสักครั้ง{"\n"}
                    ระบบจะบันทึกข้อสอบไว้ให้อัตโนมัติ
                  </Text>
                </View>
              ) : (
                /* มีข้อสอบบันทึกไว้ */
                <>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "800",
                      color: Palette.text,
                      marginBottom: 4,
                    }}
                  >
                    ข้อสอบที่บันทึกไว้
                  </Text>
                  {DIFFICULTY_LABELS.map((d) => {
                    const hasSaved = savedDifficulties.includes(d.key);
                    const isStarting = starting === d.key;
                    if (!hasSaved) return null;
                    return (
                      <TouchableOpacity
                        key={d.key}
                        onPress={() => handleStartOffline(d.key)}
                        disabled={starting !== null}
                        activeOpacity={0.85}
                        style={[
                          cardShadow,
                          {
                            backgroundColor: "#fff",
                            borderRadius: 16,
                            padding: 18,
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 14,
                            borderWidth: 1.5,
                            borderColor: d.color + "50",
                            opacity: starting !== null && !isStarting ? 0.5 : 1,
                          },
                        ]}
                      >
                        <View
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 14,
                            backgroundColor: d.color + "18",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {isStarting ? (
                            <ActivityIndicator size="small" color={d.color} />
                          ) : (
                            <Text style={{ fontSize: 24 }}>{d.emoji}</Text>
                          )}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              fontSize: 16,
                              fontWeight: "800",
                              color: Palette.text,
                            }}
                          >
                            ระดับ{d.label}
                          </Text>
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 4,
                              marginTop: 4,
                            }}
                          >
                            <CheckCircle
                              size={12}
                              color={d.color}
                              strokeWidth={2.5}
                            />
                            <Text
                              style={{
                                fontSize: 11,
                                fontWeight: "700",
                                color: d.color,
                              }}
                            >
                              พร้อมทำออฟไลน์
                            </Text>
                          </View>
                        </View>
                        <Zap size={18} color={d.color} strokeWidth={2.5} />
                      </TouchableOpacity>
                    );
                  })}

                  {/* ระดับที่ยังไม่ได้โหลด */}
                  {DIFFICULTY_LABELS.filter(
                    (d) => !savedDifficulties.includes(d.key),
                  ).length > 0 && (
                    <>
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "700",
                          color: Palette.disabled,
                          marginTop: 4,
                        }}
                      >
                        ยังไม่มีข้อสอบ (ต้องออนไลน์เพื่อโหลด)
                      </Text>
                      {DIFFICULTY_LABELS.filter(
                        (d) => !savedDifficulties.includes(d.key),
                      ).map((d) => (
                        <View
                          key={d.key}
                          style={[
                            {
                              backgroundColor: "#F8FAFC",
                              borderRadius: 16,
                              padding: 18,
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 14,
                              borderWidth: 1,
                              borderColor: "#E2E8F0",
                            },
                          ]}
                        >
                          <View
                            style={{
                              width: 48,
                              height: 48,
                              borderRadius: 14,
                              backgroundColor: "#F1F5F9",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Text style={{ fontSize: 24, opacity: 0.3 }}>
                              {d.emoji}
                            </Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text
                              style={{
                                fontSize: 15,
                                fontWeight: "700",
                                color: Palette.disabled,
                              }}
                            >
                              ระดับ{d.label}
                            </Text>
                            <Text
                              style={{
                                fontSize: 11,
                                color: Palette.disabled,
                                marginTop: 2,
                              }}
                            >
                              ยังไม่มีข้อสอบบันทึกไว้
                            </Text>
                          </View>
                        </View>
                      ))}
                    </>
                  )}
                </>
              )}
            </>
          )}
        </ScrollView>
      </View>
    </>
  );
}
