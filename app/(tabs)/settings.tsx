import { usePalette } from "@/hooks/use-palette";
import { getJwtWithRefresh } from "@/lib/auth/jwtRefresh";
import { clearJwt } from "@/lib/auth/token";
import { getUserCache, saveUserCache } from "@/lib/cache/userCache";
import { supabase } from "@/lib/supabase";
import {
    getLastSyncTime as fetchLastSyncTime,
    performFullSync,
} from "@/lib/sync/syncManager";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
    ChevronRight,
    CloudUpload,
    LogOut,
    Pencil,
    RefreshCw,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const DEFAULT_AVATAR = "https://i.pravatar.cc/512";

interface ApiUser {
  name?: string;
  surname?: string;
  displayName?: string;
  avatarURL?: string;
  sclass?: number;
  room?: number;
}

export default function SettingsScreen() {
  const Palette = usePalette();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncTime, setSyncTime] = useState<number | null>(null);

  const fetchUser = useCallback(async () => {
    try {
      setLoadingUser(true);
      const cached = await getUserCache();
      if (cached) setUser(cached);
      const token = await getJwtWithRefresh();
      if (!token) {
        setLoadingUser(false);
        return;
      }
      const apiBase = process.env.EXPO_PUBLIC_API_BASE_URL;
      const res = await fetch(`${apiBase}/users/get`, {
        headers: { authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        await saveUserCache(data);
      }
    } catch {
      /* silent */
    } finally {
      setLoadingUser(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
    fetchLastSyncTime().then(setSyncTime);
  }, [fetchUser]);

  const handleSync = useCallback(async () => {
    setSyncing(true);
    try {
      const result = await performFullSync();
      setSyncTime(result.syncedAt);
      const lines: string[] = ["ซิงค์ข้อมูลสำเร็จ ✅"];
      lines.push(`📹 ความคืบหน้าวิดีโอ: ซิงค์แล้ว`);
      lines.push(`📝 ประวัติแบบทดสอบ: ซิงค์แล้ว`);
      if (result.mergedVideoCount > 0)
        lines.push(
          `⬇️ นำเข้าความคืบหน้าวิดีโอใหม่ ${result.mergedVideoCount} รายการ`,
        );
      if (result.mergedQuizCount > 0)
        lines.push(
          `⬇️ นำเข้าประวัติแบบทดสอบใหม่ ${result.mergedQuizCount} รายการ`,
        );
      Alert.alert("ซิงค์ข้อมูล", lines.join("\n"));
    } catch (e) {
      Alert.alert(
        "ซิงค์ไม่สำเร็จ",
        e instanceof Error ? e.message : "ลองใหม่อีกครั้ง",
      );
    } finally {
      setSyncing(false);
    }
  }, []);

  const formatSyncTime = (ts: number | null): string => {
    if (!ts) return "ยังไม่เคย sync";
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "เมื่อกี้";
    if (diffMin < 60) return `${diffMin} นาทีที่แล้ว`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} ชั่วโมงที่แล้ว`;
    return d.toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const avatarUrl = user?.avatarURL || DEFAULT_AVATAR;
  const displayName = user?.displayName ?? user?.name ?? "ผู้ใช้";
  const gradeText = user?.sclass ? `ม.${user.sclass}` : null;
  const roomText = user?.room ? `ห้อง ${user.room}` : null;

  const shadow = Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.07,
      shadowRadius: 8,
    },
    android: { elevation: 3 },
    default: {},
  });

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Palette.surfaceAlt }}
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingBottom: 80 + insets.bottom + 16,
      }}
      showsVerticalScrollIndicator={false}
    >
      <Text
        style={{
          fontSize: 28,
          fontWeight: "900",
          color: Palette.text,
          paddingHorizontal: 20,
          marginBottom: 20,
        }}
      >
        ตั้งค่า
      </Text>

      {/* ── Profile Card ── */}
      <View
        style={[
          shadow,
          {
            marginHorizontal: 20,
            backgroundColor: Palette.surface,
            borderRadius: 20,
            padding: 20,
            flexDirection: "row",
            alignItems: "center",
            gap: 16,
            marginBottom: 16,
          },
        ]}
      >
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: Palette.borderLight,
            overflow: "hidden",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {loadingUser ? (
            <ActivityIndicator color={Palette.primary} />
          ) : (
            <Image
              source={{ uri: avatarUrl }}
              style={{ width: 64, height: 64 }}
              contentFit="cover"
            />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{ fontSize: 18, fontWeight: "800", color: Palette.text }}
          >
            {loadingUser ? "กำลังโหลด..." : displayName}
          </Text>
          <Text
            style={{ fontSize: 13, color: Palette.textSecondary, marginTop: 2 }}
          >
            {[gradeText, roomText].filter(Boolean).join(" · ") || "ไม่มีข้อมูล"}
          </Text>
        </View>
      </View>

      {/* ── Menu Items ── */}
      <View
        style={[
          shadow,
          {
            marginHorizontal: 20,
            backgroundColor: Palette.surface,
            borderRadius: 20,
            overflow: "hidden",
            marginBottom: 24,
          },
        ]}
      >
        {/* Edit Profile */}
        <TouchableOpacity
          onPress={() => router.push("/profile-edit")}
          activeOpacity={0.7}
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 18,
            paddingVertical: 16,
            gap: 14,
          }}
        >
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              backgroundColor: Palette.primary + "15",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Pencil size={18} color={Palette.primary} strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{ fontSize: 15, fontWeight: "600", color: Palette.text }}
            >
              แก้ไขโปรไฟล์
            </Text>
            <Text
              style={{ fontSize: 12, color: Palette.textMuted, marginTop: 1 }}
            >
              ชื่อ, รูปโปรไฟล์, ระดับชั้น
            </Text>
          </View>
          <ChevronRight size={16} color={Palette.disabled} strokeWidth={2} />
        </TouchableOpacity>

        <View
          style={{
            height: 1,
            backgroundColor: Palette.borderLight,
            marginHorizontal: 18,
          }}
        />

        {/* Sync */}
        <TouchableOpacity
          onPress={handleSync}
          activeOpacity={0.7}
          disabled={syncing}
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 18,
            paddingVertical: 16,
            gap: 14,
            opacity: syncing ? 0.6 : 1,
          }}
        >
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              backgroundColor: "#E8F5E9",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {syncing ? (
              <ActivityIndicator size="small" color="#2E7D32" />
            ) : (
              <CloudUpload size={18} color="#2E7D32" strokeWidth={2} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{ fontSize: 15, fontWeight: "600", color: Palette.text }}
            >
              ซิงค์ข้อมูล
            </Text>
            <Text
              style={{ fontSize: 12, color: Palette.textMuted, marginTop: 1 }}
            >
              {syncing
                ? "กำลังซิงค์..."
                : `ซิงค์ล่าสุด: ${formatSyncTime(lastSyncTime)}`}
            </Text>
          </View>
          <ChevronRight size={16} color={Palette.disabled} strokeWidth={2} />
        </TouchableOpacity>

        <View
          style={{
            height: 1,
            backgroundColor: Palette.borderLight,
            marginHorizontal: 18,
          }}
        />

        {/* Refresh */}
        <TouchableOpacity
          onPress={fetchUser}
          activeOpacity={0.7}
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 18,
            paddingVertical: 16,
            gap: 14,
          }}
        >
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              backgroundColor: Palette.infoLight,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <RefreshCw size={18} color={Palette.info} strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{ fontSize: 15, fontWeight: "600", color: Palette.text }}
            >
              รีเฟรชข้อมูล
            </Text>
            <Text
              style={{ fontSize: 12, color: Palette.textMuted, marginTop: 1 }}
            >
              โหลดข้อมูลโปรไฟล์ใหม่
            </Text>
          </View>
          <ChevronRight size={16} color={Palette.disabled} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* ── Logout ── */}
      <TouchableOpacity
        style={{
          marginHorizontal: 20,
          backgroundColor: Palette.dangerLight,
          borderRadius: 20,
          paddingVertical: 16,
          alignItems: "center",
          flexDirection: "row",
          justifyContent: "center",
          gap: 8,
          borderWidth: 1,
          borderColor: Palette.dangerBorder,
        }}
        activeOpacity={0.8}
        onPress={() =>
          Alert.alert("ออกจากระบบ", "ต้องการออกจากระบบหรือไม่?", [
            { text: "ยกเลิก", style: "cancel" },
            {
              text: "ออกจากระบบ",
              style: "destructive",
              onPress: async () => {
                await clearJwt();
                await supabase.auth.signOut();
                router.replace("/login");
              },
            },
          ])
        }
      >
        <LogOut size={18} color={Palette.danger} strokeWidth={2} />
        <Text
          style={{ fontSize: 16, fontWeight: "700", color: Palette.danger }}
        >
          ออกจากระบบ
        </Text>
      </TouchableOpacity>

      <Text
        style={{
          textAlign: "center",
          fontSize: 12,
          color: Palette.textMuted,
          marginTop: 24,
        }}
      >
        SandboxEDU v1.0.0
      </Text>
    </ScrollView>
  );
}
