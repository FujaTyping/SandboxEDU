/**
 * Loading Skeleton Components
 * แทน ActivityIndicator ด้วย skeleton loading ที่สวยกว่า
 */

import { Palette } from "@/constants/theme";
import React, { useEffect, useRef } from "react";
import { Animated, Platform, View } from "react-native";

const cardShadow = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
  },
  android: { elevation: 3 },
  default: {},
});

/**
 * Skeleton shimmer animation
 */
function SkeletonShimmer({ children }: { children: React.ReactNode }) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View style={{ opacity }}>
      {children}
    </Animated.View>
  );
}

/**
 * Course Card Skeleton
 */
export function CourseCardSkeleton() {
  return (
    <SkeletonShimmer>
      <View
        style={cardShadow}
        className="bg-surface rounded-2xl overflow-hidden mb-3"
      >
        <View className="flex-row">
          {/* Thumbnail skeleton */}
          <View
            className="bg-edge-light"
            style={{ width: 100, height: 100 }}
          />
          
          {/* Content skeleton */}
          <View className="flex-1 p-3" style={{ gap: 8 }}>
            {/* Badge */}
            <View
              className="bg-edge-light rounded-full"
              style={{ width: 60, height: 16 }}
            />
            
            {/* Title */}
            <View
              className="bg-edge-light rounded"
              style={{ width: "90%", height: 14 }}
            />
            <View
              className="bg-edge-light rounded"
              style={{ width: "70%", height: 14 }}
            />
            
            {/* Author */}
            <View
              className="bg-edge-light rounded"
              style={{ width: 80, height: 10 }}
            />
          </View>
        </View>
      </View>
    </SkeletonShimmer>
  );
}

/**
 * Course List Skeleton
 */
export function CourseListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View className="px-6" style={{ gap: 12 }}>
      {Array.from({ length: count }).map((_, i) => (
        <CourseCardSkeleton key={i} />
      ))}
    </View>
  );
}

/**
 * Profile Skeleton
 */
export function ProfileSkeleton() {
  return (
    <SkeletonShimmer>
      <View className="items-center py-6">
        {/* Avatar */}
        <View
          className="bg-edge-light rounded-full mb-3"
          style={{ width: 80, height: 80 }}
        />
        
        {/* Name */}
        <View
          className="bg-edge-light rounded mb-2"
          style={{ width: 150, height: 20 }}
        />
        
        {/* Email */}
        <View
          className="bg-edge-light rounded"
          style={{ width: 200, height: 14 }}
        />
      </View>
    </SkeletonShimmer>
  );
}

/**
 * Stats Skeleton
 */
export function StatsSkeleton() {
  return (
    <SkeletonShimmer>
      <View className="flex-row px-6 py-4" style={{ gap: 12 }}>
        {[1, 2, 3].map((i) => (
          <View
            key={i}
            className="flex-1 bg-surface rounded-2xl p-4 items-center"
            style={cardShadow}
          >
            <View
              className="bg-edge-light rounded mb-2"
              style={{ width: 40, height: 24 }}
            />
            <View
              className="bg-edge-light rounded"
              style={{ width: 60, height: 12 }}
            />
          </View>
        ))}
      </View>
    </SkeletonShimmer>
  );
}

/**
 * Video Player Skeleton
 */
export function VideoPlayerSkeleton() {
  return (
    <SkeletonShimmer>
      <View className="bg-edge-light" style={{ width: "100%", aspectRatio: 16 / 9 }} />
    </SkeletonShimmer>
  );
}

/**
 * Generic Skeleton Box
 */
export function SkeletonBox({
  width,
  height,
  className,
}: {
  width?: number | string;
  height?: number | string;
  className?: string;
}) {
  return (
    <SkeletonShimmer>
      <View
        className={`bg-edge-light rounded ${className || ""}`}
        style={{ width, height }}
      />
    </SkeletonShimmer>
  );
}
