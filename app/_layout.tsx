import { AppColors } from "@/constants/colors";
import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import "react-native-reanimated";
import "../global.css";

import { getJwt, saveJwt } from "@/lib/auth/token";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";
import { useRouter, useSegments } from "expo-router";
import LoadingScreen from "./loading";

const AppTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: AppColors.surfaceAlt,
    card: AppColors.surface,
    text: AppColors.text,
    border: AppColors.borderLight,
    primary: AppColors.primary,
  },
};

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Dev Mode: ใช้ JWT_TEST เพื่อ bypass login
    const initAuth = async () => {
      const devJwt = process.env.EXPO_PUBLIC_JWT_TEST;
      const useDevMode =
        process.env.EXPO_PUBLIC_ENV === "development" && devJwt;

      if (useDevMode) {
        // Dev Mode: ใช้ JWT_TEST
        const existingJwt = await getJwt();
        if (!existingJwt) {
          await saveJwt(devJwt);
          console.log("[DEV MODE] Using JWT_TEST from .env");
        } else {
          console.log("[DEV MODE] JWT already exists");
        }
        // ข้าม Supabase session check ใน dev mode
        setSession({ user: { id: "dev-user" } } as any);
        setIsLoading(false);
        return;
      }

      // Production Mode: ใช้ Supabase session ปกติ
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setIsLoading(false);
      });
    };

    initAuth();

    // Listen to auth changes (skip in dev mode)
    const useDevMode =
      process.env.EXPO_PUBLIC_ENV === "development" &&
      process.env.EXPO_PUBLIC_JWT_TEST;
    if (!useDevMode) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  // Auto-redirect based on session
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(tabs)";
    const currentRoute = segments[0];

    // หน้าที่อนุญาตให้เข้าได้เมื่อมี session (นอกเหนือจาก tabs)
    const allowedRoutes = ["video", "exam", "modal", "profile-edit"];
    const isAllowedRoute = allowedRoutes.includes(currentRoute);

    if (
      session &&
      !inAuthGroup &&
      !isAllowedRoute &&
      currentRoute !== "login" &&
      currentRoute !== "register"
    ) {
      // มี session แต่อยู่หน้าที่ไม่อนุญาต → redirect เข้า tabs
      router.replace("/(tabs)");
    } else if (!session && (inAuthGroup || isAllowedRoute)) {
      // ไม่มี session แต่พยายามเข้าหน้าที่ต้องการ auth → redirect ไป login
      router.replace("/login");
    }
  }, [session, segments, isLoading]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <ThemeProvider value={AppTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="subject/[id]" />
        <Stack.Screen name="lesson" />
        <Stack.Screen name="editlesson/[id]" />
        <Stack.Screen name="choosesubject/[id]" />
        <Stack.Screen name="video/[id]" />
        <Stack.Screen name="lessons/[id]" />
        <Stack.Screen name="player/[id]" />
        <Stack.Screen name="exam/[id]" />
        <Stack.Screen name="profile-edit" />
        <Stack.Screen name="modal" options={{ presentation: "modal" }} />
      </Stack>
      <StatusBar style="dark" />
    </ThemeProvider>
  );
}
