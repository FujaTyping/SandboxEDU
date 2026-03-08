import { Palette } from "@/constants/theme";
import { clearJwt, getJwt } from "@/lib/auth/token";
import { supabase } from "@/lib/supabase";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
  BookOpen,
  Check,
  ChevronRight,
  LogOut,
  Pencil,
  User,
  X,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
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

type EditField =
  | "name"
  | "surname"
  | "displayName"
  | "avatarURL"
  | "sclass"
  | "room";

interface FieldConfig {
  key: EditField;
  label: string;
  placeholder: string;
  keyboardType?: "default" | "number-pad" | "url";
}

const FIELDS: FieldConfig[] = [
  { key: "name", label: "ชื่อ", placeholder: "สมชาย" },
  { key: "surname", label: "นามสกุล", placeholder: "ใจดี" },
  { key: "displayName", label: "ชื่อที่แสดง", placeholder: "ชายชาย" },
  {
    key: "avatarURL",
    label: "URL รูปโปรไฟล์",
    placeholder: DEFAULT_AVATAR,
    keyboardType: "url",
  },
  {
    key: "sclass",
    label: "ระดับชั้น (1-6)",
    placeholder: "5",
    keyboardType: "number-pad",
  },
  { key: "room", label: "ห้อง", placeholder: "1", keyboardType: "number-pad" },
];

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [editingField, setEditingField] = useState<EditField | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchUser = useCallback(async () => {
    try {
      setLoadingUser(true);
      const token = await getJwt();
      if (!token) return;
      const apiBase = process.env.EXPO_PUBLIC_API_BASE_URL;
      const res = await fetch(`${apiBase}/users/get`, {
        headers: { authorization: `Bearer ${token}` },
      });
      if (res.ok) setUser(await res.json());
    } catch {
      /* silent */
    } finally {
      setLoadingUser(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  function startEdit(field: EditField) {
    const current = user ? String(user[field] ?? "") : "";
    setEditValue(current);
    setEditingField(field);
  }

  function cancelEdit() {
    setEditingField(null);
    setEditValue("");
  }

  async function saveEdit() {
    if (!editingField) return;
    const val = editValue.trim();
    if (!val) {
      Alert.alert("ข้อมูลว่าง", "กรุณากรอกค่าที่ต้องการบันทึก");
      return;
    }
    if (
      editingField === "sclass" &&
      (isNaN(Number(val)) || Number(val) < 1 || Number(val) > 6)
    ) {
      Alert.alert("ระดับชั้นไม่ถูกต้อง", "กรอก 1-6");
      return;
    }
    if (editingField === "room" && (isNaN(Number(val)) || Number(val) < 1)) {
      Alert.alert("ห้องไม่ถูกต้อง", "กรอกเลขห้องเป็นตัวเลข");
      return;
    }
    setSaving(true);
    try {
      const token = await getJwt();
      if (!token) throw new Error("ไม่พบ token");
      const apiBase = process.env.EXPO_PUBLIC_API_BASE_URL;
      const res = await fetch(`${apiBase}/users/edit/${editingField}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ value: val }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error((errBody as any).message ?? `HTTP ${res.status}`);
      }
      await fetchUser();
      setEditingField(null);
      setEditValue("");
    } catch (e) {
      Alert.alert(
        "บันทึกไม่สำเร็จ",
        e instanceof Error ? e.message : "ลองใหม่อีกครั้ง",
      );
    } finally {
      setSaving(false);
    }
  }

  const avatarUrl = user?.avatarURL || DEFAULT_AVATAR;
  const displayName = user?.displayName ?? user?.name ?? "ผู้ใช้";
  const gradeText = user?.sclass ? `ม.${user.sclass}` : null;
  const roomText = user?.room ? `ห้อง ${user.room}` : null;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={{ flex: 1, backgroundColor: "#F8FAFC" }}
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: 48,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text
          style={{
            fontSize: 28,
            fontWeight: "900",
            color: "#0F172A",
            paddingHorizontal: 20,
            marginBottom: 20,
          }}
        >
          ตั้งค่า
        </Text>

        {/* ── Profile Card ── */}
        <View
          style={{
            marginHorizontal: 20,
            backgroundColor: "#fff",
            borderRadius: 20,
            padding: 20,
            flexDirection: "row",
            alignItems: "center",
            gap: 16,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.07,
            shadowRadius: 8,
            elevation: 3,
            marginBottom: 24,
          }}
        >
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: "#E2E8F0",
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
            <Text style={{ fontSize: 18, fontWeight: "800", color: "#0F172A" }}>
              {loadingUser ? "กำลังโหลด..." : displayName}
            </Text>
            <Text style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>
              {[gradeText, roomText].filter(Boolean).join(" · ") ||
                "ไม่มีข้อมูล"}
            </Text>
          </View>
          <TouchableOpacity
            onPress={fetchUser}
            style={{
              padding: 8,
              borderRadius: 12,
              backgroundColor: Palette.primary + "15",
            }}
          >
            <BookOpen size={18} color={Palette.primary} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* ── Edit Profile Section ── */}
        <Text
          style={{
            fontSize: 13,
            fontWeight: "700",
            color: "#94A3B8",
            paddingHorizontal: 24,
            marginBottom: 10,
            textTransform: "uppercase",
            letterSpacing: 0.8,
          }}
        >
          แก้ไขโปรไฟล์
        </Text>
        <View
          style={{
            marginHorizontal: 20,
            backgroundColor: "#fff",
            borderRadius: 20,
            overflow: "hidden",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.07,
            shadowRadius: 8,
            elevation: 3,
            marginBottom: 24,
          }}
        >
          {FIELDS.map((field, index) => {
            const isEditing = editingField === field.key;
            const currentVal = user ? String(user[field.key] ?? "") : "";
            return (
              <View key={field.key}>
                {index > 0 && (
                  <View
                    style={{
                      height: 1,
                      backgroundColor: "#F1F5F9",
                      marginHorizontal: 18,
                    }}
                  />
                )}
                <View
                  style={{
                    paddingHorizontal: 18,
                    paddingVertical: 14,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      color: "#94A3B8",
                      fontWeight: "600",
                      marginBottom: 4,
                    }}
                  >
                    {field.label}
                  </Text>
                  {isEditing ? (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <TextInput
                        style={{
                          flex: 1,
                          fontSize: 15,
                          color: "#0F172A",
                          borderBottomWidth: 2,
                          borderBottomColor: Palette.primary,
                          paddingVertical: 4,
                        }}
                        value={editValue}
                        onChangeText={setEditValue}
                        placeholder={field.placeholder}
                        placeholderTextColor="#CBD5E1"
                        keyboardType={field.keyboardType ?? "default"}
                        autoFocus
                      />
                      <TouchableOpacity
                        onPress={saveEdit}
                        disabled={saving}
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 10,
                          backgroundColor: "#22C55E",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {saving ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Check size={16} color="#fff" strokeWidth={3} />
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={cancelEdit}
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 10,
                          backgroundColor: "#F1F5F9",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <X size={16} color="#64748B" strokeWidth={2.5} />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={() => startEdit(field.key)}
                      style={{ flexDirection: "row", alignItems: "center" }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={{
                          flex: 1,
                          fontSize: 15,
                          color: currentVal ? "#0F172A" : "#CBD5E1",
                          fontWeight: currentVal ? "600" : "400",
                        }}
                        numberOfLines={1}
                      >
                        {currentVal || field.placeholder}
                      </Text>
                      <Pencil size={15} color="#CBD5E1" strokeWidth={2} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* ── General Section ── */}
        <Text
          style={{
            fontSize: 13,
            fontWeight: "700",
            color: "#94A3B8",
            paddingHorizontal: 24,
            marginBottom: 10,
            textTransform: "uppercase",
            letterSpacing: 0.8,
          }}
        >
          ทั่วไป
        </Text>
        <View
          style={{
            marginHorizontal: 20,
            backgroundColor: "#fff",
            borderRadius: 20,
            overflow: "hidden",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.07,
            shadowRadius: 8,
            elevation: 3,
            marginBottom: 24,
          }}
        >
          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 18,
              paddingVertical: 16,
              gap: 14,
            }}
            activeOpacity={0.7}
            onPress={fetchUser}
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
              <User size={18} color={Palette.primary} strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{ fontSize: 15, fontWeight: "600", color: "#0F172A" }}
              >
                รีเฟรชข้อมูล
              </Text>
              <Text style={{ fontSize: 12, color: "#94A3B8", marginTop: 1 }}>
                โหลดข้อมูลโปรไฟล์ใหม่
              </Text>
            </View>
            <ChevronRight size={16} color="#CBD5E1" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* ── Logout ── */}
        <TouchableOpacity
          style={{
            marginHorizontal: 20,
            backgroundColor: "#FEF2F2",
            borderRadius: 20,
            paddingVertical: 16,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
            gap: 8,
            borderWidth: 1,
            borderColor: "#FECACA",
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
          <LogOut size={18} color="#EF4444" strokeWidth={2} />
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#EF4444" }}>
            ออกจากระบบ
          </Text>
        </TouchableOpacity>

        <Text
          style={{
            textAlign: "center",
            fontSize: 12,
            color: "#CBD5E1",
            marginTop: 24,
          }}
        >
          SandboxEDU v1.0.0
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
