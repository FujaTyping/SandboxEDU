import { Palette } from "@/constants/theme";
import { Image } from "expo-image";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, Text, View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

function AnimatedDot({ delay }: { delay: number }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, {
          toValue: 1,
          duration: 400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.delay(Math.max(0, 900 - delay)),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  return (
    <Animated.View
      style={{
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: "rgba(255,255,255,0.85)",
        transform: [{ translateY }],
      }}
    />
  );
}

export default function LoadingScreen() {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  return (
    <View className="flex-1">
      {/* Full-screen gradient */}
      <Svg
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        width="100%"
        height="100%"
      >
        <Defs>
          <LinearGradient id="loadGrad" x1="0" y1="0" x2="0.5" y2="1">
            <Stop offset="0" stopColor={Palette.gradientStart} />
            <Stop offset="0.5" stopColor={Palette.gradientMid} />
            <Stop offset="1" stopColor={Palette.primaryDark} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#loadGrad)" />
      </Svg>

      <Animated.View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          opacity: fadeAnim,
        }}
      >
        {/* Logo — pulse only */}
        <Animated.View
          style={{
            width: 110,
            height: 110,
            borderRadius: 32,
            backgroundColor: "rgba(255,255,255,0.95)",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 36,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.2,
            shadowRadius: 20,
            elevation: 12,
            transform: [{ scale: pulseAnim }],
          }}
        >
          <Image
            source={require("../assets/images/sanboxedu.png")}
            style={{ width: 80, height: 80 }}
            contentFit="contain"
          />
        </Animated.View>

        {/* App name */}
        <Text className="text-[34px] font-black text-white tracking-widest mb-5">
          SandboxEDU
        </Text>

        {/* Bouncing dots */}
        <View className="flex-row items-center mb-9 gap-2">
          <Text className="text-base text-white/70 font-medium">กำลังโหลด</Text>
          <View className="flex-row items-end gap-[5px]">
            <AnimatedDot delay={0} />
            <AnimatedDot delay={160} />
            <AnimatedDot delay={320} />
          </View>
        </View>

        <Text className="text-xs text-white/40 mt-6">v1.0.0</Text>
      </Animated.View>
    </View>
  );
}
