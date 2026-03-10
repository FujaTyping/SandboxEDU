import { OfflineBanner } from "@/components/OfflineBanner";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { usePalette } from "@/hooks/use-palette";
import { getJwtWithRefresh } from "@/lib/auth/jwtRefresh";
import { getJwt } from "@/lib/auth/token";
import { getUserCache, saveUserCache } from "@/lib/cache/userCache";
import { getQuizHistory, QuizRecord } from "@/lib/progress/quizHistory";
import { getAllVideoProgress } from "@/lib/progress/videoProgress";
import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import {
    BookOpen,
    ChevronRight,
    GraduationCap,
    Pencil,
    RefreshCw,
} from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
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

const RADAR_SIZE = 300;
const RADAR_CX = RADAR_SIZE / 2;
const RADAR_CY = RADAR_SIZE / 2;
const RADAR_R = 86;
const RADAR_LEVELS = 4;

function polarToXY(angleDeg: number, r: number, cx: number, cy: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function RadarChart({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data).slice(0, 7);
  const n = entries.length;
  if (n < 3) return null;

  const angleStep = 360 / n;
  const primaryColor = "#38BDF8";
  const fillColor = "#38BDF840";

  // grid polygons
  const gridPolygons = Array.from({ length: RADAR_LEVELS }, (_, li) => {
    const r = (RADAR_R * (li + 1)) / RADAR_LEVELS;
    const pts = entries.map((_, i) => {
      const { x, y } = polarToXY(i * angleStep, r, RADAR_CX, RADAR_CY);
      return `${x},${y}`;
    });
    return pts.join(" ");
  });

  // axis lines
  const axes = entries.map((_, i) => {
    const end = polarToXY(i * angleStep, RADAR_R, RADAR_CX, RADAR_CY);
    return end;
  });

  // data polygon
  const dataPoints = entries.map(([, score], i) => {
    const pct = Math.min(100, Math.max(0, Number(score))) / 100;
    const { x, y } = polarToXY(
      i * angleStep,
      RADAR_R * pct,
      RADAR_CX,
      RADAR_CY,
    );
    return { x, y, pct, label: entries[i][0], score: Number(entries[i][1]) };
  });
  const dataPolygonPts = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <View style={{ alignItems: "center" }}>
      <Svg width={RADAR_SIZE} height={RADAR_SIZE}>
        {/* Grid rings */}
        {gridPolygons.map((pts, li) => (
          <Polygon
            key={`grid-${li}`}
            points={pts}
            fill="none"
            stroke="#E2E8F0"
            strokeWidth={1}
          />
        ))}

        {/* Axis lines */}
        {axes.map((end, i) => (
          <Line
            key={`axis-${i}`}
            x1={RADAR_CX}
            y1={RADAR_CY}
            x2={end.x}
            y2={end.y}
            stroke="#E2E8F0"
            strokeWidth={1}
          />
        ))}

        {/* Data filled polygon */}
        <Polygon
          points={dataPolygonPts}
          fill={fillColor}
          stroke={primaryColor}
          strokeWidth={2}
          strokeLinejoin="round"
        />

        {/* Data dots */}
        {dataPoints.map((p, i) => (
          <Circle
            key={`dot-${i}`}
            cx={p.x}
            cy={p.y}
            r={4}
            fill={primaryColor}
            stroke="#fff"
            strokeWidth={1.5}
          />
        ))}

        {/* Labels */}
        {dataPoints.map((p, i) => {
          const labelPos = polarToXY(
            i * angleStep,
            RADAR_R + 28,
            RADAR_CX,
            RADAR_CY,
          );
          const scoreColor =
            p.score >= 70 ? "#22C55E" : p.score >= 40 ? "#F59E0B" : "#EF4444";
          const chars = [...p.label];
          const line1 = chars.length > 5 ? chars.slice(0, 5).join("") : p.label;
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
                {Math.round(p.score)}%
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>

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
          const pct = Number(score);
          const color =
            pct >= 70 ? "#22C55E" : pct >= 40 ? "#F59E0B" : "#EF4444";
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
  sclass?: number;
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
      const apiBase = process.env.EXPO_PUBLIC_API_BASE_URL;
      const res = await fetch(`${apiBase}/analyze/skills`, {
        method: "POST",
        headers: { authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSkills(data);
        console.log("[Skills]", data);
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
      const values = Object.values(allProgress).map((p) => p.percentage);
      const avg =
        values.length > 0
          ? values.reduce((a, b) => a + b, 0) / values.length
          : 0;
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
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchUser();
      fetchStats();
      fetchSkills();
    }, [fetchUser, fetchStats, fetchSkills]),
  );

  const displayName = user?.displayName ?? user?.name ?? "ผู้ใช้";
  const gradeText = user?.sclass ? `ม.${user.sclass}` : "";
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
      {!isOnline && <OfflineBanner />}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 56 }}
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
              <Text
                style={{
                  fontSize: 13,
                  color: "rgba(255,255,255,0.8)",
                  fontWeight: "600",
                }}
              >
                {getGreeting()}
              </Text>
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
              <View
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: 34,
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
                    style={{ width: 68, height: 68 }}
                    contentFit="cover"
                  />
                )}
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

            <TouchableOpacity
              onPress={() => router.push("/profile-edit")}
              style={{
                marginTop: 16,
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                alignSelf: "flex-start",
                backgroundColor: "rgba(255,255,255,0.18)",
                borderRadius: 20,
                paddingHorizontal: 14,
                paddingVertical: 7,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.35)",
              }}
              activeOpacity={0.75}
            >
              <Pencil size={12} color="#fff" strokeWidth={2.5} />
              <Text style={{ fontSize: 12, fontWeight: "700", color: "#fff" }}>
                แก้ไขโปรไฟล์
              </Text>
            </TouchableOpacity>
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
              sublabel="progress"
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
                }}
              >
                <Text style={{ fontSize: 26 }}>🔥</Text>
                <Text
                  style={{
                    fontSize: 22,
                    fontWeight: "900",
                    color: Palette.accent,
                  }}
                >
                  {quizHistory.length}
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: "#334155",
                  textAlign: "center",
                }}
              >
                ครั้งที่สอบ
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
              <TouchableOpacity
                onPress={fetchSkills}
                activeOpacity={0.7}
                style={{ padding: 4 }}
              >
                <RefreshCw
                  size={14}
                  color={Palette.textMuted}
                  strokeWidth={2}
                />
              </TouchableOpacity>
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
                  <Text style={{ fontSize: 28, marginBottom: 8 }}>📊</Text>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "700",
                      color: Palette.text,
                      marginBottom: 4,
                    }}
                  >
                    ยังไม่มีข้อมูลทักษะ
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: Palette.textMuted,
                      textAlign: "center",
                      marginBottom: 14,
                    }}
                  >
                    ทำแบบทดสอบเพื่อให้ระบบวิเคราะห์จุดแข็ง-จุดอ่อนของคุณ
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.push("/(tabs)/explore" as any)}
                    style={{
                      backgroundColor: Palette.primary,
                      paddingHorizontal: 20,
                      paddingVertical: 10,
                      borderRadius: 12,
                    }}
                    activeOpacity={0.82}
                  >
                    <Text
                      style={{ color: "#fff", fontSize: 13, fontWeight: "700" }}
                    >
                      เริ่มทำแบบทดสอบ
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
              onPress={() => router.push("/(tabs)/explore")}
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
              onPress={() => router.push("/(tabs)/explore")}
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
