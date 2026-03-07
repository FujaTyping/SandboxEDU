import { Palette } from "@/constants/theme";
import { getJwt } from "@/lib/auth/token";
import { Image } from "expo-image";
import { BookOpen, ClipboardList, RefreshCw, User } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

interface ApiUser {
  name?: string;
  surname?: string;
  displayName?: string;
  avatarURL?: string;
  sclass?: number;
  room?: number;
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getJwt();
      if (!token) {
        setLoading(false);
        return;
      }
      const apiBase = process.env.EXPO_PUBLIC_API_BASE_URL;
      const res = await fetch(`${apiBase}/users/get`, {
        headers: { authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const displayName = user?.displayName ?? user?.name ?? "ผู้ใช้";
  const gradeText = user?.sclass ? `ม.${user.sclass}` : null;
  const roomText = user?.room ? `ห้อง ${user.room}` : null;

  return (
    <ScrollView
      className="flex-1 bg-surface-alt"
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Gradient header */}
      <View
        className="overflow-hidden rounded-b-4xl min-h-[260px]"
        style={{ paddingTop: insets.top }}
      >
        <Svg
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          width="100%"
          height="100%"
          preserveAspectRatio="none"
        >
          <Defs>
            <LinearGradient id="hg" x1="0" y1="0" x2="0.3" y2="1">
              <Stop offset="0" stopColor={Palette.gradientStart} />
              <Stop offset="0.5" stopColor={Palette.gradientMid} />
              <Stop offset="1" stopColor={Palette.gradientEnd} />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#hg)" />
        </Svg>

        <View className="items-center py-7">
          {/* Avatar */}
          <View className="w-[110px] h-[110px] rounded-full border-[3px] border-white/35 justify-center items-center">
            <View className="w-24 h-24 rounded-full bg-white/15 border-[3px] border-white overflow-hidden justify-center items-center">
              {user?.avatarURL ? (
                <Image
                  source={{ uri: user.avatarURL }}
                  style={{ width: 96, height: 96 }}
                  contentFit="cover"
                />
              ) : (
                <User
                  size={44}
                  color="rgba(255,255,255,0.9)"
                  strokeWidth={1.5}
                />
              )}
            </View>
          </View>

          {loading ? (
            <ActivityIndicator color="white" style={{ marginTop: 16 }} />
          ) : (
            <>
              <Text className="mt-3.5 text-[26px] font-extrabold text-white tracking-wide">
                {displayName}
              </Text>
              {(gradeText || roomText) && (
                <View
                  className="flex-row items-center mt-3 bg-white/15 rounded-2xl px-6 py-2"
                  style={{ gap: 0 }}
                >
                  {gradeText && (
                    <View className="items-center px-3">
                      <Text className="text-lg font-bold text-white">
                        {gradeText}
                      </Text>
                      <Text className="text-[11px] text-white/70 mt-0.5">
                        ชั้นเรียน
                      </Text>
                    </View>
                  )}
                  {gradeText && roomText && (
                    <View className="w-px h-7 bg-white/30" />
                  )}
                  {roomText && (
                    <View className="items-center px-3">
                      <Text className="text-lg font-bold text-white">
                        {roomText}
                      </Text>
                      <Text className="text-[11px] text-white/70 mt-0.5">
                        ห้องเรียน
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </>
          )}

          {/* Refresh */}
          <TouchableOpacity
            onPress={fetchUser}
            className="mt-3 p-2 rounded-full bg-white/10"
            activeOpacity={0.7}
          >
            <RefreshCw
              size={14}
              color="rgba(255,255,255,0.7)"
              strokeWidth={2}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick actions */}
      <View className="px-5 mt-6">
        <Text className="text-[17px] font-bold text-brand-text mb-4">
          เริ่มต้นเรียน
        </Text>
        <View className="flex-row" style={{ gap: 12 }}>
          <View
            className="flex-1 rounded-2xl p-5 items-center"
            style={{ backgroundColor: Palette.primary + "12" }}
          >
            <View
              className="w-12 h-12 rounded-2xl items-center justify-center mb-3"
              style={{ backgroundColor: Palette.primary + "20" }}
            >
              <BookOpen size={24} color={Palette.primary} strokeWidth={2} />
            </View>
            <Text className="text-sm font-bold text-brand-text text-center">
              บทเรียน
            </Text>
            <Text className="text-xs text-brand-muted text-center mt-1">
              ดูคอร์สทั้งหมด
            </Text>
          </View>
          <View
            className="flex-1 rounded-2xl p-5 items-center"
            style={{ backgroundColor: "#8B5CF610" }}
          >
            <View
              className="w-12 h-12 rounded-2xl items-center justify-center mb-3"
              style={{ backgroundColor: "#8B5CF620" }}
            >
              <ClipboardList size={24} color="#8B5CF6" strokeWidth={2} />
            </View>
            <Text className="text-sm font-bold text-brand-text text-center">
              แบบทดสอบ
            </Text>
            <Text className="text-xs text-brand-muted text-center mt-1">
              ทดสอบความรู้
            </Text>
          </View>
        </View>
      </View>

      {/* User info card */}
      {user && !loading && (
        <View className="px-5 mt-6">
          <Text className="text-[17px] font-bold text-brand-text mb-4">
            ข้อมูลของฉัน
          </Text>
          <View
            className="bg-surface rounded-2xl p-5"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
            }}
          >
            {[
              {
                label: "ชื่อ-สกุล",
                value:
                  [user.name, user.surname].filter(Boolean).join(" ") || "-",
              },
              { label: "ชื่อที่แสดง", value: user.displayName || "-" },
              { label: "ชั้นเรียน", value: gradeText || "-" },
              { label: "ห้อง", value: roomText || "-" },
            ].map((row, i, arr) => (
              <View key={row.label}>
                <View className="flex-row justify-between py-3">
                  <Text className="text-sm text-brand-muted">{row.label}</Text>
                  <Text className="text-sm font-semibold text-brand-text">
                    {row.value}
                  </Text>
                </View>
                {i < arr.length - 1 && <View className="h-px bg-edge-light" />}
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}
