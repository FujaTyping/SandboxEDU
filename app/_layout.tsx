import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import "react-native-reanimated";
import "../global.css";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { initDatabase } from "@/lib/database";
import { seedMockData } from "@/lib/db/seedData";
import LoadingScreen from "./loading";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [isShowSplash, setIsShowSplash] = useState(true);

  useEffect(() => {
    initDatabase()
      .then(() => seedMockData())
      .catch(console.error);
    const timer = setTimeout(() => {
      setIsShowSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  if (isShowSplash) {
    return <LoadingScreen />;
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="subject/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="lesson" options={{ headerShown: false }} />
        <Stack.Screen name="editlesson/[id]" options={{ headerShown: false }} />
        <Stack.Screen
          name="choosesubject/[id]"
          options={{ headerShown: false }}
        />
        <Stack.Screen name="video/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="lessons/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="player/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="exam/[id]" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
