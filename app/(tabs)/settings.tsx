import { Palette } from "@/constants/theme";
import { mockUser } from "@/data/mockData";
import { useRouter } from "expo-router";
import { Edit3, LogIn, RefreshCw, User, UserPlus } from "lucide-react-native";
import React from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const menuItems = [
  {
    icon: Edit3,
    label: "แก้ไขบทเรียน",
    desc: "จัดการวิชาและบทเรียน",
    key: "edit",
  },
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
      >
        <View className="w-14 h-14 rounded-[18px] bg-primary-bg justify-center items-center mr-3.5">
          <User size={28} color={Palette.primary} strokeWidth={2} />
        </View>
        <View className="flex-1">
          <Text className="text-xl font-bold text-brand-text">
            {mockUser.name}
          </Text>
          <Text className="text-[13px] text-brand-muted mt-0.5">
            {mockUser.grade} · {mockUser.age} ปี
          </Text>
        </View>
        <Text className="text-[28px] text-brand-disabled font-light">›</Text>
      </TouchableOpacity>

      {/* Menu section */}
      <Text className="text-[13px] font-bold text-brand-muted px-7 mt-7 mb-2.5 uppercase tracking-wider">
        ทั่วไป
      </Text>
      <View className="bg-surface mx-5 rounded-2xl overflow-hidden shadow-sm">
        {menuItems.map((item, index) => (
          <React.Fragment key={item.key}>
            {index > 0 && <View className="h-px bg-edge-light ml-[74px]" />}
            <TouchableOpacity
              className="flex-row items-center py-4 px-[18px]"
              activeOpacity={0.7}
              onPress={() => Alert.alert(item.label)}
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
            { text: "ออกจากระบบ", style: "destructive" },
          ])
        }
      >
        <Text className="text-base font-bold text-danger">ออกจากระบบ</Text>
      </TouchableOpacity>

      {/* Dev preview buttons */}
      <Text className="text-[13px] font-bold text-brand-muted px-7 mt-7 mb-2.5 uppercase tracking-wider">
        ดูตัวอย่างหน้า
      </Text>
      <View className="flex-row mx-5 gap-2.5">
        <TouchableOpacity
          className="flex-1 bg-surface rounded-2xl py-3.5 items-center shadow-sm"
          activeOpacity={0.8}
          onPress={() => router.push("/login" as any)}
        >
          <View className="w-10 h-10 rounded-xl justify-center items-center mb-2 bg-[#CCFBF1]">
            <LogIn size={18} color={Palette.primary} strokeWidth={2} />
          </View>
          <Text className="text-xs font-bold text-brand-text">หน้า Login</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-1 bg-surface rounded-2xl py-3.5 items-center shadow-sm"
          activeOpacity={0.8}
          onPress={() => router.push("/register" as any)}
        >
          <View className="w-10 h-10 rounded-xl justify-center items-center mb-2 bg-[#FEF3C7]">
            <UserPlus size={18} color={Palette.accent} strokeWidth={2} />
          </View>
          <Text className="text-xs font-bold text-brand-text">
            หน้า Register
          </Text>
        </TouchableOpacity>
      </View>

      <Text className="text-center text-xs text-brand-disabled mt-6">
        SandboxEDU v1.0.0
      </Text>
    </ScrollView>
  );
}
