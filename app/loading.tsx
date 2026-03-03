import { Palette } from "@/constants/theme";
import { BookOpen } from "lucide-react-native";
import React, { useEffect, useRef } from "react";
import {
    Animated,
    Easing,
    Platform,
    StyleSheet,
    Text,
    View,
} from "react-native";
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
    <Animated.View style={[styles.dot, { transform: [{ translateY }] }]} />
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
    <View style={styles.container}>
      {/* Full-screen gradient */}
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <LinearGradient id="loadGrad" x1="0" y1="0" x2="0.5" y2="1">
            <Stop offset="0" stopColor={Palette.gradientStart} />
            <Stop offset="0.5" stopColor={Palette.gradientMid} />
            <Stop offset="1" stopColor={Palette.primaryDark} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#loadGrad)" />
      </Svg>

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Logo — pulse only, no spinner ring */}
        <Animated.View
          style={[styles.logoCircle, { transform: [{ scale: pulseAnim }] }]}
        >
          <BookOpen size={52} color={Palette.primary} strokeWidth={2} />
        </Animated.View>

        {/* App name */}
        <Text style={styles.appName}>SandboxEDU</Text>

        {/* Bouncing dots */}
        <View style={styles.dotsRow}>
          <Text style={styles.loadingText}>กำลังโหลด</Text>
          <View style={styles.dotsWrap}>
            <AnimatedDot delay={0} />
            <AnimatedDot delay={160} />
            <AnimatedDot delay={320} />
          </View>
        </View>

        {/* Progress bar
        <View style={styles.progressBarBg}>
          <View style={styles.progressBarFill} />
        </View> */}

        <Text style={styles.versionText}>v1.0.0</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logoCircle: {
    width: 110,
    height: 110,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.95)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 36,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
      },
      android: { elevation: 12 },
      default: {},
    }),
  },
  appName: {
    fontSize: 34,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 2,
    marginBottom: 20,
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 36,
    gap: 8,
  },
  loadingText: {
    fontSize: 16,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "500",
  },
  dotsWrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 5,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.85)",
  },
  progressBarBg: {
    width: 200,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
    overflow: "hidden",
  },
  progressBarFill: {
    width: "60%",
    height: "100%",
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.8)",
  },
  versionText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.4)",
    marginTop: 24,
  },
  backBtn: {
    position: "absolute",
    alignSelf: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.6)",
  },
});
