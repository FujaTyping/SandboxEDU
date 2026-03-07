import { Palette } from "@/constants/theme";
import { clearJwt, getJwt } from "@/lib/auth/token";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { RefreshCw, User } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ApiUser {
  name?: string;
  surname?: string;
  displayName?: string;
  sclass?: number;
  room?: number;
}

const MENU_ITEMS = [
  {
    icon: RefreshCw,
    label: "ซิงค์ความคืบหน้า",
    desc: "อัพเดทข้อมูลล่าสุด",
    key: "sync",
  },
];

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<ApiUser | null>(null);

  const fetchUser = useCallback(async () => {
    try {
      const token = await getJwt();
      if (!token) return;
      const apiBase = process.env.EXPO_PUBLIC_API_BASE_URL;
      const res = await fetch(`${apiBase}/users/get`, {
        headers: { authorization: `Bearer ${token}` },
      });
      if (res.ok) setUser(await res.json());
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <ScrollView
      className="flex-1 bg-surface-alt"
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      <Text className="text-[28px] font-extrabold text-brand-text px-6 mb-5">
        ตั้งค่า
      </Text>

      {/* Profile card */}
      <TouchableOpacity
        className="flex-row items-center bg-surface mx-5 rounded-2xl p-[18px] shadow-sm"
        activeOpacity={0.8}
        onPress={fetchUser}
      >
        <View className="w-14 h-14 rounded-[18px] bg-primary-bg justify-center items-center mr-3.5">
          <User size={28} color={Palette.primary} strokeWidth={2} />
        </View>
        <View className="flex-1">
          <Text className="text-xl font-bold text-brand-text">
            {user?.displayName ?? user?.name ?? "ผู้ใช้"}
          </Text>
          <Text className="text-[13px] text-brand-muted mt-0.5">
            {user?.sclass ? `ม.${user.sclass}` : ""}
            {user?.sclass && user?.room ? " · " : ""}
            {user?.room ? `ห้อง ${user.room}` : ""}
            {!user?.sclass && !user?.room ? "กดปุ่มเพื่อโหลดข้อมูล" : ""}
          </Text>
        </View>
        <Text className="text-[28px] text-brand-disabled font-light">›</Text>
      </TouchableOpacity>

      {/* Menu section */}
      <Text className="text-[13px] font-bold text-brand-muted px-7 mt-7 mb-2.5 uppercase tracking-wider">
        ทั่วไป
      </Text>
      <View className="bg-surface mx-5 rounded-2xl overflow-hidden shadow-sm">
        {MENU_ITEMS.map((item, index) => (
          <React.Fragment key={item.key}>
            {index > 0 && <View className="h-px bg-edge-light ml-[74px]" />}
            <TouchableOpacity
              className="flex-row items-center py-4 px-[18px]"
              activeOpacity={0.7}
              onPress={() => {
                Alert.alert(item.label);
              }}
            >
              <View className="w-[42px] h-[42px] rounded-xl bg-edge-light justify-center items-center mr-3.5">
                <item.icon size={20} color={Palette.primary} strokeWidth={2} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-brand-text">
                  {item.label}
                </Text>
                <Text className="text-xs text-brand-muted mt-0.5">
                  {item.desc}
                </Text>
              </View>
              <Text className="text-[22px] text-brand-disabled font-light">
                ›
              </Text>
            </TouchableOpacity>
          </React.Fragment>
        ))}
      </View>

      {/* Logout */}
      <TouchableOpacity
        className="mx-5 mt-7 bg-danger-light rounded-2xl py-4 items-center border border-danger-border"
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
        <Text className="text-base font-bold text-danger">ออกจากระบบ</Text>
      </TouchableOpacity>

      <Text className="text-center text-xs text-brand-disabled mt-6">
        SandboxEDU v1.0.0
      </Text>
    </ScrollView>
  );
}
