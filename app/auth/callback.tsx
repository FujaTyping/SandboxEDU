import { usePalette } from "@/hooks/use-palette";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

export default function AuthCallback() {
  const Palette = usePalette();
  const router = useRouter();

  useEffect(() => {
    router.replace("/login");
  }, [router]);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: Palette.surface,
      }}
    >
      <ActivityIndicator size="large" color={Palette.primary} />
    </View>
  );
}
