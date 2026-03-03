import { Palette } from "@/constants/theme";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
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
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 30, paddingTop: insets.top + 16 }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>บทเรียน</Text>
      <Text style={styles.subtitle}>เลือกวิชาที่ต้องการเรียน</Text>

      {loading ? (
        <View style={styles.grid}>
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <Animated.View
              key={item}
              style={[styles.skeletonCard, { opacity: fadeAnim }]}
            />
          ))}
        </View>
      ) : (
        <View style={styles.grid}>
          {data?.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.card}
              activeOpacity={0.8}
              onPress={() => {
                // router.push(`/subject/${item.id}`);
              }}
            >
              <Image
                source={{ uri: item.thumbnailURL }}
                style={styles.cardImage}
              />
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <View style={styles.cardFooter}>
                  <Text style={styles.cardSubject}>{item.subject}</Text>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>ม.{item.class}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/*
      {mockSubjects.map((subject, idx) => (
        <TouchableOpacity
          key={subject.id}
          style={[
            styles.subjectCard,
            {
              backgroundColor:
                Palette.subjectCards[idx % Palette.subjectCards.length],
            },
          ]}
          activeOpacity={0.85}
          onPress={() => router.push(`/subject/${subject.id}` as any)}
        >
          <View style={styles.cardContent}>
            <View
              style={[
                styles.subjectIcon,
                { backgroundColor: "rgba(255,255,255,0.15)" },
              ]}
            >
              {(() => {
                const IconComponent = (LucideIcons as any)[subject.icon];
                return IconComponent ? (
                  <IconComponent size={28} color="#fff" strokeWidth={2} />
                ) : null;
              })()}
            </View>
            <View style={styles.cardRight}>
              <View style={styles.cardHeader}>
                <Text style={styles.subjectName}>{subject.name}</Text>
                <Text style={styles.progressPercent}>{subject.progress}%</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${subject.progress}%`,
                      backgroundColor: subject.color,
                    },
                  ]}
                />
              </View>
            </View>
            <View style={styles.arrowWrap}>
              <Text style={styles.arrowIcon}>›</Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}
      */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.surfaceAlt,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: Palette.text,
    paddingHorizontal: 24,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: Palette.textMuted,
    paddingHorizontal: 24,
    marginTop: 4,
    marginBottom: 20,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: PADDING,
    gap: GAP,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: Palette.surface,
    borderRadius: 20,
    marginBottom: 8,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
      default: {},
    }),
  },
  cardImage: {
    width: "100%",
    height: 170,
    objectFit: "cover",
    backgroundColor: Palette.borderLight,
  },
  cardContent: {
    padding: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Palette.text,
    marginBottom: 8,
    height: 40,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardSubject: {
    fontSize: 16,
    color: Palette.textMuted,
  },
  badge: {
    backgroundColor: Palette.primaryBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: "700",
    color: Palette.primary,
  },
  skeletonCard: {
    width: CARD_WIDTH,
    height: 190,
    backgroundColor: "#E2E8F0",
    borderRadius: 20,
    marginBottom: 8,
  },
});
