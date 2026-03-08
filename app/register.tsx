import { Palette } from "@/constants/theme";
import { saveJwt } from "@/lib/auth/token";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import {
  BookOpen,
  Eye,
  EyeOff,
  Hash,
  Lock,
  Mail,
  User,
  UserPlus,
} from "lucide-react-native";
import React, { useState } from "react";
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
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validatePassword(pw: string): string | null {
  if (pw.length < 8) return "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร";
  if (!/[A-Z]/.test(pw)) return "รหัสผ่านต้องมีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว";
  if (!/[0-9]/.test(pw)) return "รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว";
  return null;
}

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<"auth" | "profile">("auth");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [sclass, setSclass] = useState("");
  const [room, setRoom] = useState("");

  async function handleRegister() {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName || !trimmedEmail || !password || !confirmPassword) {
      Alert.alert("ข้อมูลไม่ครบ", "กรุณากรอกข้อมูลให้ครบทุกช่อง");
      return;
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      Alert.alert("อีเมลไม่ถูกต้อง", "กรุณากรอกอีเมลในรูปแบบที่ถูกต้อง");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("รหัสผ่านไม่ตรงกัน", "กรุณากรอกรหัสผ่านให้ตรงกัน");
      return;
    }

    const pwError = validatePassword(password);
    if (pwError) {
      Alert.alert("รหัสผ่านไม่ปลอดภัย", pwError);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password: password,
      options: {
        emailRedirectTo: "sandboxedu://auth/callback",
        data: {
          full_name: trimmedName,
        },
      },
    });

    if (error) {
      Alert.alert("สมัครสมาชิกล้มเหลว", error.message);
      setLoading(false);
    } else if (data.session) {
      setLoading(false);
      setStep("profile");
    } else {
      Alert.alert(
        "ยืนยันอีเมล",
        "กรุณาตรวจสอบอีเมลเพื่อยืนยันบัญชี จากนั้นกลับมากรอกข้อมูลโปรไฟล์",
        [{ text: "ตรวจสอบอีเมล", onPress: () => router.replace("/login") }],
      );
      setLoading(false);
    }
  }

  async function handleCreateProfile() {
    if (loading) return; // ป้องกัน multiple submit

    const fn = firstName.trim();
    const ln = lastName.trim();
    const dn = displayName.trim();
    const sc = parseInt(sclass.trim(), 10);
    const rm = parseInt(room.trim(), 10);

    if (!fn || !ln || !dn || !sclass || !room) {
      Alert.alert("ข้อมูลไม่ครบ", "กรุณากรอกข้อมูลให้ครบทุกช่อง");
      return;
    }
    if (isNaN(sc) || sc < 1 || sc > 6) {
      Alert.alert("ระดับชั้นไม่ถูกต้อง", "กรอก 1-6 (ม.ย1-ย6)");
      return;
    }
    if (isNaN(rm) || rm < 1) {
      Alert.alert("ห้องไม่ถูกต้อง", "กรอกเลขห้องเป็นตัวเลข");
      return;
    }

    setLoading(true);
    try {
      const apiBase = process.env.EXPO_PUBLIC_API_BASE_URL;
      const createRes = await fetch(`${apiBase}/users/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fn,
          surname: ln,
          displayName: dn,
          avatarURL: "",
          sclass: sc,
          room: rm,
        }),
      });
      if (!createRes.ok) {
        const errBody = await createRes.json().catch(() => ({}));
        throw new Error((errBody as any).message ?? `HTTP ${createRes.status}`);
      }

      const revalRes = await fetch(`${apiBase}/users/revalidate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: dn }),
      });

      if (!revalRes.ok) {
        throw new Error("ไม่สามารถยืนยันตัวตนได้");
      }

      const revalData = await revalRes.json();
      const jwt = revalData.token ?? revalData.jwt ?? revalData.secret;

      if (!jwt) {
        throw new Error("ไม่ได้รับ JWT จากระบบ");
      }

      await saveJwt(jwt);
      router.replace("/(tabs)");
    } catch (e) {
      await supabase.auth.signOut();
      Alert.alert(
        "สร้างบัญชีไม่สำเร็จ",
        e instanceof Error ? e.message : "ลองใหม่อีกครั้ง",
      );
      setLoading(false);
    }
  }

  if (step === "profile") {
    return (
      <KeyboardAvoidingView
        className="flex-1 bg-surface-alt"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: insets.bottom + 20,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View
            className="rounded-b-[40px] overflow-hidden relative"
            style={{ height: 200 + insets.top }}
          >
            <Svg
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
              width="100%"
              height="100%"
            >
              <Defs>
                <LinearGradient id="profGrad" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor={Palette.gradientStart} />
                  <Stop offset="0.5" stopColor={Palette.gradientMid} />
                  <Stop offset="1" stopColor={Palette.gradientEnd} />
                </LinearGradient>
              </Defs>
              <Rect width="100%" height="100%" fill="url(#profGrad)" />
            </Svg>
            <View
              className="absolute inset-0 justify-center items-center"
              style={{ paddingTop: insets.top }}
            >
              <View className="w-20 h-20 rounded-3xl bg-white/95 justify-center items-center mb-3 shadow-lg">
                <User size={38} color={Palette.primary} strokeWidth={2} />
              </View>
              <Text className="text-[24px] font-extrabold text-white">
                ข้อมูลโปรไฟล์
              </Text>
              <Text className="text-sm text-white/80 mt-1">
                กรอกข้อมูลเพิ่มเติมเพื่อเริ่มใช้งาน
              </Text>
            </View>
          </View>

          <View className="mx-6 -mt-[30px] bg-surface rounded-3xl p-7 shadow-lg">
            <Text className="text-xl font-extrabold text-brand-text mb-1">
              เพิ่มข้อมูล
            </Text>
            <Text className="text-sm text-brand-muted mb-5">
              กรอกชื่อและระดับชั้นเรียนของคุณ
            </Text>

            {[
              {
                label: "ชื่อ",
                value: firstName,
                setter: setFirstName,
                placeholder: "สมชาย",
                icon: User,
              },
              {
                label: "นามสกุล",
                value: lastName,
                setter: setLastName,
                placeholder: "ใจดี",
                icon: User,
              },
              {
                label: "ชื่อแสดง (DisplayName)",
                value: displayName,
                setter: setDisplayName,
                placeholder: "ชายชาย",
                icon: UserPlus,
              },
            ].map((f) => (
              <View key={f.label} className="mb-4">
                <Text className="text-[13px] font-semibold text-brand-secondary mb-2">
                  {f.label}
                </Text>
                <View className="flex-row items-center bg-surface-alt rounded-[14px] border border-edge px-3.5 h-[52px] gap-2.5">
                  <f.icon size={18} color={Palette.textMuted} strokeWidth={2} />
                  <TextInput
                    className="flex-1 text-base text-brand-text"
                    placeholder={f.placeholder}
                    placeholderTextColor={Palette.disabled}
                    value={f.value}
                    onChangeText={f.setter}
                  />
                </View>
              </View>
            ))}

            <View className="flex-row gap-3 mb-5">
              <View className="flex-1">
                <Text className="text-[13px] font-semibold text-brand-secondary mb-2">
                  ระดับชั้น (ม.1-6)
                </Text>
                <View className="flex-row items-center bg-surface-alt rounded-[14px] border border-edge px-3.5 h-[52px] gap-2.5">
                  <Hash size={18} color={Palette.textMuted} strokeWidth={2} />
                  <TextInput
                    className="flex-1 text-base text-brand-text"
                    placeholder="5"
                    placeholderTextColor={Palette.disabled}
                    value={sclass}
                    onChangeText={setSclass}
                    keyboardType="number-pad"
                    maxLength={1}
                  />
                </View>
              </View>
              <View className="flex-1">
                <Text className="text-[13px] font-semibold text-brand-secondary mb-2">
                  ห้อง
                </Text>
                <View className="flex-row items-center bg-surface-alt rounded-[14px] border border-edge px-3.5 h-[52px] gap-2.5">
                  <Hash size={18} color={Palette.textMuted} strokeWidth={2} />
                  <TextInput
                    className="flex-1 text-base text-brand-text"
                    placeholder="1"
                    placeholderTextColor={Palette.disabled}
                    value={room}
                    onChangeText={setRoom}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                </View>
              </View>
            </View>

            <TouchableOpacity
              className="bg-primary rounded-2xl h-[54px] justify-center items-center shadow-md"
              activeOpacity={0.85}
              onPress={handleCreateProfile}
              disabled={loading}
              style={{ opacity: loading ? 0.6 : 1 }}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-[17px] font-bold text-white">
                  เริ่มใช้งาน
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-surface-alt"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: insets.bottom + 20,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header gradient */}
        <View
          className="rounded-b-[40px] overflow-hidden relative"
          style={{ height: 230 + insets.top }}
        >
          <Svg
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
            width="100%"
            height="100%"
          >
            <Defs>
              <LinearGradient id="regGrad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={Palette.gradientStart} />
                <Stop offset="0.5" stopColor={Palette.gradientMid} />
                <Stop offset="1" stopColor={Palette.gradientEnd} />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#regGrad)" />
          </Svg>

          <View
            className="absolute inset-0 justify-center items-center"
            style={{ paddingTop: insets.top }}
          >
            <View className="w-20 h-20 rounded-3xl bg-white/95 justify-center items-center mb-4 shadow-lg">
              <BookOpen size={40} color={Palette.primary} strokeWidth={2} />
            </View>
            <Text className="text-[28px] font-extrabold text-white tracking-wider">
              SandboxEDU
            </Text>
            <Text className="text-sm text-white/80 mt-1">
              สร้างบัญชีใหม่เพื่อเริ่มเรียน
            </Text>
          </View>
        </View>

        {/* Form card */}
        <View className="mx-6 -mt-[30px] bg-surface rounded-3xl p-7 shadow-lg">
          <Text className="text-2xl font-extrabold text-brand-text mb-1">
            สมัครสมาชิก
          </Text>
          <Text className="text-sm text-brand-muted mb-6">
            กรอกข้อมูลเพื่อสร้างบัญชี
          </Text>

          {/* Name */}
          <View className="mb-4">
            <Text className="text-[13px] font-semibold text-brand-secondary mb-2">
              ชื่อ-นามสกุล
            </Text>
            <View className="flex-row items-center bg-surface-alt rounded-[14px] border border-edge px-3.5 h-[52px] gap-2.5">
              <UserPlus size={18} color={Palette.textMuted} strokeWidth={2} />
              <TextInput
                className="flex-1 text-base text-brand-text"
                placeholder="สมชาย ใจดี"
                placeholderTextColor={Palette.disabled}
                value={name}
                onChangeText={setName}
              />
            </View>
          </View>

          {/* Email */}
          <View className="mb-4">
            <Text className="text-[13px] font-semibold text-brand-secondary mb-2">
              อีเมล
            </Text>
            <View className="flex-row items-center bg-surface-alt rounded-[14px] border border-edge px-3.5 h-[52px] gap-2.5">
              <Mail size={18} color={Palette.textMuted} strokeWidth={2} />
              <TextInput
                className="flex-1 text-base text-brand-text"
                placeholder="example@email.com"
                placeholderTextColor={Palette.disabled}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Password */}
          <View className="mb-4">
            <Text className="text-[13px] font-semibold text-brand-secondary mb-2">
              รหัสผ่าน
            </Text>
            <View className="flex-row items-center bg-surface-alt rounded-[14px] border border-edge px-3.5 h-[52px] gap-2.5">
              <Lock size={18} color={Palette.textMuted} strokeWidth={2} />
              <TextInput
                className="flex-1 text-base text-brand-text"
                placeholder="อย่างน้อย 6 ตัวอักษร"
                placeholderTextColor={Palette.disabled}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {showPassword ? (
                  <EyeOff size={18} color={Palette.textMuted} strokeWidth={2} />
                ) : (
                  <Eye size={18} color={Palette.textMuted} strokeWidth={2} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password */}
          <View className="mb-4">
            <Text className="text-[13px] font-semibold text-brand-secondary mb-2">
              ยืนยันรหัสผ่าน
            </Text>
            <View className="flex-row items-center bg-surface-alt rounded-[14px] border border-edge px-3.5 h-[52px] gap-2.5">
              <Lock size={18} color={Palette.textMuted} strokeWidth={2} />
              <TextInput
                className="flex-1 text-base text-brand-text"
                placeholder="กรอกรหัสผ่านอีกครั้ง"
                placeholderTextColor={Palette.disabled}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirm}
              />
              <TouchableOpacity
                onPress={() => setShowConfirm(!showConfirm)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {showConfirm ? (
                  <EyeOff size={18} color={Palette.textMuted} strokeWidth={2} />
                ) : (
                  <Eye size={18} color={Palette.textMuted} strokeWidth={2} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Register button */}
          <TouchableOpacity
            className="bg-primary rounded-2xl h-[54px] justify-center items-center mt-2 mb-5 shadow-md"
            activeOpacity={0.85}
            onPress={handleRegister}
            disabled={loading}
            style={{ opacity: loading ? 0.6 : 1 }}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-[17px] font-bold text-white">
                สมัครสมาชิก
              </Text>
            )}
          </TouchableOpacity>

          {/* Login link */}
          <View className="flex-row justify-center items-center">
            <Text className="text-sm text-brand-secondary">
              มีบัญชีอยู่แล้ว?{" "}
            </Text>
            <TouchableOpacity onPress={() => router.push("/login" as any)}>
              <Text className="text-sm font-bold text-primary">
                เข้าสู่ระบบ
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
