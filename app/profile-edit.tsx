import { usePalette } from "@/hooks/use-palette";
import { getJwtWithRefresh } from "@/lib/auth/jwtRefresh";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Check, ChevronLeft, X } from "lucide-react-native";
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
  icon: string;
}

const FIELDS: FieldConfig[] = [
  { key: "name", label: "ชื่อ", placeholder: "สมชาย", icon: "👤" },
  { key: "surname", label: "นามสกุล", placeholder: "ใจดี", icon: "👤" },
  {
    key: "displayName",
    label: "ชื่อที่แสดง",
    placeholder: "ชายชาย",
    icon: "✏️",
  },
  {
    key: "avatarURL",
    label: "URL รูปโปรไฟล์",
    placeholder: DEFAULT_AVATAR,
    keyboardType: "url",
    icon: "🖼️",
  },
  {
    key: "sclass",
    label: "ระดับชั้น (1-6)",
    placeholder: "5",
    keyboardType: "number-pad",
    icon: "📚",
  },
  {
    key: "room",
    label: "ห้อง",
    placeholder: "1",
    keyboardType: "number-pad",
    icon: "🏫",
  },
];

export default function ProfileEditScreen() {
  const Palette = usePalette();
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
      const token = await getJwtWithRefresh();
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
    setEditValue(user ? String(user[field] ?? "") : "");
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
      const token = await getJwtWithRefresh();
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
      style={{ flex: 1, backgroundColor: Palette.surfaceAlt }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingBottom: 12,
          paddingHorizontal: 16,
          backgroundColor: Palette.surface,
          borderBottomWidth: 1,
          borderBottomColor: Palette.borderLight,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            backgroundColor: Palette.surfaceAlt,
            alignItems: "center",
            justifyContent: "center",
          }}
          activeOpacity={0.7}
        >
          <ChevronLeft size={20} color={Palette.text} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: 18,
            fontWeight: "800",
            color: Palette.text,
            flex: 1,
          }}
        >
          แก้ไขโปรไฟล์
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar + name preview */}
        <View
          style={{
            backgroundColor: Palette.surface,
            alignItems: "center",
            paddingVertical: 28,
            marginBottom: 12,
          }}
        >
          <View
            style={{
              width: 88,
              height: 88,
              borderRadius: 44,
              borderWidth: 3,
              borderColor: Palette.primary + "30",
              backgroundColor: Palette.surfaceAlt,
              overflow: "hidden",
              marginBottom: 12,
            }}
          >
            {loadingUser ? (
              <View
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ActivityIndicator color={Palette.primary} />
              </View>
            ) : (
              <Image
                source={{ uri: avatarUrl }}
                style={{ width: 88, height: 88 }}
                contentFit="cover"
              />
            )}
          </View>
          <Text
            style={{ fontSize: 18, fontWeight: "800", color: Palette.text }}
          >
            {displayName}
          </Text>
          {(gradeText || roomText) && (
            <Text
              style={{ fontSize: 13, color: Palette.textMuted, marginTop: 4 }}
            >
              {[gradeText, roomText].filter(Boolean).join(" · ")}
            </Text>
          )}
        </View>

        {/* Edit fields */}
        <View
          style={{
            marginHorizontal: 16,
            backgroundColor: Palette.surface,
            borderRadius: 20,
            overflow: "hidden",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 2,
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
                      backgroundColor: Palette.borderLight,
                      marginHorizontal: 16,
                    }}
                  />
                )}
                <View style={{ paddingHorizontal: 18, paddingVertical: 14 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 6,
                    }}
                  >
                    <Text style={{ fontSize: 15 }}>{field.icon}</Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color: Palette.textMuted,
                        fontWeight: "700",
                      }}
                    >
                      {field.label}
                    </Text>
                  </View>
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
                          color: Palette.text,
                          borderBottomWidth: 2,
                          borderBottomColor: Palette.primary,
                          paddingVertical: 4,
                        }}
                        value={editValue}
                        onChangeText={setEditValue}
                        placeholder={field.placeholder}
                        placeholderTextColor={Palette.disabled}
                        keyboardType={field.keyboardType ?? "default"}
                        autoFocus
                      />
                      <TouchableOpacity
                        onPress={saveEdit}
                        disabled={saving}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          backgroundColor: Palette.success,
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
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          backgroundColor: Palette.borderLight,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <X
                          size={16}
                          color={Palette.textMuted}
                          strokeWidth={2.5}
                        />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={() => startEdit(field.key)}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: Palette.surfaceAlt,
                        borderRadius: 10,
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={{
                          flex: 1,
                          fontSize: 15,
                          color: currentVal ? Palette.text : Palette.disabled,
                          fontWeight: currentVal ? "600" : "400",
                        }}
                        numberOfLines={1}
                      >
                        {currentVal || field.placeholder}
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          color: Palette.primary,
                          fontWeight: "700",
                        }}
                      >
                        แก้ไข
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
