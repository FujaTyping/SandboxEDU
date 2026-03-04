import { Palette } from "@/constants/theme";
import { useRouter } from "expo-router";
import { BookOpen, Eye, EyeOff, Lock, Mail } from "lucide-react-native";
import React, { useState } from "react";
import {
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

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-surface-alt"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 20,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header gradient */}
        <View className="h-[260px] rounded-b-[40px] overflow-hidden">
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

          <View className="flex-1 justify-center items-center">
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
          >
            <Text className="text-[17px] font-bold text-white">
              เข้าสู่ระบบ
            </Text>
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
