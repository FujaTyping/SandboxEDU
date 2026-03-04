import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const GAP = 16;
const PADDING = 24;
const CARD_WIDTH = (width - PADDING * 2 - GAP) / 2;

export default function LearnScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (loading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 0.3,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    }
  }, [loading]);

  useEffect(() => {
    fetch(`https://sapindboxedu.siraphop.me/courses/all`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch((error) => console.error("Fetch error:", error));
  }, []);

  return (
    <ScrollView
      className="flex-1 bg-surface-alt"
      contentContainerStyle={{ paddingBottom: 30, paddingTop: insets.top + 16 }}
      showsVerticalScrollIndicator={false}
    >
      <Text className="text-[28px] font-extrabold text-brand-text px-6 tracking-wide">
        บทเรียน
      </Text>
      <Text className="text-sm text-brand-muted px-6 mt-1 mb-5">
        เลือกวิชาที่ต้องการเรียน
      </Text>

      {loading ? (
        <View className="flex-row flex-wrap px-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <Animated.View
              key={item}
              style={[
                {
                  width: CARD_WIDTH,
                  height: 190,
                  backgroundColor: "#E2E8F0",
                  borderRadius: 20,
                  marginBottom: 8,
                  opacity: fadeAnim,
                },
              ]}
            />
          ))}
        </View>
      ) : (
        <View className="flex-row flex-wrap px-6 gap-4">
          {data?.map((item, index) => (
            <TouchableOpacity
              key={index}
              className="bg-surface rounded-2xl mb-2 overflow-hidden shadow-sm"
              style={{ width: CARD_WIDTH }}
              activeOpacity={0.8}
              onPress={() => {
                // router.push(`/subject/${item.id}`);
              }}
            >
              <Image
                source={{ uri: item.thumbnailURL }}
                className="w-full h-[170px] bg-edge-light"
                resizeMode="cover"
              />
              <View className="p-3">
                <Text
                  className="text-sm font-bold text-brand-text mb-2 h-10"
                  numberOfLines={2}
                >
                  {item.title}
                </Text>
                <View className="flex-row justify-between items-center">
                  <Text className="text-base text-brand-muted">
                    {item.subject}
                  </Text>
                  <View className="bg-primary-bg px-2 py-0.5 rounded-md">
                    <Text className="text-sm font-bold text-primary">
                      ม.{item.class}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
