import { Palette } from "@/constants/theme";
import { useRouter } from "expo-router";
import {
  BookOpen,
  Eye,
  EyeOff,
  Lock,
  Mail,
  UserPlus,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header gradient */}
        <View style={styles.headerBg}>
          <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
            <Defs>
              <LinearGradient id="regGrad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={Palette.gradientStart} />
                <Stop offset="0.5" stopColor={Palette.gradientMid} />
                <Stop offset="1" stopColor={Palette.gradientEnd} />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#regGrad)" />
          </Svg>

          <View style={styles.logoWrap}>
            <View style={styles.logoCircle}>
              <BookOpen size={40} color={Palette.primary} strokeWidth={2} />
            </View>
            <Text style={styles.appName}>SandboxEDU</Text>
            <Text style={styles.appTagline}>สร้างบัญชีใหม่เพื่อเริ่มเรียน</Text>
          </View>
        </View>

        {/* Form card */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>สมัครสมาชิก</Text>
          <Text style={styles.formSubtitle}>กรอกข้อมูลเพื่อสร้างบัญชี</Text>

          {/* Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>ชื่อ-นามสกุล</Text>
            <View style={styles.inputWrap}>
              <UserPlus size={18} color={Palette.textMuted} strokeWidth={2} />
              <TextInput
                style={styles.input}
                placeholder="สมชาย ใจดี"
                placeholderTextColor={Palette.disabled}
                value={name}
                onChangeText={setName}
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>อีเมล</Text>
            <View style={styles.inputWrap}>
              <Mail size={18} color={Palette.textMuted} strokeWidth={2} />
              <TextInput
                style={styles.input}
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
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>รหัสผ่าน</Text>
            <View style={styles.inputWrap}>
              <Lock size={18} color={Palette.textMuted} strokeWidth={2} />
              <TextInput
                style={styles.input}
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
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>ยืนยันรหัสผ่าน</Text>
            <View style={styles.inputWrap}>
              <Lock size={18} color={Palette.textMuted} strokeWidth={2} />
              <TextInput
                style={styles.input}
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
          <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>สมัครสมาชิก</Text>
          </TouchableOpacity>

          {/* Login link */}
          <View style={styles.switchRow}>
            <Text style={styles.switchText}>มีบัญชีอยู่แล้ว? </Text>
            <TouchableOpacity onPress={() => router.push("/login" as any)}>
              <Text style={styles.switchLink}>เข้าสู่ระบบ</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Back button */}
        {/* <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.backBtnText}>← กลับ</Text>
        </TouchableOpacity> */}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.surfaceAlt,
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerBg: {
    height: 230,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: "hidden",
  },
  logoWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.95)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
      default: {},
    }),
  },
  appName: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 1,
  },
  appTagline: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
  },
  formCard: {
    marginHorizontal: 24,
    marginTop: -30,
    backgroundColor: Palette.surface,
    borderRadius: 24,
    padding: 28,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
      },
      android: { elevation: 8 },
      default: {},
    }),
  },
  formTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: Palette.text,
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 14,
    color: Palette.textMuted,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Palette.textSecondary,
    marginBottom: 8,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Palette.surfaceAlt,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Palette.border,
    paddingHorizontal: 14,
    height: 52,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Palette.text,
  },
  primaryBtn: {
    backgroundColor: Palette.primary,
    borderRadius: 16,
    height: 54,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: Palette.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
      default: {},
    }),
  },
  primaryBtnText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#fff",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  switchText: {
    fontSize: 14,
    color: Palette.textSecondary,
  },
  switchLink: {
    fontSize: 14,
    fontWeight: "700",
    color: Palette.primary,
  },
  backBtn: {
    alignSelf: "center",
    marginTop: 24,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: Palette.textMuted,
  },
});
