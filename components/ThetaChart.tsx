import { Palette } from "@/constants/theme";
import { ThetaSubject } from "@/data/mockData";
import React, { useState } from "react";
import {
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Svg, {
    Circle,
    Defs,
    LinearGradient,
    Path,
    Rect,
    Stop,
    Line as SvgLine,
    Text as SvgText,
} from "react-native-svg";

interface ThetaChartProps {
  data: ThetaSubject[];
}

const THETA_MIN = -3;
const THETA_MAX = 3;
const THETA_RANGE = THETA_MAX - THETA_MIN;

const cardShadow = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
  },
  android: { elevation: 4 },
  default: {},
});

function thetaToPercent(theta: number) {
  return Math.max(0, Math.min(1, (theta - THETA_MIN) / THETA_RANGE));
}

function thetaLabel(theta: number) {
  if (theta >= 1.5) return { label: "เก่งมาก", color: "#10B981" };
  if (theta >= 0.5) return { label: "ดี", color: "#3B82F6" };
  if (theta >= -0.5) return { label: "ปานกลาง", color: "#F59E0B" };
  if (theta >= -1.5) return { label: "ควรพัฒนา", color: "#F97316" };
  return { label: "ต้องเร่งพัฒนา", color: "#EF4444" };
}

// Radar (spider) chart for one subject
function RadarChart({ subject }: { subject: ThetaSubject }) {
  const size = 180;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = 72;
  const n = subject.topics.length;
  const levels = [0.25, 0.5, 0.75, 1.0];

  const angleOf = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;

  const pointsToPath = (pts: { x: number; y: number }[]) =>
    pts
      .map(
        (p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`,
      )
      .join(" ") + " Z";

  const levelPath = (frac: number) => {
    const pts = Array.from({ length: n }, (_, i) => {
      const a = angleOf(i);
      return {
        x: cx + maxR * frac * Math.cos(a),
        y: cy + maxR * frac * Math.sin(a),
      };
    });
    return pointsToPath(pts);
  };

  const dataPoints = subject.topics.map((t, i) => {
    const frac = thetaToPercent(t.theta);
    const a = angleOf(i);
    return {
      x: cx + maxR * frac * Math.cos(a),
      y: cy + maxR * frac * Math.sin(a),
    };
  });

  const polyData = pointsToPath(dataPoints);

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Defs>
        <LinearGradient
          id={`radarFill-${subject.subjectId}`}
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <Stop offset="0" stopColor={subject.color} stopOpacity="0.45" />
          <Stop offset="1" stopColor={subject.color} stopOpacity="0.12" />
        </LinearGradient>
      </Defs>

      {/* Grid rings */}
      {levels.map((frac, li) => (
        <Path
          key={`ring-${li}`}
          d={levelPath(frac)}
          fill="none"
          stroke={frac === 1 ? Palette.border : Palette.borderLight}
          strokeWidth={frac === 1 ? 1.5 : 1}
        />
      ))}

      {/* Axis lines */}
      {subject.topics.map((_, i) => {
        const a = angleOf(i);
        return (
          <SvgLine
            key={`axis-${i}`}
            x1={cx}
            y1={cy}
            x2={cx + maxR * Math.cos(a)}
            y2={cy + maxR * Math.sin(a)}
            stroke={Palette.borderLight}
            strokeWidth={1}
          />
        );
      })}

      {/* Data polygon */}
      <Path
        d={polyData}
        fill={`url(#radarFill-${subject.subjectId})`}
        stroke={subject.color}
        strokeWidth={2}
        strokeLinejoin="round"
      />

      {/* Data points */}
      {dataPoints.map((p, i) => (
        <Circle
          key={`dot-${i}`}
          cx={p.x}
          cy={p.y}
          r={3.5}
          fill={subject.color}
          stroke="white"
          strokeWidth={1.5}
        />
      ))}

      {/* Zero ring marker */}
      <Circle
        cx={cx}
        cy={cy}
        r={maxR * thetaToPercent(0)}
        fill="none"
        stroke={Palette.textMuted}
        strokeWidth={1}
        strokeDasharray="3,3"
      />

      {/* Topic labels */}
      {subject.topics.map((t, i) => {
        const a = angleOf(i);
        const labelR = maxR + 14;
        const lx = cx + labelR * Math.cos(a);
        const ly = cy + labelR * Math.sin(a);
        const anchor =
          Math.abs(Math.cos(a)) < 0.1
            ? "middle"
            : Math.cos(a) < 0
              ? "end"
              : "start";
        return (
          <SvgText
            key={`lbl-${i}`}
            x={lx}
            y={ly + 4}
            textAnchor={anchor}
            fontSize={9}
            fill={Palette.textSecondary}
            fontWeight="500"
          >
            {t.topic}
          </SvgText>
        );
      })}
    </Svg>
  );
}

// Horizontal bar for one topic
function ThetaBar({
  topic,
  theta,
  color,
  index,
}: {
  topic: string;
  theta: number;
  color: string;
  index: number;
}) {
  const pct = thetaToPercent(theta);
  const zeroX = thetaToPercent(0); // 50%
  const { label, color: labelColor } = thetaLabel(theta);

  const BAR_H = 10;
  const W = 200;
  const zeroXpx = W * zeroX;
  const barX = theta >= 0 ? zeroXpx : W * pct;
  const barW = Math.abs(W * pct - zeroXpx);

  return (
    <View style={{ marginBottom: 12 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 4,
        }}
      >
        <Text style={{ fontSize: 12, fontWeight: "600", color: Palette.text }}>
          {topic}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={{ fontSize: 11, fontWeight: "700", color: labelColor }}>
            {label}
          </Text>
          <Text style={{ fontSize: 11, color: Palette.textMuted }}>
            θ = {theta.toFixed(1)}
          </Text>
        </View>
      </View>
      <View style={{ position: "relative" }}>
        <Svg width="100%" height={BAR_H + 2} viewBox={`0 0 ${W} ${BAR_H + 2}`}>
          <Defs>
            <LinearGradient id={`barGrad-${index}`} x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={color} stopOpacity="0.6" />
              <Stop offset="1" stopColor={color} />
            </LinearGradient>
          </Defs>
          {/* Track */}
          <Rect
            x={0}
            y={1}
            width={W}
            height={BAR_H}
            rx={5}
            fill={Palette.borderLight}
          />
          {/* Bar */}
          <Rect
            x={barX}
            y={1}
            width={Math.max(barW, 4)}
            height={BAR_H}
            rx={5}
            fill={`url(#barGrad-${index})`}
          />
          {/* Zero line */}
          <SvgLine
            x1={zeroXpx}
            y1={0}
            x2={zeroXpx}
            y2={BAR_H + 2}
            stroke={Palette.textMuted}
            strokeWidth={1.5}
            strokeDasharray="2,2"
          />
        </Svg>
        {/* Scale labels */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: 2,
          }}
        >
          {["-3", "-1.5", "0", "+1.5", "+3"].map((v) => (
            <Text key={v} style={{ fontSize: 9, color: Palette.textMuted }}>
              {v}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

export function ThetaChart({ data }: ThetaChartProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const active = data[activeIdx];

  // Rank topics for this subject
  const sorted = [...active.topics].sort((a, b) => b.theta - a.theta);
  const strongest = sorted.slice(0, 2);
  const weakest = sorted.slice(-2).reverse();

  return (
    <View style={{ gap: 12 }}>
      {/* Subject tab selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingHorizontal: 2 }}
      >
        {data.map((s, i) => (
          <TouchableOpacity
            key={s.subjectId}
            onPress={() => setActiveIdx(i)}
            activeOpacity={0.8}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 7,
              borderRadius: 20,
              backgroundColor: i === activeIdx ? s.color : Palette.borderLight,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "700",
                color: i === activeIdx ? "white" : Palette.textSecondary,
              }}
            >
              {s.subject}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Main card */}
      <View
        style={{
          backgroundColor: Palette.surface,
          borderRadius: 20,
          padding: 16,
          ...cardShadow,
        }}
      >
        {/* Radar + summary side-by-side */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <RadarChart subject={active} />
          <View style={{ flex: 1, paddingLeft: 8, gap: 8 }}>
            {/* Title */}
            <Text
              style={{ fontSize: 14, fontWeight: "800", color: Palette.text }}
            >
              {active.subject}
            </Text>
            <Text
              style={{ fontSize: 11, color: Palette.textMuted, lineHeight: 16 }}
            >
              ระดับความสามารถ (θ) รายหัวข้อ ค่ายิ่งสูงยิ่งเก่ง (–3 ถึง +3)
            </Text>

            {/* Strength / Weakness cards */}
            <View
              style={{
                backgroundColor: "#F0FDF4",
                borderRadius: 10,
                padding: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "700",
                  color: "#10B981",
                  marginBottom: 4,
                }}
              >
                💪 จุดแข็ง
              </Text>
              {strongest.map((t) => (
                <Text
                  key={t.topic}
                  style={{ fontSize: 11, color: Palette.text }}
                >
                  · {t.topic}{" "}
                  <Text style={{ color: "#10B981", fontWeight: "700" }}>
                    θ {t.theta.toFixed(1)}
                  </Text>
                </Text>
              ))}
            </View>

            <View
              style={{
                backgroundColor: "#FFF7ED",
                borderRadius: 10,
                padding: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "700",
                  color: "#F97316",
                  marginBottom: 4,
                }}
              >
                📌 ควรพัฒนา
              </Text>
              {weakest.map((t) => (
                <Text
                  key={t.topic}
                  style={{ fontSize: 11, color: Palette.text }}
                >
                  · {t.topic}{" "}
                  <Text style={{ color: "#F97316", fontWeight: "700" }}>
                    θ {t.theta.toFixed(1)}
                  </Text>
                </Text>
              ))}
            </View>
          </View>
        </View>

        {/* Divider */}
        <View
          style={{
            height: 1,
            backgroundColor: Palette.borderLight,
            marginBottom: 14,
          }}
        />

        {/* Horizontal bar per topic */}
        <Text
          style={{
            fontSize: 12,
            fontWeight: "700",
            color: Palette.textSecondary,
            marginBottom: 10,
          }}
        >
          รายละเอียดรายหัวข้อ
        </Text>
        {active.topics.map((t, i) => (
          <ThetaBar
            key={t.topic}
            topic={t.topic}
            theta={t.theta}
            color={active.color}
            index={i}
          />
        ))}

        {/* Legend */}
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
            marginTop: 4,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: Palette.borderLight,
          }}
        >
          {[
            { label: "เก่งมาก", color: "#10B981", range: "θ ≥ 1.5" },
            { label: "ดี", color: "#3B82F6", range: "0.5–1.5" },
            { label: "ปานกลาง", color: "#F59E0B", range: "–0.5–0.5" },
            { label: "ควรพัฒนา", color: "#F97316", range: "–1.5–(–0.5)" },
            { label: "ต้องเร่งพัฒนา", color: "#EF4444", range: "θ < –1.5" },
          ].map((l) => (
            <View
              key={l.label}
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: l.color,
                }}
              />
              <Text style={{ fontSize: 10, color: Palette.textMuted }}>
                {l.label} ({l.range})
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
