import { getJwtWithRefresh } from "@/lib/auth/jwtRefresh";
import { getQuizHistory, saveQuizRecord } from "@/lib/progress/quizHistory";
import {
    getAllVideoProgress,
    saveVideoProgress,
} from "@/lib/progress/videoProgress";
import AsyncStorage from "@react-native-async-storage/async-storage";

const LAST_SYNC_KEY = "@last_sync_ts";

export interface SyncPayload {
  videoProgress: Record<
    string,
    {
      currentTime: number;
      duration: number;
      percentage: number;
      lastUpdated: number;
    }
  >;
  quizHistory: Array<{
    id: string;
    courseId: string;
    courseTitle: string;
    subject?: string;
    correct: number;
    wrong: number;
    total: number;
    score: number;
    timestamp: number;
  }>;
  enrolledCourseIds: string[];
  syncedAt: number;
}

export async function getLastSyncTime(): Promise<number | null> {
  try {
    const val = await AsyncStorage.getItem(LAST_SYNC_KEY);
    return val ? Number(val) : null;
  } catch {
    return null;
  }
}

async function setLastSyncTime(ts: number): Promise<void> {
  await AsyncStorage.setItem(LAST_SYNC_KEY, String(ts));
}

/** Read all enrolled course IDs from AsyncStorage */
async function getEnrolledCourseIds(): Promise<string[]> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const enrolledKeys = allKeys.filter((k) => k.startsWith("@enrolled_"));
    const entries = await AsyncStorage.multiGet(enrolledKeys);
    return entries
      .filter(([, v]) => v === "1")
      .map(([k]) => k.replace("@enrolled_", ""));
  } catch {
    return [];
  }
}

/** Upload local data → server */
export async function uploadSync(token: string): Promise<void> {
  const apiBase = process.env.EXPO_PUBLIC_API_BASE_URL;

  const videoProgress = await getAllVideoProgress();
  const quizHistory = await getQuizHistory();
  const enrolledCourseIds = await getEnrolledCourseIds();

  const payload: SyncPayload = {
    videoProgress,
    quizHistory,
    enrolledCourseIds,
    syncedAt: Date.now(),
  };

  const res = await fetch(`${apiBase}/sync/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ data: JSON.stringify(payload) }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).message ?? `HTTP ${res.status}`);
  }
}

/** Download server data → merge into local */
export async function downloadSync(token: string): Promise<SyncPayload | null> {
  const apiBase = process.env.EXPO_PUBLIC_API_BASE_URL;

  const res = await fetch(`${apiBase}/sync/data`, {
    headers: { authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    if (res.status === 404) return null;
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).message ?? `HTTP ${res.status}`);
  }

  const raw = await res.json();
  if (!raw?.data) return null;

  try {
    return JSON.parse(raw.data) as SyncPayload;
  } catch {
    return null;
  }
}

/** Merge remote data into local (remote wins if newer) */
async function mergeRemoteData(remote: SyncPayload): Promise<void> {
  // Merge video progress
  const localProgress = await getAllVideoProgress();
  for (const [courseId, remoteP] of Object.entries(remote.videoProgress)) {
    const localP = localProgress[courseId];
    if (!localP || remoteP.lastUpdated > localP.lastUpdated) {
      await saveVideoProgress(courseId, remoteP.currentTime, remoteP.duration);
    }
  }

  // Merge quiz history
  const localHistory = await getQuizHistory();
  const localIds = new Set(localHistory.map((r) => r.id));
  for (const record of remote.quizHistory) {
    if (!localIds.has(record.id)) {
      await saveQuizRecord({
        courseId: record.courseId,
        courseTitle: record.courseTitle,
        subject: record.subject,
        correct: record.correct,
        wrong: record.wrong,
        total: record.total,
        timestamp: record.timestamp,
      });
    }
  }

  // Merge enrolled course IDs
  if (Array.isArray(remote.enrolledCourseIds)) {
    await Promise.all(
      remote.enrolledCourseIds.map((id) =>
        AsyncStorage.setItem(`@enrolled_${id}`, "1"),
      ),
    );
  }
}

export interface SyncResult {
  uploaded: boolean;
  downloaded: boolean;
  mergedVideoCount: number;
  mergedQuizCount: number;
  syncedAt: number;
}

/** Full sync: upload local → download remote → merge */
export async function performFullSync(): Promise<SyncResult> {
  const token = await getJwtWithRefresh();
  if (!token) throw new Error("กรุณาเข้าสู่ระบบก่อน sync");

  let uploaded = false;
  let downloaded = false;
  let mergedVideoCount = 0;
  let mergedQuizCount = 0;

  await uploadSync(token);
  uploaded = true;

  const remote = await downloadSync(token);
  if (remote) {
    downloaded = true;

    const localProgress = await getAllVideoProgress();
    const localHistory = await getQuizHistory();

    await mergeRemoteData(remote);

    const newProgress = await getAllVideoProgress();
    const newHistory = await getQuizHistory();
    mergedVideoCount = Math.max(
      0,
      Object.keys(newProgress).length - Object.keys(localProgress).length,
    );
    mergedQuizCount = Math.max(0, newHistory.length - localHistory.length);
  }

  const ts = Date.now();
  await setLastSyncTime(ts);

  return {
    uploaded,
    downloaded,
    mergedVideoCount,
    mergedQuizCount,
    syncedAt: ts,
  };
}
