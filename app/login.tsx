import { usePalette } from "@/hooks/use-palette";
import { saveJwtWithExpiry } from "@/lib/auth/jwtRefresh";
import { handleUserLogin } from "@/lib/auth/userSession";
import { saveUserCache } from "@/lib/cache/userCache";
import { supabase } from "@/lib/supabase";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Eye, EyeOff, Lock, Mail } from "lucide-react-native";
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
  const Palette = usePalette();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [needsDisplayName, setNeedsDisplayName] = useState(false);
  const [fallbackDisplayName, setFallbackDisplayName] = useState("");
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
        const session = sessionData.session;
        const apiBase = process.env.EXPO_PUBLIC_API_BASE_URL;

        if (!session || !apiBase) {
          throw new Error("ไม่สามารถเชื่อมต่อกับระบบได้");
        }

        // ดึง displayName จาก Supabase user metadata (บันทึกตอน register)
        let displayName: string =
          (session.user.user_metadata?.displayName as string | undefined) ?? "";

        console.log("[Login] displayName from metadata:", displayName);

        // Fallback: user เก่าไม่มี metadata — ใช้ fallbackDisplayName จาก state
        if (!displayName) {
          if (!fallbackDisplayName.trim()) {
            setNeedsDisplayName(true);
            setLoading(false);
            await supabase.auth.signOut();
            Alert.alert(
              "กรุณากรอก Display Name",
              "กรอก Display Name ที่ช่องด้านล่างแล้วกดเข้าสู่ระบบอีกครั้ง",
            );
            return;
          }
          displayName = fallbackDisplayName.trim();
          await supabase.auth
            .updateUser({ data: { displayName } })
            .catch(() => {});
        }

        // /users/revalidate — ส่งแค่ displayName ไม่ต้องการ auth header
        const revalRes = await fetch(`${apiBase}/users/revalidate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayName }),
        });

        console.log("[Login] /users/revalidate status:", revalRes.status);
        if (!revalRes.ok) {
          const errText = await revalRes.text();
          console.error("[Login] /users/revalidate error:", errText);
          let apiMsg = "";
          try {
            apiMsg = JSON.parse(errText)?.message ?? "";
          } catch {}
          throw new Error(apiMsg || "ยืนยันตัวตนไม่สำเร็จ");
        }

        // รองรับทั้ง plain text และ JSON {token/jwt/secret}
        const revalText = await revalRes.text();
        console.log("[Login] revalidate response:", revalText.slice(0, 80));

        let jwt: string | null = null;
        try {
          const revalJson = JSON.parse(revalText);
          jwt = revalJson.token ?? revalJson.jwt ?? revalJson.secret ?? null;
        } catch {
          jwt = revalText.trim();
        }

        if (!jwt) {
          throw new Error("ไม่ได้รับ JWT จากระบบ");
        }

        await saveJwtWithExpiry(jwt);

        // ตรวจสอบว่า user เปลี่ยนหรือไม่ แล้ว clear data ถ้าใช่
        const userId = session.user.id;
        await handleUserLogin(userId);

        // ดึงข้อมูล user profile ด้วย custom JWT แล้ว cache
        try {
          const userRes = await fetch(`${apiBase}/users/get`, {
            headers: { authorization: `Bearer ${jwt}` },
          });
          if (userRes.ok) {
            const userData = await userRes.json();
            await saveUserCache(userData);
          }
        } catch {
          /* silent — cache ไม่สำเร็จก็ยังเข้าแอพได้ */
        }

        jwtObtained = true;
      } catch (e) {
        await supabase.auth.signOut();
        Alert.alert(
          "เข้าสู่ระบบไม่สำเร็จ",
          e instanceof Error ? e.message : "กรุณาลองใหม่อีกครั้ง",
        );
      } finally {
        setLoading(false);
      }

      if (jwtObtained) {
        router.replace("/(tabs)");
      }
    }
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
              เรียนรู้ได้ทุกที่ ทุกเวลา
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
            เข้าสู่ระบบ
          </Text>
          <Text
            style={{ fontSize: 14, color: Palette.textMuted, marginBottom: 24 }}
          >
            กรอกข้อมูลเพื่อเข้าใช้งาน
          </Text>

          {/* Fallback: Display Name สำหรับ user เก่า */}
          {needsDisplayName && (
            <View style={{ marginBottom: 18 }}>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "700",
                  color: Palette.danger,
                  marginBottom: 6,
                }}
              >
                ⚠️ กรอก Display Name ที่ใช้ตอนสมัคร
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: Palette.surfaceAlt,
                  borderRadius: 14,
                  borderWidth: 1.5,
                  borderColor: Palette.danger,
                  paddingHorizontal: 14,
                  height: 52,
                }}
              >
                <TextInput
                  style={{ flex: 1, fontSize: 16, color: Palette.text }}
                  placeholder="เช่น Somsri"
                  placeholderTextColor={Palette.disabled}
                  value={fallbackDisplayName}
                  onChangeText={setFallbackDisplayName}
                  autoCapitalize="none"
                />
              </View>
            </View>
          )}

          {/* Email */}
          <View style={{ marginBottom: 18 }}>
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
          <View style={{ marginBottom: 18 }}>
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
          <TouchableOpacity
            style={{ alignSelf: "flex-end", marginBottom: 24, marginTop: -6 }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: Palette.primary,
              }}
            >
              ลืมรหัสผ่าน?
            </Text>
          </TouchableOpacity>

          {/* Login button */}
          <TouchableOpacity
            style={{
              backgroundColor: Palette.primary,
              borderRadius: 16,
              height: 54,
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 20,
              opacity: loading ? 0.6 : 1,
            }}
            activeOpacity={0.85}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={{ fontSize: 17, fontWeight: "700", color: "#fff" }}>
                เข้าสู่ระบบ
              </Text>
            )}
          </TouchableOpacity>

          {/* Register link */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 14, color: Palette.textSecondary }}>
              ยังไม่มีบัญชี?{" "}
            </Text>
            <TouchableOpacity onPress={() => router.push("/register" as any)}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "700",
                  color: Palette.primary,
                }}
              >
                สมัครสมาชิก
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
