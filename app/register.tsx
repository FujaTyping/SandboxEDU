import { usePalette } from "@/hooks/use-palette";
import { saveJwt } from "@/lib/auth/token";
import { supabase } from "@/lib/supabase";
import { Image } from "expo-image";
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
  const Palette = usePalette();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<"auth" | "otp" | "profile">("auth");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const [otp, setOtp] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [sclass, setSclass] = useState("");
  const [room, setRoom] = useState("");
  const [avatarURL, setAvatarURL] = useState("https://i.pravatar.cc/512");

  async function handleRegister() {
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail || !password || !confirmPassword) {
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
    });
    setLoading(false);

    if (error) {
      console.error("[Register] Supabase signUp error:", error);
      Alert.alert(
        "สมัครสมาชิกล้มเหลว",
        `${error.message}\n\n(status: ${(error as any).status ?? "?"})`,
      );
    } else if (data.session) {
      setStep("profile");
    } else {
      setStep("otp");
    }
  }

  async function handleVerifyOtp() {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedOtp = otp.trim();
    if (trimmedOtp.length !== 8) {
      Alert.alert("รหัสไม่ถูกต้อง", "กรุณากรอกรหัส 8 หลักจากอีเมล");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email: trimmedEmail,
      token: trimmedOtp,
      type: "signup",
    });
    setLoading(false);
    if (error) {
      Alert.alert("ยืนยันไม่สำเร็จ", error.message);
    } else {
      setStep("profile");
    }
  }

  async function handleResendOtp() {
    const trimmedEmail = email.trim().toLowerCase();
    setLoading(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: trimmedEmail,
    });
    setLoading(false);
    if (error) {
      Alert.alert("ส่งซ้ำไม่สำเร็จ", error.message);
    } else {
      Alert.alert("ส่งแล้ว", "กรุณาตรวจสอบอีเมลอีกครั้ง");
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
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        throw new Error("ไม่พบ session กรุณาล็อกอินแล้วลองใหม่");
      }

      const apiBase = process.env.EXPO_PUBLIC_API_BASE_URL;
      const createRes = await fetch(`${apiBase}/users/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          name: fn,
          surname: ln,
          displayName: dn,
          avatarURL: avatarURL.trim() || "https://i.pravatar.cc/512",
          sclass: sc,
          room: rm,
        }),
      });
      if (!createRes.ok) {
        const errText = await createRes.text().catch(() => "");
        console.error("[CreateProfile] /users/create error:", errText);
        let errMsg = `HTTP ${createRes.status}`;
        try {
          errMsg = JSON.parse(errText)?.message ?? errMsg;
        } catch {}
        throw new Error(errMsg);
      }

      // /users/create returns JWT as text/plain directly
      const jwt = await createRes.text();

      if (!jwt) {
        throw new Error("ไม่ได้รับ JWT จากระบบ");
      }

      await saveJwt(jwt);
      router.replace("/(tabs)");
    } catch (e) {
      Alert.alert(
        "สร้างบัญชีไม่สำเร็จ",
        e instanceof Error ? e.message : "ลองใหม่อีกครั้ง",
      );
      setLoading(false);
    }
  }

  if (step === "otp") {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: Palette.surfaceAlt }}
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
                <LinearGradient id="otpGrad" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor={Palette.gradientStart} />
                  <Stop offset="0.5" stopColor={Palette.gradientMid} />
                  <Stop offset="1" stopColor={Palette.gradientEnd} />
                </LinearGradient>
              </Defs>
              <Rect width="100%" height="100%" fill="url(#otpGrad)" />
            </Svg>
            <View
              className="absolute inset-0 justify-center items-center"
              style={{ paddingTop: insets.top }}
            >
              <View className="w-20 h-20 rounded-3xl bg-white/95 justify-center items-center mb-3 shadow-lg overflow-hidden">
                <Image
                  source={require("../assets/images/sanboxedu.png")}
                  style={{ width: 72, height: 72 }}
                  contentFit="contain"
                />
              </View>
              <Text className="text-[24px] font-extrabold text-white">
                ยืนยันอีเมล
              </Text>
              <Text className="text-sm text-white/80 mt-1">
                กรอกรหัส 8 หลักจากอีเมลของคุณ
              </Text>
            </View>
          </View>

          <View
            style={{
              marginHorizontal: 24,
              marginTop: -30,
              backgroundColor: Palette.surface,
              borderRadius: 24,
              padding: 28,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.08,
              shadowRadius: 12,
              elevation: 4,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: "900",
                color: Palette.text,
                marginBottom: 4,
              }}
            >
              รหัสยืนยัน
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: Palette.textMuted,
                marginBottom: 4,
              }}
            >
              ส่งไปที่{" "}
              <Text style={{ fontWeight: "600", color: Palette.text }}>
                {email.trim().toLowerCase()}
              </Text>
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: Palette.textMuted,
                marginBottom: 20,
              }}
            >
              ตรวจสอบในกล่องจดหมาย (และ Spam) ของคุณ
            </Text>

            <View style={{ marginBottom: 24 }}>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: Palette.textSecondary,
                  marginBottom: 8,
                }}
              >
                รหัส OTP (8 หลัก)
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: Palette.surfaceAlt,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: Palette.border,
                  paddingHorizontal: 14,
                  height: 60,
                  gap: 10,
                }}
              >
                <Hash size={20} color={Palette.textMuted} strokeWidth={2} />
                <TextInput
                  style={{
                    flex: 1,
                    fontSize: 28,
                    fontWeight: "700",
                    color: Palette.text,
                    letterSpacing: 8,
                  }}
                  placeholder="00000000"
                  placeholderTextColor={Palette.disabled}
                  value={otp}
                  onChangeText={(t) =>
                    setOtp(t.replace(/[^0-9]/g, "").slice(0, 8))
                  }
                  keyboardType="number-pad"
                  maxLength={8}
                  autoFocus
                />
              </View>
            </View>

            <TouchableOpacity
              style={{
                backgroundColor: Palette.primary,
                borderRadius: 16,
                height: 54,
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 16,
                opacity: loading ? 0.6 : 1,
              }}
              activeOpacity={0.85}
              onPress={handleVerifyOtp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text
                  style={{ fontSize: 17, fontWeight: "700", color: "#fff" }}
                >
                  ยืนยัน
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleResendOtp}
              disabled={loading}
              style={{ alignItems: "center", paddingVertical: 12 }}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 14, color: Palette.textMuted }}>
                ไม่ได้รับรหัส?{" "}
                <Text style={{ fontWeight: "700", color: Palette.primary }}>
                  ส่งอีกครั้ง
                </Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setStep("auth")}
              style={{ alignItems: "center", paddingVertical: 8 }}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 14, color: Palette.textMuted }}>
                ← กลับแก้ไขอีเมล
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  if (step === "profile") {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: Palette.surfaceAlt }}
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
              <View className="w-20 h-20 rounded-3xl bg-white/95 justify-center items-center mb-3 shadow-lg overflow-hidden">
                <Image
                  source={require("../assets/images/sanboxedu.png")}
                  style={{ width: 72, height: 72 }}
                  contentFit="contain"
                />
              </View>
              <Text className="text-[24px] font-extrabold text-white">
                ข้อมูลโปรไฟล์
              </Text>
              <Text className="text-sm text-white/80 mt-1">
                กรอกข้อมูลเพิ่มเติมเพื่อเริ่มใช้งาน
              </Text>
            </View>
          </View>

          <View
            style={{
              marginHorizontal: 24,
              marginTop: -30,
              backgroundColor: Palette.surface,
              borderRadius: 24,
              padding: 28,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.08,
              shadowRadius: 12,
              elevation: 4,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: "900",
                color: Palette.text,
                marginBottom: 4,
              }}
            >
              เพิ่มข้อมูล
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: Palette.textMuted,
                marginBottom: 20,
              }}
            >
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
              {
                label: "URL รูปโปรไฟล์ (ไม่บังคับ)",
                value: avatarURL,
                setter: setAvatarURL,
                placeholder: "https://i.pravatar.cc/512",
                icon: BookOpen,
              },
            ].map((f) => (
              <View key={f.label} style={{ marginBottom: 16 }}>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: Palette.textSecondary,
                    marginBottom: 8,
                  }}
                >
                  {f.label}
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: Palette.surfaceAlt,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: Palette.border,
                    paddingHorizontal: 14,
                    height: 52,
                    gap: 10,
                  }}
                >
                  <f.icon size={18} color={Palette.textMuted} strokeWidth={2} />
                  <TextInput
                    style={{ flex: 1, fontSize: 16, color: Palette.text }}
                    placeholder={f.placeholder}
                    placeholderTextColor={Palette.disabled}
                    value={f.value}
                    onChangeText={f.setter}
                  />
                </View>
              </View>
            ))}

            <View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: Palette.textSecondary,
                    marginBottom: 8,
                  }}
                >
                  ระดับชั้น (ม.1-6)
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: Palette.surfaceAlt,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: Palette.border,
                    paddingHorizontal: 14,
                    height: 52,
                    gap: 10,
                  }}
                >
                  <Hash size={18} color={Palette.textMuted} strokeWidth={2} />
                  <TextInput
                    style={{ flex: 1, fontSize: 16, color: Palette.text }}
                    placeholder="5"
                    placeholderTextColor={Palette.disabled}
                    value={sclass}
                    onChangeText={setSclass}
                    keyboardType="number-pad"
                    maxLength={1}
                  />
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: Palette.textSecondary,
                    marginBottom: 8,
                  }}
                >
                  ห้อง
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: Palette.surfaceAlt,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: Palette.border,
                    paddingHorizontal: 14,
                    height: 52,
                    gap: 10,
                  }}
                >
                  <Hash size={18} color={Palette.textMuted} strokeWidth={2} />
                  <TextInput
                    style={{ flex: 1, fontSize: 16, color: Palette.text }}
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
              style={{
                backgroundColor: Palette.primary,
                borderRadius: 16,
                height: 54,
                justifyContent: "center",
                alignItems: "center",
                opacity: loading ? 0.6 : 1,
              }}
              activeOpacity={0.85}
              onPress={handleCreateProfile}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text
                  style={{ fontSize: 17, fontWeight: "700", color: "#fff" }}
                >
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
      style={{ flex: 1, backgroundColor: Palette.surfaceAlt }}
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
            <View className="w-20 h-20 rounded-3xl bg-white/95 justify-center items-center mb-4 shadow-lg overflow-hidden">
              <Image
                source={require("../assets/images/sanboxedu.png")}
                style={{ width: 72, height: 72 }}
                contentFit="contain"
              />
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
        <View
          style={{
            marginHorizontal: 24,
            marginTop: -30,
            backgroundColor: Palette.surface,
            borderRadius: 24,
            padding: 28,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.08,
            shadowRadius: 12,
            elevation: 4,
          }}
        >
          <Text
            style={{
              fontSize: 22,
              fontWeight: "900",
              color: Palette.text,
              marginBottom: 4,
            }}
          >
            สมัครสมาชิก
          </Text>
          <Text
            style={{ fontSize: 14, color: Palette.textMuted, marginBottom: 24 }}
          >
            กรอกข้อมูลเพื่อสร้างบัญชี
          </Text>

          {/* Email */}
          <View style={{ marginBottom: 16 }}>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: Palette.textSecondary,
                marginBottom: 8,
              }}
            >
              อีเมล
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: Palette.surfaceAlt,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: Palette.border,
                paddingHorizontal: 14,
                height: 52,
                gap: 10,
              }}
            >
              <Mail size={18} color={Palette.textMuted} strokeWidth={2} />
              <TextInput
                style={{ flex: 1, fontSize: 16, color: Palette.text }}
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
          <View style={{ marginBottom: 16 }}>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: Palette.textSecondary,
                marginBottom: 8,
              }}
            >
              รหัสผ่าน
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: Palette.surfaceAlt,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: Palette.border,
                paddingHorizontal: 14,
                height: 52,
                gap: 10,
              }}
            >
              <Lock size={18} color={Palette.textMuted} strokeWidth={2} />
              <TextInput
                style={{ flex: 1, fontSize: 16, color: Palette.text }}
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
          <View style={{ marginBottom: 16 }}>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: Palette.textSecondary,
                marginBottom: 8,
              }}
            >
              ยืนยันรหัสผ่าน
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: Palette.surfaceAlt,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: Palette.border,
                paddingHorizontal: 14,
                height: 52,
                gap: 10,
              }}
            >
              <Lock size={18} color={Palette.textMuted} strokeWidth={2} />
              <TextInput
                style={{ flex: 1, fontSize: 16, color: Palette.text }}
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
            style={{
              backgroundColor: Palette.primary,
              borderRadius: 16,
              height: 54,
              justifyContent: "center",
              alignItems: "center",
              marginTop: 8,
              marginBottom: 20,
              opacity: loading ? 0.6 : 1,
            }}
            activeOpacity={0.85}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={{ fontSize: 17, fontWeight: "700", color: "#fff" }}>
                สมัครสมาชิก
              </Text>
            )}
          </TouchableOpacity>

          {/* Login link */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 14, color: Palette.textSecondary }}>
              มีบัญชีอยู่แล้ว?{" "}
            </Text>
            <TouchableOpacity onPress={() => router.push("/login" as any)}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "700",
                  color: Palette.primary,
                }}
              >
                เข้าสู่ระบบ
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
