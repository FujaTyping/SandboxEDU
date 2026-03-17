import { OfflineBanner } from "@/components/OfflineBanner";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { usePalette } from "@/hooks/use-palette";
import { getJwtWithRefresh } from "@/lib/auth/jwtRefresh";
import { getJwt } from "@/lib/auth/token";
import { getUserCache, saveUserCache } from "@/lib/cache/userCache";
import { getQuizHistory, QuizRecord } from "@/lib/progress/quizHistory";
import { calculateStreak, StreakResult } from "@/lib/progress/streak";
import { getAllVideoProgress } from "@/lib/progress/videoProgress";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import {
  BookOpen,
  ChevronRight,
  GraduationCap,
  Pencil,
  RefreshCw,
} from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, {
  Circle,
  Defs,
  Line,
  LinearGradient,
  Path,
  Polygon,
  Polyline,
  Rect,
  Stop,
  Text as SvgText,
} from "react-native-svg";

const DEFAULT_AVATAR = "https://i.pravatar.cc/512";

const RADAR_LEVELS = 4;

function polarToXY(angleDeg: number, r: number, cx: number, cy: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function RadarChart({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data).slice(0, 7);
  const n = entries.length;
  const [size, setSize] = useState(0);

  const computed = useMemo(() => {
    if (n < 3 || size === 0) return null;
    const cx = size / 2;
    const cy = size / 2;
    // label padding: เผื่อพื้นที่รอบนอกสำหรับ label
    const labelPad = 52;
    const r = size / 2 - labelPad;
    const angleStep = 360 / n;
    const primaryColor = "#2A6EDF";
    const fillColor = "#2A6EDF40";

    // normalize ตาม maxScore จริง ทำให้กราฟใหญ่สุดเสมอ
    const rawScores = entries.map(([, s]) => Number(s));
    const maxScore = Math.max(...rawScores, 1); // ป้องกัน max = 0

    const gridPolygons = Array.from({ length: RADAR_LEVELS }, (_, li) => {
      const gr = (r * (li + 1)) / RADAR_LEVELS;
      return entries
        .map((_, i) => {
          const { x, y } = polarToXY(i * angleStep, gr, cx, cy);
          return `${x},${y}`;
        })
        .join(" ");
    });

    const axes = entries.map((_, i) => polarToXY(i * angleStep, r, cx, cy));

    const dataPoints = entries.map(([, score], i) => {
      const raw = Math.max(0, Number(score));
      const pct = raw / maxScore; // normalize ตาม max จริง
      const { x, y } = polarToXY(i * angleStep, r * pct, cx, cy);
      return { x, y, pct, label: entries[i][0], score: raw, maxScore };
    });
    const dataPolygonPts = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

    return {
      cx,
      cy,
      r,
      angleStep,
      primaryColor,
      fillColor,
      gridPolygons,
      axes,
      dataPoints,
      dataPolygonPts,
    };
  }, [n, size, entries]);

  if (n < 3) return null;

  return (
    <View
      style={{ alignItems: "center" }}
      onLayout={(e) => setSize(e.nativeEvent.layout.width)}
    >
      {computed && (
        <Svg width={size} height={size}>
          {/* Grid rings */}
          {computed.gridPolygons.map((pts, li) => (
            <Polygon
              key={`grid-${li}`}
              points={pts}
              fill="none"
              stroke="#E2E8F0"
              strokeWidth={1}
            />
          ))}

          {/* Axis lines */}
          {computed.axes.map((end, i) => (
            <Line
              key={`axis-${i}`}
              x1={computed.cx}
              y1={computed.cy}
              x2={end.x}
              y2={end.y}
              stroke="#E2E8F0"
              strokeWidth={1}
            />
          ))}

          {/* Data filled polygon */}
          <Polygon
            points={computed.dataPolygonPts}
            fill={computed.fillColor}
            stroke={computed.primaryColor}
            strokeWidth={2}
            strokeLinejoin="round"
          />

          {/* Data dots */}
          {computed.dataPoints.map((p, i) => (
            <Circle
              key={`dot-${i}`}
              cx={p.x}
              cy={p.y}
              r={4}
              fill={computed.primaryColor}
              stroke="#fff"
              strokeWidth={1.5}
            />
          ))}

          {/* Labels */}
          {computed.dataPoints.map((p, i) => {
            const labelPos = polarToXY(
              i * computed.angleStep,
              computed.r + 28,
              computed.cx,
              computed.cy,
            );
            // ใช้ pct (0-1) normalize เพื่อ threshold สี
            const scoreColor =
              p.pct >= 0.7 ? "#22C55E" : p.pct >= 0.4 ? "#F59E0B" : "#EF4444";
            const chars = [...p.label];
            const line1 =
              chars.length > 5 ? chars.slice(0, 5).join("") : p.label;
            const line2raw = chars.length > 5 ? chars.slice(5).join("") : "";
            const line2 =
              line2raw.length > 4 ? line2raw.slice(0, 4) + "…" : line2raw;
            const hasLine2 = line2.length > 0;
            return (
              <React.Fragment key={`label-${i}`}>
                <SvgText
                  x={labelPos.x}
                  y={hasLine2 ? labelPos.y - 11 : labelPos.y - 4}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="700"
                  fill="#1E293B"
                >
                  {line1}
                </SvgText>
                {hasLine2 && (
                  <SvgText
                    x={labelPos.x}
                    y={labelPos.y + 1}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="700"
                    fill="#1E293B"
                  >
                    {line2}
                  </SvgText>
                )}
                <SvgText
                  x={labelPos.x}
                  y={hasLine2 ? labelPos.y + 13 : labelPos.y + 9}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="800"
                  fill={scoreColor}
                >
                  {Math.round(p.score)}
                </SvgText>
              </React.Fragment>
            );
          })}
        </Svg>
      )}

      {/* Legend */}
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 6,
          marginTop: 4,
        }}
      >
        {entries.map(([subject, score]) => {
          const rawScoresLegend = entries.map(([, s]) => Number(s));
          const maxScoreLegend = Math.max(...rawScoresLegend, 1);
          const pct = Number(score) / maxScoreLegend;
          const color =
            pct >= 0.7 ? "#22C55E" : pct >= 0.4 ? "#F59E0B" : "#EF4444";
          return (
            <View
              key={subject}
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: color,
                }}
              />
              <Text
                style={{ fontSize: 11, color: "#64748B", fontWeight: "600" }}
              >
                {subject}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

interface ApiUser {
  name?: string;
  surname?: string;
  displayName?: string;
  avatarURL?: string;
  class?: number;
  room?: number;
}

const SCREEN_W = Dimensions.get("window").width;
const CHART_W = SCREEN_W - 64;
const CHART_H = 150;

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "อรุณสวัสดิ์ 🌅";
  if (h < 17) return "สวัสดีตอนบ่าย ☀️";
  if (h < 20) return "สวัสดีตอนเย็น 🌆";
  return "สวัสดีตอนค่ำ 🌙";
}

function DonutRing({
  pct,
  color,
  track,
  size = 96,
  stroke = 9,
  label,
  sublabel,
}: {
  pct: number;
  color: string;
  track: string;
  size?: number;
  stroke?: number;
  label: string;
  sublabel: string;
}) {
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  const dash = Math.min((pct / 100) * circ, circ);
  return (
    <View style={{ alignItems: "center", gap: 6 }}>
      <Svg width={size} height={size}>
        <Circle
          cx={cx}
          cy={cy}
          r={r}
          stroke={track}
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={cx}
          cy={cy}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          rotation="-90"
          origin={`${cx},${cy}`}
        />
        <SvgText
          x={cx}
          y={cy - 5}
          textAnchor="middle"
          fontSize="15"
          fontWeight="800"
          fill={color}
        >
          {Math.round(pct)}%
        </SvgText>
        <SvgText
          x={cx}
          y={cy + 11}
          textAnchor="middle"
          fontSize="8"
          fill="#94A3B8"
        >
          {sublabel}
        </SvgText>
      </Svg>
      <Text
        style={{
          fontSize: 11,
          fontWeight: "700",
          color: "#334155",
          textAlign: "center",
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function ScoreLineChart({
  records,
  color,
}: {
  records: QuizRecord[];
  color: string;
}) {
  if (records.length === 0) {
    return (
      <View
        style={{
          height: CHART_H,
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        <Text style={{ fontSize: 28 }}>📊</Text>
        <Text style={{ color: "#94A3B8", fontSize: 13, textAlign: "center" }}>
          {"ยังไม่มีประวัติการสอบ\nลองทำแบบทดสอบดูสิ!"}
        </Text>
      </View>
    );
  }
  if (records.length === 1) {
    return (
      <View
        style={{
          height: CHART_H,
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
        }}
      >
        <Text style={{ fontSize: 32, fontWeight: "900", color }}>
          {records[0].score}%
        </Text>
        <Text style={{ color: "#94A3B8", fontSize: 12 }}>
          ผลล่าสุด — ทำต่อเพื่อดูกราฟพัฒนาการ
        </Text>
      </View>
    );
  }
  const scores = records.map((r) => r.score);
  const minS = Math.max(0, Math.min(...scores) - 15);
  const maxS = Math.min(100, Math.max(...scores) + 15);
  const range = maxS - minS || 1;
  const pad = 14;
  const pts = records.map((r, i) => ({
    x: pad + (i / (records.length - 1)) * (CHART_W - pad * 2),
    y: CHART_H - pad - ((r.score - minS) / range) * (CHART_H - pad * 2),
    score: r.score,
  }));
  const polyPoints = pts.map((p) => `${p.x},${p.y}`).join(" ");
  const areaD =
    `M${pts[0].x},${CHART_H - pad} ` +
    pts.map((p) => `L${p.x},${p.y}`).join(" ") +
    ` L${pts[pts.length - 1].x},${CHART_H - pad} Z`;
  return (
    <Svg width={CHART_W} height={CHART_H}>
      <Defs>
        <LinearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity="0.28" />
          <Stop offset="1" stopColor={color} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      {[0, 25, 50, 75, 100].map((v) => {
        const y = CHART_H - pad - ((v - minS) / range) * (CHART_H - pad * 2);
        if (y < pad || y > CHART_H - pad) return null;
        return (
          <Line
            key={v}
            x1={pad}
            y1={y}
            x2={CHART_W - pad}
            y2={y}
            stroke="#E2E8F0"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        );
      })}
      <Path d={areaD} fill="url(#lg)" />
      <Polyline
        points={polyPoints}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {pts.map((p, i) => (
        <Circle
          key={i}
          cx={p.x}
          cy={p.y}
          r="5"
          fill="#fff"
          stroke={color}
          strokeWidth="2.5"
        />
      ))}
      {pts.map((p, i) => (
        <SvgText
          key={`s${i}`}
          x={p.x}
          y={p.y - 10}
          textAnchor="middle"
          fontSize="9"
          fill={color}
          fontWeight="800"
        >
          {p.score}
        </SvgText>
      ))}
    </Svg>
  );
}

export default function HomeScreen() {
  const Palette = usePalette();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isOnline } = useNetworkStatus();
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [avgProgress, setAvgProgress] = useState(0);
  const [quizHistory, setQuizHistory] = useState<QuizRecord[]>([]);
  const [streak, setStreak] = useState<StreakResult>({
    current: 0,
    watchedToday: false,
  });
  const [skills, setSkills] = useState<Record<string, number> | null>(null);
  const [skillsLoading, setSkillsLoading] = useState(false);

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      // ลอง load cache ก่อนเสมอเพื่อแสดงผลทันที
      const cached = await getUserCache();
      if (cached) setUser(cached);

      if (!isOnline) {
        setLoading(false);
        return;
      }

      const token = await getJwt();
      if (!token) {
        setLoading(false);
        return;
      }
      const apiBase = process.env.EXPO_PUBLIC_API_BASE_URL;
      const res = await fetch(`${apiBase}/users/get`, {
        headers: { authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        await saveUserCache(data);
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [isOnline]);

  const fetchSkills = useCallback(async () => {
    if (!isOnline) return;
    try {
      setSkillsLoading(true);
      const token = await getJwtWithRefresh();
      if (!token) return;

      // อ่าน quiz history ทั้งหมด
      const allHistory = await getQuizHistory();

      // อ่าน enrolled course IDs จาก AsyncStorage
      const allKeys = await AsyncStorage.getAllKeys();
      const enrolledKeys = allKeys.filter((k) => k.startsWith("@enrolled_"));
      const enrolledEntries = await AsyncStorage.multiGet(enrolledKeys);
      const enrolledCourseIds = new Set(
        enrolledEntries
          .filter(([, v]) => v === "1")
          .map(([k]) => k.replace("@enrolled_", "")),
      );

      // กรอง quiz history เฉพาะ course ที่ enrolled
      const enrolledHistory = allHistory.filter((r) =>
        enrolledCourseIds.has(r.courseId),
      );

      // สร้าง body: ส่งข้อมูลผลสอบจาก enrolled courses
      const quizResults = enrolledHistory.map((r) => ({
        courseId: r.courseId,
        courseTitle: r.subject ?? r.courseTitle,
        score: r.score,
        correct: r.correct,
        wrong: r.wrong,
        total: r.total,
        timestamp: r.timestamp,
      }));

      const apiBase = process.env.EXPO_PUBLIC_API_BASE_URL;
      const res = await fetch(`${apiBase}/analyze/skills`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ quizResults }),
      });
      if (res.ok) {
        const data = await res.json();
        // API returns { skills: [{skillName, skillPoint}], description, improve, reportTitle }
        if (Array.isArray(data?.skills)) {
          const mapped: Record<string, number> = {};
          for (const s of data.skills as {
            skillName: string;
            skillPoint: number;
          }[]) {
            mapped[s.skillName] = s.skillPoint;
          }
          setSkills(mapped);
        } else if (typeof data === "object" && !Array.isArray(data)) {
          // fallback: ถ้า API ส่งมาเป็น Record<string,number> โดยตรง
          setSkills(data as Record<string, number>);
        }
        console.log("[Skills]", data);
      } else {
        const err = await res.json().catch(() => ({}));
        console.warn("[Skills] API error:", res.status, err);
        Alert.alert(
          "วิเคราะห์ทักษะไม่สำเร็จ",
          (err as any)?.message ?? `เกิดข้อผิดพลาด (HTTP ${res.status})`,
        );
      }
    } catch {
      /* silent */
    } finally {
      setSkillsLoading(false);
    }
  }, [isOnline]);

  const fetchStats = useCallback(async () => {
    try {
      const allProgress = await getAllVideoProgress();
      const allKeys = await AsyncStorage.getAllKeys();
      const enrolledIds = new Set(
        (
          await AsyncStorage.multiGet(
            allKeys.filter((k) => k.startsWith("@enrolled_")),
          )
        )
          .filter(([, v]) => v === "1")
          .map(([k]) => k.replace("@enrolled_", "")),
      );
      const progressById: Record<string, number> = {};
      for (const p of Object.values(allProgress)) {
        progressById[p.courseId] = p.percentage;
      }
      const total = enrolledIds.size;
      const sum = Array.from(enrolledIds).reduce(
        (acc, id) => acc + (progressById[id] ?? 0),
        0,
      );
      const avg = total > 0 ? sum / total : 0;
      setAvgProgress(Math.min(100, avg));
    } catch {
      /* silent */
    }
    try {
      const history = await getQuizHistory();
      setQuizHistory(history);
    } catch {
      /* silent */
    }
    try {
      const s = await calculateStreak();
      setStreak(s);
    } catch {
      /* silent */
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchUser();
      fetchStats();
    }, [fetchUser, fetchStats]),
  );

  const displayName = user?.displayName ?? user?.name ?? "ผู้ใช้";
  const gradeText = user?.class ? `ม.${user.class}` : "";
  const roomText = user?.room ? `ห้อง ${user.room}` : "";
  const avgQuizScore =
    quizHistory.length > 0
      ? Math.round(
          quizHistory.reduce((a, r) => a + r.score, 0) / quizHistory.length,
        )
      : 0;

  const sh = Platform.select({
    ios: {
      shadowColor: Palette.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 14,
    },
    android: { elevation: 5 },
    default: {},
  });
  const shSm = Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
    },
    android: { elevation: 2 },
    default: {},
  });

  return (
    <View style={{ flex: 1, backgroundColor: Palette.surfaceAlt }}>
      {!isOnline && <OfflineBanner insetTop={insets.top} />}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 80 + insets.bottom + 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero Header ── */}
        <View style={{ overflow: "hidden" }}>
          <Svg
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
            width="100%"
            height="100%"
          >
            <Defs>
              <LinearGradient id="hero" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={Palette.gradientStart} />
                <Stop offset="0.6" stopColor={Palette.gradientMid} />
                <Stop offset="1" stopColor={Palette.gradientEnd} />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#hero)" />
          </Svg>

          <View
            style={{
              paddingTop: insets.top + 16,
              paddingHorizontal: 20,
              paddingBottom: 32,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <View
                style={{
                  backgroundColor: "rgba(255,255,255,0.15)",
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 16,
                }}
              >
                <Text
                  style={{
                    fontSize: 15,
                    color: "rgba(255,255,255,0.95)",
                    fontWeight: "600",
                  }}
                >
                  {getGreeting()}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  fetchUser();
                  fetchStats();
                }}
                style={{
                  padding: 8,
                  borderRadius: 20,
                  backgroundColor: "rgba(255,255,255,0.15)",
                }}
                activeOpacity={0.7}
              >
                <RefreshCw size={14} color="#fff" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 14 }}
            >
              <View style={{ position: "relative" }}>
                <View
                  style={{
                    width: 88,
                    height: 88,
                    borderRadius: 44,
                    borderWidth: 3,
                    borderColor: "rgba(255,255,255,0.9)",
                    backgroundColor: Palette.primaryBg,
                    overflow: "hidden",
                  }}
                >
                  {loading ? (
                    <View
                      style={{
                        flex: 1,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <ActivityIndicator color={Palette.primary} size="small" />
                    </View>
                  ) : (
                    <Image
                      source={{ uri: user?.avatarURL || DEFAULT_AVATAR }}
                      style={{ width: 88, height: 88 }}
                      contentFit="cover"
                    />
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => router.push("/profile-edit")}
                  activeOpacity={0.8}
                  style={{
                    position: "absolute",
                    bottom: -4,
                    right: -4,
                    width: 28,
                    height: 28,
                    borderRadius: 18,
                    backgroundColor: "rgba(0,0,0,0.4)",
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 3,
                    borderColor: "rgba(255,255,255,0.8)",
                  }}
                >
                  <Pencil size={16} color="#fff" strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 21,
                    fontWeight: "900",
                    color: "#fff",
                    letterSpacing: 0.2,
                  }}
                  numberOfLines={1}
                >
                  {loading ? "..." : displayName}
                </Text>
                {gradeText || roomText ? (
                  <View
                    style={{
                      flexDirection: "row",
                      gap: 8,
                      marginTop: 5,
                      flexWrap: "wrap",
                    }}
                  >
                    {gradeText ? (
                      <View
                        style={{
                          backgroundColor: "rgba(255,255,255,0.2)",
                          borderRadius: 20,
                          paddingHorizontal: 10,
                          paddingVertical: 3,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            color: "#fff",
                            fontWeight: "700",
                          }}
                        >
                          📚 {gradeText}
                        </Text>
                      </View>
                    ) : null}
                    {roomText ? (
                      <View
                        style={{
                          backgroundColor: "rgba(255,255,255,0.2)",
                          borderRadius: 20,
                          paddingHorizontal: 10,
                          paddingVertical: 3,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            color: "#fff",
                            fontWeight: "700",
                          }}
                        >
                          🏫 {roomText}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                ) : null}
              </View>
            </View>


          </View>
        </View>

        {/* ── Stats Card ── */}
        <View style={{ paddingHorizontal: 16, marginTop: -18 }}>
          <View
            style={[
              sh,
              {
                backgroundColor: Palette.surface,
                borderRadius: 24,
                padding: 20,
                flexDirection: "row",
                justifyContent: "space-around",
                alignItems: "center",
              },
            ]}
          >
            <DonutRing
              pct={avgProgress}
              color={Palette.primary}
              track={Palette.primaryBg}
              label="คอร์สที่เรียน"
              sublabel="ความคืบหน้า"
            />
            <View
              style={{
                width: 1,
                backgroundColor: Palette.borderLight,
                height: 80,
              }}
            />
            <DonutRing
              pct={avgQuizScore}
              color={Palette.accent}
              track={Palette.accentLight}
              label="คะแนนเฉลี่ย"
              sublabel={`${quizHistory.length} ครั้ง`}
            />
            <View
              style={{
                width: 1,
                backgroundColor: Palette.borderLight,
                height: 80,
              }}
            />
            <View style={{ alignItems: "center", gap: 6 }}>
              <View
                style={{
                  width: 96,
                  height: 96,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 48,
                  backgroundColor:
                    streak.current > 0
                      ? streak.watchedToday
                        ? "#FF8C0018"
                        : "#FF8C0010"
                      : "#F1F5F9",
                }}
              >
                <Text style={{ fontSize: 26 }}>
                  {streak.current === 0
                    ? "❄️"
                    : streak.watchedToday
                      ? "🔥"
                      : "🔥"}
                </Text>
                <Text
                  style={{
                    fontSize: 22,
                    fontWeight: "900",
                    color: streak.current > 0 ? "#FF8C00" : "#94A3B8",
                  }}
                >
                  {streak.current}
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: streak.current > 0 ? "#FF8C00" : "#94A3B8",
                  textAlign: "center",
                }}
              >
                {streak.current === 0
                  ? "เริ่ม streak!"
                  : streak.watchedToday
                    ? `${streak.current} วันติดต่อกัน`
                    : `${streak.current} วัน (ดูวันนี้ด้วย!)`}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Score Chart ── */}
        <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <View>
              <Text
                style={{ fontSize: 16, fontWeight: "800", color: Palette.text }}
              >
                พัฒนาการคะแนน
              </Text>
              <Text
                style={{ fontSize: 12, color: Palette.textMuted, marginTop: 2 }}
              >
                {quizHistory.length > 0
                  ? `${quizHistory.length} ครั้ง · ล่าสุด ${new Date(quizHistory[quizHistory.length - 1].timestamp).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}`
                  : "เริ่มทำแบบทดสอบเพื่อดูกราฟ"}
              </Text>
            </View>
            {quizHistory.length > 0 && (
              <View
                style={{
                  backgroundColor: Palette.primaryBg,
                  borderRadius: 12,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "800",
                    color: Palette.primary,
                  }}
                >
                  {quizHistory[quizHistory.length - 1].score}% ล่าสุด
                </Text>
              </View>
            )}
          </View>
          <View
            style={[
              shSm,
              {
                backgroundColor: Palette.surface,
                borderRadius: 20,
                padding: 16,
                paddingBottom: 10,
              },
            ]}
          >
            <ScoreLineChart records={quizHistory} color={Palette.primary} />
          </View>
        </View>

        {/* ── Skills Section ── */}
        {isOnline && (
          <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <GraduationCap
                  size={16}
                  color={Palette.primary}
                  strokeWidth={2.5}
                />
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "800",
                    color: Palette.text,
                  }}
                >
                  ทักษะของฉัน
                </Text>
              </View>
              {skills && Object.keys(skills).length > 0 && (
                <TouchableOpacity
                  onPress={fetchSkills}
                  activeOpacity={0.7}
                  style={{ padding: 4 }}
                  disabled={skillsLoading}
                >
                  <RefreshCw
                    size={14}
                    color={
                      skillsLoading ? Palette.borderLight : Palette.textMuted
                    }
                    strokeWidth={2}
                  />
                </TouchableOpacity>
              )}
            </View>

            <View
              style={[
                shSm,
                {
                  backgroundColor: Palette.surface,
                  borderRadius: 20,
                  padding: 16,
                },
              ]}
            >
              {skillsLoading ? (
                <View style={{ alignItems: "center", paddingVertical: 24 }}>
                  <ActivityIndicator size="small" color={Palette.primary} />
                  <Text
                    style={{
                      fontSize: 12,
                      color: Palette.textMuted,
                      marginTop: 8,
                    }}
                  >
                    กำลังวิเคราะห์ทักษะ...
                  </Text>
                </View>
              ) : skills && Object.keys(skills).length > 0 ? (
                <RadarChart data={skills} />
              ) : (
                <View style={{ alignItems: "center", paddingVertical: 20 }}>
                  <Text style={{ fontSize: 28, marginBottom: 8 }}>🎯</Text>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "700",
                      color: Palette.text,
                      marginBottom: 4,
                    }}
                  >
                    วิเคราะห์ทักษะของคุณ
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: Palette.textMuted,
                      textAlign: "center",
                      marginBottom: 16,
                    }}
                  >
                    กดปุ่มด้านล่างเพื่อให้ระบบวิเคราะห์จุดแข็ง-จุดอ่อนจากประวัติการทำแบบทดสอบ
                  </Text>
                  <TouchableOpacity
                    onPress={fetchSkills}
                    style={{
                      backgroundColor: Palette.primary,
                      paddingHorizontal: 24,
                      paddingVertical: 11,
                      borderRadius: 14,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                    activeOpacity={0.82}
                  >
                    <GraduationCap size={15} color="#fff" strokeWidth={2.5} />
                    <Text
                      style={{ color: "#fff", fontSize: 13, fontWeight: "700" }}
                    >
                      วิเคราะห์ทักษะ
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}

        {/* ── Quick Actions ── */}
        <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "800",
              color: Palette.text,
              marginBottom: 12,
            }}
          >
            เริ่มเรียน
          </Text>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/explore",
                  params: { initialTab: "courses" },
                } as any)
              }
              activeOpacity={0.82}
              style={[
                sh,
                {
                  flex: 1,
                  backgroundColor: Palette.primary,
                  borderRadius: 20,
                  padding: 18,
                  gap: 10,
                },
              ]}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: "rgba(255,255,255,0.2)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <BookOpen size={22} color="#fff" strokeWidth={2} />
              </View>
              <View>
                <Text
                  style={{ fontSize: 15, fontWeight: "800", color: "#fff" }}
                >
                  บทเรียน
                </Text>
                <Text
                  style={{
                    fontSize: 11,
                    color: "rgba(255,255,255,0.75)",
                    marginTop: 2,
                  }}
                >
                  สำรวจคอร์สทั้งหมด
                </Text>
              </View>
              <View style={{ alignSelf: "flex-end" }}>
                <ChevronRight
                  size={16}
                  color="rgba(255,255,255,0.5)"
                  strokeWidth={2.5}
                />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/explore",
                  params: { initialTab: "quiz" },
                } as any)
              }
              activeOpacity={0.82}
              style={[
                shSm,
                {
                  flex: 1,
                  backgroundColor: Palette.surface,
                  borderRadius: 20,
                  padding: 18,
                  gap: 10,
                  borderWidth: 1.5,
                  borderColor: Palette.borderLight,
                },
              ]}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: Palette.examLight,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <GraduationCap size={22} color={Palette.exam} strokeWidth={2} />
              </View>
              <View>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "800",
                    color: Palette.text,
                  }}
                >
                  แบบทดสอบ
                </Text>
                <Text
                  style={{
                    fontSize: 11,
                    color: Palette.textMuted,
                    marginTop: 2,
                  }}
                >
                  วัดความรู้ตัวเอง
                </Text>
              </View>
              <View style={{ alignSelf: "flex-end" }}>
                <ChevronRight
                  size={16}
                  color={Palette.disabled}
                  strokeWidth={2.5}
                />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
