import { Palette } from "@/constants/theme";
import React from "react";
import { Platform, Text, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";

interface DonutChartProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  gradientEnd?: string;
  backgroundColor?: string;
  label?: string;
}

const chartWrapperShadow = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  android: { elevation: 6 },
  default: {},
});

export function DonutChart({
  percentage,
  size = 130,
  strokeWidth = 16,
  color = Palette.primary,
  gradientEnd,
  backgroundColor = Palette.borderLight,
  label,
}: DonutChartProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const gradId = `grad-${label}`;

  return (
    <View className="items-center">
      <View
        className="bg-surface rounded-full p-1.5"
        style={chartWrapperShadow}
      >
        <View style={{ width: size, height: size, position: "relative" }}>
          <Svg width={size} height={size}>
            <Defs>
              <LinearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={color} />
                <Stop offset="1" stopColor={gradientEnd || color} />
              </LinearGradient>
            </Defs>
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={backgroundColor}
              strokeWidth={strokeWidth}
              fill="none"
            />
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={`url(#${gradId})`}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${circumference}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              rotation="-90"
              origin={`${size / 2}, ${size / 2}`}
            />
          </Svg>
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: size,
              height: size,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text className="text-[22px] font-extrabold text-brand-text">
              {percentage}%
            </Text>
          </View>
        </View>
      </View>
      {label && (
        <Text className="text-[13px] font-bold text-brand-secondary mt-3 tracking-wide uppercase">
          {label}
        </Text>
      )}
    </View>
  );
}
