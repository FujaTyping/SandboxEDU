import { AppColors } from "@/constants/colors";
import { WifiOff } from "lucide-react-native";
import { Animated, Text, View } from "react-native";
import { useEffect, useRef } from "react";

export function OfflineBanner() {
  const translateY = useRef(new Animated.Value(-60)).current;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();
  }, []);

  return (
    <Animated.View
      style={{
        transform: [{ translateY }],
        backgroundColor: "#1E293B",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 10,
        paddingHorizontal: 16,
        gap: 8,
      }}
    >
      <WifiOff size={14} color="#94A3B8" strokeWidth={2.5} />
      <Text style={{ fontSize: 13, color: "#E2E8F0", fontWeight: "600" }}>
        You are in offline mode
      </Text>
      <View
        style={{
          backgroundColor: AppColors.primaryBg,
          borderRadius: 8,
          paddingHorizontal: 8,
          paddingVertical: 2,
          marginLeft: 4,
        }}
      >
        <Text style={{ fontSize: 11, color: AppColors.primary, fontWeight: "700" }}>
          เฉพาะคลิปที่ดาวน์โหลด
        </Text>
      </View>
    </Animated.View>
  );
}
