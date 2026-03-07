import { Palette } from "@/constants/theme";
import { saveJwt } from "@/lib/auth/token";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { BookOpen, Eye, EyeOff, Lock, Mail } from "lucide-react-native";
import React, { useRef, useState } from "react";
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
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const attemptCount = useRef(0);
  const lockoutUntil = useRef<number | null>(null);

  async function handleLogin() {
    if (loading) return; // ป้องกัน multiple requests
    if (lockoutUntil.current && Date.now() < lockoutUntil.current) {
      const remaining = Math.ceil((lockoutUntil.current - Date.now()) / 60000);
      Alert.alert("ถูกล็อค", `กรุณารอ ${remaining} นาที`);
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      Alert.alert("ข้อมูลไม่ครบ", "กรุณากรอกอีเมลและรหัสผ่าน");
      return;
    }
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      Alert.alert("อีเมลไม่ถูกต้อง", "กรุณากรอกอีเมลในรูปแบบที่ถูกต้อง");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password: password,
    });

    if (error) {
      attemptCount.current += 1;
      if (attemptCount.current >= MAX_ATTEMPTS) {
        lockoutUntil.current = Date.now() + LOCKOUT_MS;
        attemptCount.current = 0;
        Alert.alert(
          "ถูกล็อคชั่วคราว",
          "พยายามเข้าสู่ระบบเกินจำนวนครั้งที่กำหนด กรุณารอ 15 นาที",
        );
      } else {
        Alert.alert("เข้าสู่ระบบล้มเหลว", "อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      }
      setLoading(false);
    } else {
      attemptCount.current = 0;
      lockoutUntil.current = null;

      let jwtObtained = false;
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData.session?.access_token;
        const apiBase = process.env.EXPO_PUBLIC_API_BASE_URL;

        if (!accessToken || !apiBase) {
          throw new Error("ไม่สามารถเชื่อมต่อกับระบบได้");
        }

        const userRes = await fetch(`${apiBase}/users/get`, {
          headers: { authorization: `Bearer ${accessToken}` },
        });

        if (!userRes.ok) {
          throw new Error("ไม่สามารถดึงข้อมูลผู้ใช้ได้");
        }

        const userData = await userRes.json();
        const displayName = userData.displayName ?? userData.name;

        if (!displayName) {
          throw new Error("ไม่พบข้อมูลผู้ใช้");
        }

        const revalRes = await fetch(`${apiBase}/users/revalidate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayName }),
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
        jwtObtained = true;
      } catch (e) {
        await supabase.auth.signOut();
        Alert.alert(
          "เข้าสู่ระบบไม่สำเร็จ",
          e instanceof Error ? e.message : "กรุณาลองใหม่อีกครั้ง",
        );
        setLoading(false);
        return;
      }

      if (jwtObtained) {
        router.replace("/(tabs)");
      }
    }
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
          style={{ height: 260 + insets.top }}
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
              <LinearGradient id="loginGrad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={Palette.gradientStart} />
                <Stop offset="0.5" stopColor={Palette.gradientMid} />
                <Stop offset="1" stopColor={Palette.gradientEnd} />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#loginGrad)" />
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
              เรียนรู้ได้ทุกที่ ทุกเวลา
            </Text>
          </View>
        </View>

        {/* Form card */}
        <View className="mx-6 -mt-[30px] bg-surface rounded-3xl p-7 shadow-lg">
          <Text className="text-2xl font-extrabold text-brand-text mb-1">
            เข้าสู่ระบบ
          </Text>
          <Text className="text-sm text-brand-muted mb-6">
            กรอกข้อมูลเพื่อเข้าใช้งาน
          </Text>

          {/* Email */}
          <View className="mb-[18px]">
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
          <View className="mb-[18px]">
            <Text className="text-[13px] font-semibold text-brand-secondary mb-2">
              รหัสผ่าน
            </Text>
            <View className="flex-row items-center bg-surface-alt rounded-[14px] border border-edge px-3.5 h-[52px] gap-2.5">
              <Lock size={18} color={Palette.textMuted} strokeWidth={2} />
              <TextInput
                className="flex-1 text-base text-brand-text"
                placeholder="••••••••"
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

          {/* Forgot password */}
          <TouchableOpacity className="self-end mb-6 -mt-1.5">
            <Text className="text-[13px] font-semibold text-primary">
              ลืมรหัสผ่าน?
            </Text>
          </TouchableOpacity>

          {/* Login button */}
          <TouchableOpacity
            className="bg-primary rounded-2xl h-[54px] justify-center items-center mb-5 shadow-md"
            activeOpacity={0.85}
            onPress={handleLogin}
            disabled={loading}
            style={{ opacity: loading ? 0.6 : 1 }}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-[17px] font-bold text-white">
                เข้าสู่ระบบ
              </Text>
            )}
          </TouchableOpacity>

          {/* Register link */}
          <View className="flex-row justify-center items-center">
            <Text className="text-sm text-brand-secondary">
              ยังไม่มีบัญชี?{" "}
            </Text>
            <TouchableOpacity onPress={() => router.push("/register" as any)}>
              <Text className="text-sm font-bold text-primary">
                สมัครสมาชิก
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
