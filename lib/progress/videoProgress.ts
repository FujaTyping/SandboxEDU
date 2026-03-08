import AsyncStorage from '@react-native-async-storage/async-storage';

const PROGRESS_KEY = '@video_progress';

export interface VideoProgress {
  courseId: string;
  currentTime: number;
  duration: number;
  percentage: number;
  lastUpdated: number;
}

/**
 * Get all video progress
 */
async function getAllProgress(): Promise<Record<string, VideoProgress>> {
  try {
    const json = await AsyncStorage.getItem(PROGRESS_KEY);
    if (!json) return {};
    return JSON.parse(json);
  } catch (e) {
    console.error('[VideoProgress] Failed to get progress:', e);
    return {};
  }
}

/**
 * Save video progress
 */
export async function saveVideoProgress(
  courseId: string,
  currentTime: number,
  duration: number
): Promise<void> {
  try {
    const percentage = duration > 0 ? (currentTime / duration) * 100 : 0;
    
    const allProgress = await getAllProgress();
    allProgress[courseId] = {
      courseId,
      currentTime,
      duration,
      percentage,
      lastUpdated: Date.now(),
    };

    await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(allProgress));
  } catch (e) {
    console.error('[VideoProgress] Failed to save progress:', e);
  }
}

/**
 * Get progress for a specific course
 */
export async function getVideoProgress(courseId: string): Promise<VideoProgress | null> {
  try {
    const allProgress = await getAllProgress();
    return allProgress[courseId] || null;
  } catch (e) {
    console.error('[VideoProgress] Failed to get course progress:', e);
    return null;
  }
}

/**
 * Clear progress for a specific course
 */
export async function clearVideoProgress(courseId: string): Promise<void> {
  try {
    const allProgress = await getAllProgress();
    delete allProgress[courseId];
    await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(allProgress));
  } catch (e) {
    console.error('[VideoProgress] Failed to clear progress:', e);
  }
}

/**
 * Check if video is completed (watched > 90%)
 */
export async function isVideoCompleted(courseId: string): Promise<boolean> {
  const progress = await getVideoProgress(courseId);
  return progress ? progress.percentage >= 90 : false;
}

/**
 * Get formatted progress text
 */
export function formatProgress(progress: VideoProgress): string {
  return `${Math.round(progress.percentage)}%`;
}

/**
 * Get formatted time
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
