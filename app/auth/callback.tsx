import { supabase } from "@/lib/supabase";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

export default function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [status, setStatus] = useState("กำลังยืนยันอีเมล...");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log("Auth callback params:", params);

        const token_hash = params.token_hash as string | undefined;
        const token = params.token as string | undefined;
        const type = params.type as string | undefined;
        const access_token = params.access_token as string | undefined;
        const refresh_token = params.refresh_token as string | undefined;

        // Case 1: access_token + refresh_token (session-based)
        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (error) {
            setStatus("ยืนยันอีเมลไม่สำเร็จ");
            setTimeout(() => router.replace("/login"), 2000);
            return;
          }
          setStatus("ยืนยันอีเมลสำเร็จ!");
          setTimeout(() => router.replace("/(tabs)"), 1000);
          return;
        }

        // Case 2: token_hash (OTP-based — Supabase v2 default)
        const hash = token_hash ?? token;
        if (!hash || !type) {
          console.error("Missing token/token_hash or type. Params:", params);
          setStatus("ไม่พบข้อมูลการยืนยัน");
          setTimeout(() => router.replace("/login"), 2000);
          return;
        }

        const otpType =
          type === "signup"
            ? "signup"
            : type === "recovery"
              ? "recovery"
              : "email";
        const { error } = await supabase.auth.verifyOtp({
          token_hash: hash,
          type: otpType as any,
        });

        if (error) {
          console.error("Verification error:", error);
          setStatus("ยืนยันอีเมลไม่สำเร็จ: " + error.message);
          setTimeout(() => router.replace("/login"), 3000);
          return;
        }

        setStatus("ยืนยันอีเมลสำเร็จ!");
        setTimeout(() => router.replace("/(tabs)"), 1000);
      } catch (error) {
        console.error("Auth callback error:", error);
        setStatus("เกิดข้อผิดพลาด");
        setTimeout(() => router.replace("/login"), 2000);
      }
    };

    handleCallback();
  }, [params, router]);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fff",
      }}
    >
      <ActivityIndicator size="large" color="#3B82F6" />
      <Text style={{ marginTop: 16, fontSize: 14, color: "#64748B" }}>
        {status}
      </Text>
    </View>
  );
}
