import { Palette } from "@/constants/theme";
import { mockUser } from "@/data/mockData";
import React from "react";
import {
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const menuItems = [
  {
    icon: "📝",
    label: "แก้ไขบทเรียน",
    desc: "จัดการวิชาและบทเรียน",
    key: "edit",
  },
  {
    icon: "🔄",
    label: "ซิงค์ความคืบหน้า",
    desc: "อัพเดทข้อมูลล่าสุด",
    key: "sync",
  },
];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.pageTitle}>ตั้งค่า</Text>

      {/* Profile card */}
      <TouchableOpacity style={styles.profileCard} activeOpacity={0.8}>
        <View style={styles.avatarWrap}>
          <Text style={styles.avatarEmoji}>🏞️</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{mockUser.name}</Text>
          <Text style={styles.profileMeta}>
            {mockUser.grade} · {mockUser.age} ปี
          </Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>

      {/* Menu section */}
      <Text style={styles.sectionLabel}>ทั่วไป</Text>
      <View style={styles.menuCard}>
        {menuItems.map((item, index) => (
          <React.Fragment key={item.key}>
            {index > 0 && <View style={styles.divider} />}
            <TouchableOpacity
              style={styles.menuRow}
              activeOpacity={0.7}
              onPress={() => Alert.alert(item.label)}
            >
              <View style={styles.menuIconWrap}>
                <Text style={styles.menuIcon}>{item.icon}</Text>
              </View>
              <View style={styles.menuTextWrap}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuDesc}>{item.desc}</Text>
              </View>
              <Text style={styles.menuChevron}>›</Text>
            </TouchableOpacity>
          </React.Fragment>
        ))}
      </View>

      {/* Logout */}
      <TouchableOpacity
        style={styles.logoutButton}
        activeOpacity={0.8}
        onPress={() =>
          Alert.alert("ออกจากระบบ", "ต้องการออกจากระบบหรือไม่?", [
            { text: "ยกเลิก", style: "cancel" },
            { text: "ออกจากระบบ", style: "destructive" },
          ])
        }
      >
        <Text style={styles.logoutText}>ออกจากระบบ</Text>
      </TouchableOpacity>

      <Text style={styles.versionText}>SandboxEDU v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.surfaceAlt,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: Palette.text,
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Palette.surface,
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 18,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
      default: {},
    }),
  },
  avatarWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: Palette.primaryBg,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  avatarEmoji: {
    fontSize: 28,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "700",
    color: Palette.text,
  },
  profileMeta: {
    fontSize: 13,
    color: Palette.textMuted,
    marginTop: 3,
  },
  chevron: {
    fontSize: 28,
    color: Palette.disabled,
    fontWeight: "300",
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: Palette.textMuted,
    paddingHorizontal: 28,
    marginTop: 28,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  menuCard: {
    backgroundColor: Palette.surface,
    marginHorizontal: 20,
    borderRadius: 20,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
      default: {},
    }),
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  menuIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: Palette.borderLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  menuIcon: {
    fontSize: 20,
  },
  menuTextWrap: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: Palette.text,
  },
  menuDesc: {
    fontSize: 12,
    color: Palette.textMuted,
    marginTop: 2,
  },
  menuChevron: {
    fontSize: 22,
    color: Palette.disabled,
    fontWeight: "300",
  },
  divider: {
    height: 1,
    backgroundColor: Palette.borderLight,
    marginLeft: 74,
  },
  logoutButton: {
    marginHorizontal: 20,
    marginTop: 28,
    backgroundColor: Palette.dangerLight,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Palette.dangerBorder,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "700",
    color: Palette.danger,
  },
  versionText: {
    textAlign: "center",
    fontSize: 12,
    color: Palette.disabled,
    marginTop: 24,
  },
});
