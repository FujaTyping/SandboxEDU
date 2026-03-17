import { Tabs } from "expo-router";
import React from "react";
import { Platform, View } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { usePalette } from "@/hooks/use-palette";

export default function TabLayout() {
  const Palette = usePalette();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Palette.primary,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          height: 80,
          paddingBottom: 8,
          paddingTop: 6,
          paddingHorizontal: 8,
          backgroundColor: Palette.surface,
          borderTopWidth: 1,
          borderTopColor: Palette.border,
          ...Platform.select({
            ios: {
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.08,
              shadowRadius: 10,
            },
            android: { elevation: 12 },
            default: {},
          }),
        },
        tabBarItemStyle: {
          paddingVertical: 2,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
          marginTop: 2,
          letterSpacing: 0.2,
        },
        tabBarInactiveTintColor: Palette.textMuted,
        tabBarIconStyle: {
          marginBottom: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "หน้าหลัก",
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                width: 52,
                height: 36,
                borderRadius: 10,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: focused ? Palette.primaryBg : "transparent",
              }}
            >
              <IconSymbol size={30} name="house.fill" color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "สำรวจ",
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                width: 52,
                height: 36,
                borderRadius: 10,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: focused ? Palette.primaryBg : "transparent",
              }}
            >
              <IconSymbol size={30} name="book.fill" color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "ตั้งค่า",
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                width: 52,
                height: 36,
                borderRadius: 10,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: focused ? Palette.primaryBg : "transparent",
              }}
            >
              <IconSymbol size={30} name="gearshape.fill" color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
