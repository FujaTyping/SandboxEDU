import { Palette } from "@/constants/theme";
import { getJwt } from "@/lib/auth/token";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
  BookOpen,
  ChevronRight,
  GraduationCap,
  Pencil,
  RefreshCw,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

const DEFAULT_AVATAR = "https://i.pravatar.cc/512";

interface ApiUser {
  name?: string;
  surname?: string;
  displayName?: string;
  avatarURL?: string;
  sclass?: number;
  room?: number;
}

const cardShadow = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
  },
  android: { elevation: 3 },
  default: {},
});

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "อรุณสวัสดิ์ 🌅";
  if (h < 17) return "สวัสดีตอนบ่าย ☀️";
  if (h < 20) return "สวัสดีตอนเย็น 🌆";
  return "สวัสดีตอนค่ำ 🌙";
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
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
      if (res.ok) setUser(await res.json());
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
  const fullName =
    [user?.name, user?.surname].filter(Boolean).join(" ") || null;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#F8FAFC" }}
      contentContainerStyle={{ paddingBottom: 48 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Twitter-style Profile Header ── */}
      {/* Banner */}
      <View style={{ height: 120 + insets.top, overflow: "hidden" }}>
        <Svg
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          width="100%"
          height="100%"
          preserveAspectRatio="none"
        >
          <Defs>
            <LinearGradient id="hg" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={Palette.gradientStart} />
              <Stop offset="0.5" stopColor={Palette.gradientMid} />
              <Stop offset="1" stopColor={Palette.gradientEnd} />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#hg)" />
        </Svg>
        {/* Refresh button top-right */}
        <TouchableOpacity
          onPress={fetchUser}
          style={{
            position: "absolute",
            top: insets.top + 10,
            right: 16,
            padding: 8,
            borderRadius: 20,
            backgroundColor: "rgba(0,0,0,0.25)",
          }}
          activeOpacity={0.7}
        >
          <RefreshCw size={14} color="#fff" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* Profile row — avatar overlaps banner, name below */}
      <View style={{ backgroundColor: "#fff", paddingBottom: 16 }}>
        {/* Avatar — positioned to overlap banner by half */}
        <View style={{ paddingHorizontal: 16, marginTop: -44 }}>
          <View
            style={{
              width: 95,
              height: 95,
              borderRadius: 44,
              borderWidth: 4,
              borderColor: "#fff",
              backgroundColor: "#E2E8F0",
              overflow: "hidden",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Image
              source={{ uri: user?.avatarURL || DEFAULT_AVATAR }}
              style={{ width: 88, height: 88 }}
              contentFit="cover"
            />
          </View>
        </View>

        {/* Name + info */}
        <View style={{ paddingHorizontal: 16, marginTop: 10 }}>
          {loading ? (
            <ActivityIndicator color={Palette.primary} />
          ) : (
            <>
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "900",
                  color: "#0F172A",
                  letterSpacing: 0.2,
                }}
                numberOfLines={1}
              >
                {displayName}
              </Text>
              {fullName && fullName !== displayName && (
                <Text style={{ fontSize: 14, color: "#64748B", marginTop: 2 }}>
                  {fullName}
                </Text>
              )}
              {(gradeText || roomText) && (
                <View style={{ flexDirection: "row", gap: 12, marginTop: 6 }}>
                  {gradeText && (
                    <Text style={{ fontSize: 13, color: "#64748B" }}>
                      📚 {gradeText}
                    </Text>
                  )}
                  {roomText && (
                    <Text style={{ fontSize: 13, color: "#64748B" }}>
                      🏫 {roomText}
                    </Text>
                  )}
                </View>
              )}
              <Text style={{ fontSize: 12, color: "#94A3B8", marginTop: 6 }}>
                {getGreeting()}
              </Text>
            </>
          )}
        </View>

        {/* Edit Profile Button */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingBottom: 16,
            backgroundColor: "#fff",
          }}
        >
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/settings")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              alignSelf: "flex-start",
              backgroundColor: Palette.primary + "12",
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 7,
            }}
            activeOpacity={0.75}
          >
            <Pencil size={13} color={Palette.primary} strokeWidth={2.5} />
            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
                color: Palette.primary,
              }}
            >
              แก้ไขโปรไฟล์
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Separator */}
      <View style={{ height: 8, backgroundColor: "#F1F5F9" }} />

      {/* ── Quick Actions ── */}
      <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
        <Text
          style={{
            fontSize: 15,
            fontWeight: "800",
            color: "#111",
            marginBottom: 12,
          }}
        >
          เมนูหลัก
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/explore")}
          activeOpacity={0.82}
          style={[
            cardShadow,
            {
              backgroundColor: "#fff",
              borderRadius: 18,
              padding: 18,
              flexDirection: "row",
              alignItems: "center",
              gap: 16,
              marginBottom: 12,
            },
          ]}
        >
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              backgroundColor: Palette.primary + "15",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <BookOpen size={24} color={Palette.primary} strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: "800", color: "#111" }}>
              บทเรียน
            </Text>
            <Text style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>
              สำรวจคอร์สและวิดีโอทั้งหมด
            </Text>
          </View>
          <ChevronRight size={18} color="#CBD5E1" strokeWidth={2} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/(tabs)/explore")}
          activeOpacity={0.82}
          style={[
            cardShadow,
            {
              backgroundColor: "#fff",
              borderRadius: 18,
              padding: 18,
              flexDirection: "row",
              alignItems: "center",
              gap: 16,
            },
          ]}
        >
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              backgroundColor: "#8B5CF615",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <GraduationCap size={24} color="#8B5CF6" strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: "800", color: "#111" }}>
              แบบทดสอบ
            </Text>
            <Text style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>
              ทดสอบความรู้จากบทเรียน
            </Text>
          </View>
          <ChevronRight size={18} color="#CBD5E1" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* ── User info card ── */}
      {user && !loading && (
        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <Text
            style={{
              fontSize: 15,
              fontWeight: "800",
              color: "#111",
              marginBottom: 12,
            }}
          >
            ข้อมูลของฉัน
          </Text>
          <View
            style={[
              cardShadow,
              { backgroundColor: "#fff", borderRadius: 18, overflow: "hidden" },
            ]}
          >
            {[
              { icon: "👤", label: "ชื่อ-สกุล", value: fullName || "-" },
              {
                icon: "✏️",
                label: "ชื่อที่แสดง",
                value: user.displayName || "-",
              },
              { icon: "📚", label: "ชั้นเรียน", value: gradeText || "-" },
              { icon: "🏫", label: "ห้อง", value: roomText || "-" },
            ].map((row, i, arr) => (
              <View key={row.label}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 18,
                    paddingVertical: 14,
                    gap: 12,
                  }}
                >
                  <Text style={{ fontSize: 18, width: 28 }}>{row.icon}</Text>
                  <Text style={{ flex: 1, fontSize: 14, color: "#64748B" }}>
                    {row.label}
                  </Text>
                  <Text
                    style={{ fontSize: 14, fontWeight: "700", color: "#111" }}
                  >
                    {row.value}
                  </Text>
                </View>
                {i < arr.length - 1 && (
                  <View
                    style={{
                      height: 1,
                      backgroundColor: "#F1F5F9",
                      marginHorizontal: 18,
                    }}
                  />
                )}
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}
