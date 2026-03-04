import { Palette } from "@/constants/theme";
import {
    DownloadedVideo,
    getVideoById,
    getVideosBySubject,
    updateWatchProgress,
} from "@/lib/db/downloads";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
    ArrowLeft,
    ClipboardList,
    Gauge,
    Maximize2,
    Pause,
    Play,
    SkipBack,
    SkipForward,
} from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
    Dimensions,
    Image,
    Platform,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: W, height: H } = Dimensions.get("window");

const subjectColorMap: Record<string, string> = {
  math: "#3B82F6",
  physics: "#10B981",
  thai: "#EC4899",
  social: "#F59E0B",
  english: "#8B5CF6",
};

const gradeNameMap: Record<string, string> = {
  m1: "ม.1",
  m2: "ม.2",
  m3: "ม.3",
  m4: "ม.4",
  m5: "ม.5",
  m6: "ม.6",
};

const SPEEDS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

const cardShadow = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  android: { elevation: 4 },
  default: {},
});

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function PlayerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [video, setVideo] = useState<DownloadedVideo | null>(null);
  const [playlist, setPlaylist] = useState<DownloadedVideo[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0-100
  const [currentTime, setCurrentTime] = useState(0);
  const [speed, setSpeed] = useState(1.0);
  const [showSpeedPicker, setShowSpeedPicker] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load video + playlist
  useEffect(() => {
    if (!id) return;
    getVideoById(id).then(async (v) => {
      if (!v) return;
      setVideo(v);
      setProgress(v.watch_progress ?? 0);
      setCurrentTime(((v.watch_progress ?? 0) / 100) * (v.duration ?? 0));

      const list = await getVideosBySubject(v.subject_id);
      const filtered = list.filter((x) => x.grade === v.grade);
      setPlaylist(filtered);
      setCurrentIndex(filtered.findIndex((x) => x.video_id === id));
    });
  }, [id]);

  // Simulate playback
  useEffect(() => {
    if (isPlaying && video) {
      intervalRef.current = setInterval(() => {
        setCurrentTime((t) => {
          const duration = video.duration ?? 300;
          const newT = Math.min(t + speed, duration);
          const newProgress = Math.round((newT / duration) * 100);
          setProgress(newProgress);
          if (newT >= duration) {
            setIsPlaying(false);
            updateWatchProgress(video.video_id, 100);
          }
          return newT;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, speed, video]);

  // Save progress on pause
  useEffect(() => {
    if (!isPlaying && video && progress > 0) {
      updateWatchProgress(video.video_id, progress);
    }
  }, [isPlaying]);

  const handlePlayPause = () => setIsPlaying((p) => !p);

  const handleSeek = (delta: number) => {
    if (!video) return;
    const duration = video.duration ?? 300;
    const newT = Math.max(0, Math.min(currentTime + delta, duration));
    const newP = Math.round((newT / duration) * 100);
    setCurrentTime(newT);
    setProgress(newP);
    updateWatchProgress(video.video_id, newP);
  };

  const handlePlaylistSelect = (v: DownloadedVideo, idx: number) => {
    setVideo(v);
    setCurrentIndex(idx);
    setProgress(v.watch_progress ?? 0);
    setCurrentTime(((v.watch_progress ?? 0) / 100) * (v.duration ?? 0));
    setIsPlaying(false);
  };

  const toggleLandscape = () => setIsLandscape((l) => !l);

  const accentColor =
    subjectColorMap[video?.subject_id ?? ""] ?? Palette.primary;
  const duration = video?.duration ?? 300;

  // ─── LANDSCAPE fullscreen player ───────────────────────────────────────────
  if (isLandscape) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar hidden />
        <View style={{ flex: 1, backgroundColor: "#000" }}>
          {/* Video area */}
          <View
            style={{
              width: W,
              height: H,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {video?.thumbnail_url ? (
              <Image
                source={{ uri: video.thumbnail_url }}
                style={{ width: W, height: H }}
                resizeMode="contain"
              />
            ) : (
              <View
                style={{
                  width: W,
                  height: H,
                  backgroundColor: "#111",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Play size={64} color="white" strokeWidth={1.5} />
              </View>
            )}

            {/* Overlay controls */}
            <View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                justifyContent: "space-between",
              }}
            >
              {/* Top bar */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 16,
                  paddingTop: 20,
                }}
              >
                <TouchableOpacity
                  onPress={toggleLandscape}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: "rgba(0,0,0,0.5)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Maximize2 size={18} color="white" strokeWidth={2.5} />
                </TouchableOpacity>
                <Text
                  style={{
                    color: "white",
                    fontWeight: "bold",
                    fontSize: 14,
                    marginLeft: 12,
                    flex: 1,
                  }}
                  numberOfLines={1}
                >
                  {video?.title}
                </Text>
                {/* Speed button */}
                <TouchableOpacity
                  onPress={() => setShowSpeedPicker((s) => !s)}
                  style={{
                    backgroundColor: "rgba(255,255,255,0.2)",
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 16,
                  }}
                >
                  <Text
                    style={{ color: "white", fontWeight: "bold", fontSize: 12 }}
                  >
                    {speed}x
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Center play controls */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 32,
                }}
              >
                <TouchableOpacity onPress={() => handleSeek(-10)}>
                  <SkipBack size={32} color="white" strokeWidth={2} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handlePlayPause}
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    backgroundColor: "rgba(255,255,255,0.25)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {isPlaying ? (
                    <Pause
                      size={30}
                      color="white"
                      strokeWidth={2}
                      fill="white"
                    />
                  ) : (
                    <Play
                      size={30}
                      color="white"
                      strokeWidth={2}
                      fill="white"
                    />
                  )}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleSeek(10)}>
                  <SkipForward size={32} color="white" strokeWidth={2} />
                </TouchableOpacity>
              </View>

              {/* Bottom seek bar */}
              <View style={{ padding: 16, paddingBottom: 24 }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 6,
                  }}
                >
                  <Text
                    style={{ color: "rgba(255,255,255,0.7)", fontSize: 11 }}
                  >
                    {formatTime(currentTime)}
                  </Text>
                  <Text
                    style={{ color: "rgba(255,255,255,0.7)", fontSize: 11 }}
                  >
                    {formatTime(duration)}
                  </Text>
                </View>
                <View
                  style={{
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: "rgba(255,255,255,0.3)",
                  }}
                >
                  <View
                    style={{
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: "white",
                      width: `${progress}%`,
                    }}
                  />
                </View>
              </View>
            </View>

            {/* Speed picker popup */}
            {showSpeedPicker && (
              <View
                style={{
                  position: "absolute",
                  top: 56,
                  right: 16,
                  backgroundColor: "#1a1a2e",
                  borderRadius: 16,
                  padding: 8,
                  minWidth: 120,
                  zIndex: 100,
                }}
              >
                {SPEEDS.map((s) => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => {
                      setSpeed(s);
                      setShowSpeedPicker(false);
                    }}
                    style={{
                      paddingVertical: 8,
                      paddingHorizontal: 16,
                      borderRadius: 10,
                      backgroundColor:
                        speed === s ? accentColor : "transparent",
                    }}
                  >
                    <Text
                      style={{
                        color: "white",
                        fontWeight: speed === s ? "900" : "400",
                        textAlign: "center",
                      }}
                    >
                      {s}x
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
      </>
    );
  }

  // ─── PORTRAIT layout ───────────────────────────────────────────────────────
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-surface-alt">
        {/* Video player (portrait) */}
        <View
          style={{ backgroundColor: "#000", width: W, height: W * (9 / 16) }}
        >
          {video?.thumbnail_url ? (
            <Image
              source={{ uri: video.thumbnail_url }}
              style={{ width: W, height: W * (9 / 16) }}
              resizeMode="cover"
            />
          ) : (
            <View
              style={{
                width: W,
                height: W * (9 / 16),
                backgroundColor: "#111",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Play size={48} color="white" strokeWidth={1.5} />
            </View>
          )}

          {/* Overlay */}
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.35)",
            }}
          >
            {/* Top bar */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 14,
                paddingTop: insets.top + 6,
              }}
            >
              <TouchableOpacity
                onPress={() => router.back()}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  backgroundColor: "rgba(0,0,0,0.45)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ArrowLeft size={16} color="white" strokeWidth={2.5} />
              </TouchableOpacity>
              <Text
                style={{
                  color: "white",
                  fontWeight: "700",
                  fontSize: 13,
                  marginLeft: 10,
                  flex: 1,
                }}
                numberOfLines={1}
              >
                {video?.title ?? "กำลังโหลด..."}
              </Text>
              {/* Speed */}
              <TouchableOpacity
                onPress={() => setShowSpeedPicker((s) => !s)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "rgba(255,255,255,0.2)",
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 14,
                  marginRight: 8,
                }}
              >
                <Gauge size={12} color="white" strokeWidth={2} />
                <Text
                  style={{
                    color: "white",
                    fontWeight: "700",
                    fontSize: 11,
                    marginLeft: 4,
                  }}
                >
                  {speed}x
                </Text>
              </TouchableOpacity>
              {/* Fullscreen */}
              <TouchableOpacity
                onPress={toggleLandscape}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  backgroundColor: "rgba(0,0,0,0.45)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Maximize2 size={15} color="white" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            {/* Center controls */}
            <View
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 24,
              }}
            >
              <TouchableOpacity onPress={() => handleSeek(-10)}>
                <SkipBack size={26} color="white" strokeWidth={2} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handlePlayPause}
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  backgroundColor: "rgba(255,255,255,0.25)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {isPlaying ? (
                  <Pause size={24} color="white" strokeWidth={2} fill="white" />
                ) : (
                  <Play size={24} color="white" strokeWidth={2} fill="white" />
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleSeek(10)}>
                <SkipForward size={26} color="white" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            {/* Seek bar */}
            <View style={{ paddingHorizontal: 14, paddingBottom: 10 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 4,
                }}
              >
                <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 10 }}>
                  {formatTime(currentTime)}
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 10 }}>
                  {formatTime(duration)}
                </Text>
              </View>
              <View
                style={{
                  height: 3,
                  borderRadius: 2,
                  backgroundColor: "rgba(255,255,255,0.3)",
                }}
              >
                <View
                  style={{
                    height: 3,
                    borderRadius: 2,
                    backgroundColor: "white",
                    width: `${progress}%`,
                  }}
                />
              </View>
            </View>
          </View>

          {/* Speed picker */}
          {showSpeedPicker && (
            <View
              style={{
                position: "absolute",
                top: insets.top + 42,
                right: 56,
                backgroundColor: "#1a1a2e",
                borderRadius: 14,
                padding: 6,
                zIndex: 999,
                minWidth: 100,
              }}
            >
              {SPEEDS.map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => {
                    setSpeed(s);
                    setShowSpeedPicker(false);
                  }}
                  style={{
                    paddingVertical: 7,
                    paddingHorizontal: 14,
                    borderRadius: 8,
                    backgroundColor: speed === s ? accentColor : "transparent",
                  }}
                >
                  <Text
                    style={{
                      color: "white",
                      fontWeight: speed === s ? "900" : "400",
                      textAlign: "center",
                      fontSize: 13,
                    }}
                  >
                    {s}x
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Body — YouTube-like */}
        <ScrollView
          style={{ flex: 1, backgroundColor: "#f8f9fa" }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          {/* Title + meta */}
          <View
            style={{
              paddingHorizontal: 16,
              paddingTop: 12,
              paddingBottom: 10,
              backgroundColor: "white",
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "800",
                color: "#0f0f0f",
                lineHeight: 22,
              }}
              numberOfLines={2}
            >
              {video?.title}
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 6,
                gap: 8,
              }}
            >
              <View
                style={{
                  backgroundColor: accentColor,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 99,
                }}
              >
                <Text
                  style={{ color: "white", fontSize: 10, fontWeight: "700" }}
                >
                  {gradeNameMap[video?.grade ?? ""] ?? video?.grade}
                </Text>
              </View>
              <Text style={{ fontSize: 12, color: "#606060" }}>
                {video?.subject_name}
              </Text>
              {video?.duration ? (
                <Text style={{ fontSize: 12, color: "#606060" }}>
                  · {formatTime(video.duration)}
                </Text>
              ) : null}
              <View style={{ flex: 1 }} />
              <Text style={{ fontSize: 11, color: "#606060" }}>
                {currentIndex + 1}/{playlist.length}
              </Text>
            </View>
          </View>

          {/* Divider */}
          <View style={{ height: 8 }} />

          {/* Playlist header */}
          <View
            style={{
              backgroundColor: "white",
              paddingHorizontal: 16,
              paddingTop: 12,
              paddingBottom: 4,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: "800", color: "#0f0f0f" }}>
              รายการถัดไป
            </Text>
          </View>

          {/* Playlist items */}
          {playlist.map((v, idx) => {
            const isCurrent = v.video_id === video?.video_id;
            const p = v.watch_progress ?? 0;
            const done = p >= 90;
            return (
              <TouchableOpacity
                key={v.video_id}
                onPress={() => handlePlaylistSelect(v, idx)}
                style={[
                  {
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    backgroundColor: isCurrent ? accentColor + "10" : "white",
                    borderLeftWidth: isCurrent ? 3 : 0,
                    borderLeftColor: accentColor,
                  },
                ]}
                activeOpacity={0.75}
              >
                {/* Thumbnail */}
                <View
                  style={{
                    width: 120,
                    height: 68,
                    borderRadius: 8,
                    overflow: "hidden",
                    backgroundColor: "#e0e0e0",
                    marginRight: 12,
                    position: "relative",
                  }}
                >
                  {v.thumbnail_url ? (
                    <Image
                      source={{ uri: v.thumbnail_url }}
                      style={{ width: 120, height: 68 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={{
                        flex: 1,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: accentColor + "15",
                      }}
                    >
                      <Play size={20} color={accentColor} strokeWidth={2} />
                    </View>
                  )}
                  {/* Dark overlay + play/pause */}
                  <View
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: isCurrent
                        ? "rgba(0,0,0,0.45)"
                        : "rgba(0,0,0,0.15)",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {isCurrent && isPlaying ? (
                      <Pause
                        size={18}
                        color="white"
                        strokeWidth={2}
                        fill="white"
                      />
                    ) : (
                      <Play
                        size={18}
                        color="white"
                        strokeWidth={2}
                        fill="white"
                      />
                    )}
                  </View>
                  {/* Duration badge */}
                  {v.duration ? (
                    <View
                      style={{
                        position: "absolute",
                        bottom: 4,
                        right: 4,
                        backgroundColor: "rgba(0,0,0,0.75)",
                        borderRadius: 3,
                        paddingHorizontal: 4,
                        paddingVertical: 1,
                      }}
                    >
                      <Text
                        style={{
                          color: "white",
                          fontSize: 9,
                          fontWeight: "600",
                        }}
                      >
                        {formatTime(v.duration)}
                      </Text>
                    </View>
                  ) : null}
                  {/* Done check */}
                  {done && (
                    <View
                      style={{
                        position: "absolute",
                        top: 4,
                        left: 4,
                        width: 18,
                        height: 18,
                        borderRadius: 9,
                        backgroundColor: "#10B981",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text
                        style={{
                          color: "white",
                          fontSize: 9,
                          fontWeight: "900",
                        }}
                      >
                        ✓
                      </Text>
                    </View>
                  )}
                </View>

                {/* Info */}
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: isCurrent ? "800" : "600",
                      color: isCurrent ? accentColor : "#0f0f0f",
                      lineHeight: 18,
                    }}
                    numberOfLines={2}
                  >
                    {v.title}
                  </Text>
                  <Text
                    style={{ fontSize: 11, color: "#606060", marginTop: 4 }}
                  >
                    {v.subject_name}
                  </Text>
                  {/* thin progress bar */}
                  {p > 0 && (
                    <View
                      style={{
                        height: 2,
                        borderRadius: 1,
                        backgroundColor: "#e0e0e0",
                        marginTop: 6,
                        overflow: "hidden",
                      }}
                    >
                      <View
                        style={{
                          height: 2,
                          borderRadius: 1,
                          backgroundColor: done ? "#10B981" : accentColor,
                          width: `${p}%`,
                        }}
                      />
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}

          {/* Divider */}
          <View
            style={{
              height: 1,
              backgroundColor: "#e0e0e0",
              marginHorizontal: 16,
              marginVertical: 4,
            }}
          />

          {/* Exam card — last item */}
          <TouchableOpacity
            onPress={() =>
              router.push(`/exam/${video?.subject_id}-${video?.grade}` as any)
            }
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingVertical: 10,
              backgroundColor: "white",
            }}
            activeOpacity={0.75}
          >
            {/* Exam thumbnail-like box */}
            <View
              style={{
                width: 120,
                height: 68,
                borderRadius: 8,
                overflow: "hidden",
                marginRight: 12,
                backgroundColor: accentColor + "15",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              }}
            >
              <ClipboardList size={28} color={accentColor} strokeWidth={1.5} />
              {/* badge */}
              <View
                style={{
                  position: "absolute",
                  bottom: 4,
                  right: 4,
                  backgroundColor: accentColor,
                  borderRadius: 3,
                  paddingHorizontal: 5,
                  paddingVertical: 2,
                }}
              >
                <Text
                  style={{ color: "white", fontSize: 9, fontWeight: "700" }}
                >
                  แบบทดสอบ
                </Text>
              </View>
            </View>

            {/* Info */}
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "700",
                  color: "#0f0f0f",
                  lineHeight: 18,
                }}
                numberOfLines={2}
              >
                แบบทดสอบ{video?.subject_name}
              </Text>
              <Text style={{ fontSize: 11, color: "#606060", marginTop: 3 }}>
                {gradeNameMap[video?.grade ?? ""] ?? video?.grade} ·
                ทดสอบความเข้าใจ
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: 5,
                  gap: 6,
                }}
              >
                <View
                  style={{
                    backgroundColor: accentColor + "18",
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 4,
                  }}
                >
                  <Text
                    style={{
                      color: accentColor,
                      fontSize: 10,
                      fontWeight: "700",
                    }}
                  >
                    เริ่มทำเลย
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </>
  );
}
