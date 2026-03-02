import { Palette } from "@/constants/theme";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import Svg, {
    Defs,
    LinearGradient,
    Rect,
    Stop,
    Line as SvgLine,
    Text as SvgText,
} from "react-native-svg";

interface BarChartProps {
  data: { day: string; hours: number }[];
  colorStart?: string;
  colorEnd?: string;
  maxHeight?: number;
}

export function BarChart({
  data,
  colorStart = Palette.barStart,
  colorEnd = Palette.barEnd,
  maxHeight = 160,
}: BarChartProps) {
  const maxValue = Math.max(...data.map((d) => d.hours), 1);
  const yStep = Math.ceil(maxValue / 5) || 1;
  const yLabels: number[] = [];
  for (let i = 0; i <= maxValue; i += yStep) yLabels.push(i);
  if (yLabels[yLabels.length - 1] < maxValue) yLabels.push(maxValue);

  const leftPad = 30;
  const bottomPad = 28;
  const barGap = 8;

  const chartW = data.length * 40 + leftPad;
  const chartH = maxHeight + bottomPad;

  return (
    <View style={styles.card}>
      <Svg width="100%" height={chartH} viewBox={`0 0 ${chartW} ${chartH}`}>
        <Defs>
          <LinearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colorStart} />
            <Stop offset="1" stopColor={colorEnd} />
          </LinearGradient>
        </Defs>

        {/* Grid lines */}
        {yLabels.map((val) => {
          const y = maxHeight - (val / maxValue) * maxHeight;
          return (
            <React.Fragment key={`g-${val}`}>
              <SvgLine
                x1={leftPad}
                y1={y}
                x2={chartW}
                y2={y}
                stroke={Palette.border}
                strokeWidth={1}
              />
              <SvgText
                x={leftPad - 6}
                y={y + 4}
                textAnchor="end"
                fontSize={10}
                fill={Palette.textMuted}
              >
                {val}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* Bars */}
        {data.map((item, index) => {
          const barH = (item.hours / maxValue) * maxHeight;
          const barW = 24;
          const x = leftPad + index * 40 + (40 - barW) / 2;
          const y = maxHeight - barH;
          return (
            <React.Fragment key={index}>
              <Rect
                x={x}
                y={y}
                width={barW}
                height={barH}
                rx={6}
                ry={6}
                fill="url(#barGrad)"
                opacity={0.85 + (item.hours / maxValue) * 0.15}
              />
              <SvgText
                x={x + barW / 2}
                y={maxHeight + 16}
                textAnchor="middle"
                fontSize={11}
                fill={Palette.textSecondary}
                fontWeight="500"
              >
                {item.day}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.surface,
    borderRadius: 16,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
      default: {},
    }),
  },
});
