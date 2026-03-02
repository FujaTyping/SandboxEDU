import { Tabs } from "expo-router";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Palette } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();

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
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          height: 75,
          paddingBottom: 12,
          paddingTop: 8,
          paddingHorizontal: 16,
          backgroundColor: Palette.surface,
          borderTopWidth: 1,
          borderTopColor: Palette.borderLight,
          ...Platform.select({
            ios: {
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -8 },
              shadowOpacity: 0.12,
              shadowRadius: 16,
            },
            android: { elevation: 16 },
            default: {},
          }),
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
          marginTop: 4,
          letterSpacing: 0.2,
        },
        tabBarInactiveTintColor: Palette.textMuted,
        tabBarIconStyle: {
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "หน้าหลัก",
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[styles.iconWrapper, focused && styles.iconWrapperActive]}
            >
              <IconSymbol size={26} name="house.fill" color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "บทเรียน",
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[styles.iconWrapper, focused && styles.iconWrapperActive]}
            >
              <IconSymbol size={26} name="book.fill" color={color} />
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
              style={[styles.iconWrapper, focused && styles.iconWrapperActive]}
            >
              <IconSymbol size={26} name="gearshape.fill" color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  iconWrapperActive: {
    backgroundColor: Palette.primaryBg,
  },
});
