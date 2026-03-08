import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";

const getDownloadsDir = () => {
  const docDir = FileSystem.documentDirectory ?? "";
  return `${docDir}downloads/`;
};

const DOWNLOADS_INDEX_KEY = "@downloads_index";

export interface DownloadedCourse {
  id: string;
  title: string;
  localUri: string;
  thumbnailUri?: string;
  downloadedAt: number;
  size: number;
}

interface DownloadProgress {
  totalBytesWritten: number;
  totalBytesExpectedToWrite: number;
}

/**
 * Initialize downloads directory
 */
async function ensureDownloadsDirExists() {
  const dir = getDownloadsDir();
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
}

/**
 * Get all downloaded courses
 */
export async function getDownloadedCourses(): Promise<DownloadedCourse[]> {
  try {
    const indexJson = await AsyncStorage.getItem(DOWNLOADS_INDEX_KEY);
    if (!indexJson) return [];
    return JSON.parse(indexJson);
  } catch (e) {
    console.error("[DownloadManager] Failed to get downloads:", e);
    return [];
  }
}

/**
 * Check if a course is downloaded
 */
export async function isCourseDownloaded(courseId: string): Promise<boolean> {
  const downloads = await getDownloadedCourses();
  return downloads.some((d) => d.id === courseId);
}

/**
 * Get local URI for a downloaded course
 */
export async function getLocalCourseUri(
  courseId: string,
): Promise<string | null> {
  const downloads = await getDownloadedCourses();
  const course = downloads.find((d) => d.id === courseId);
  if (!course) return null;

  // Verify file still exists
  const info = await FileSystem.getInfoAsync(course.localUri);
  if (!info.exists) {
    await removeCourseFromIndex(courseId);
    return null;
  }
  return course.localUri;
}

/**
 * Download a course video
 */
export async function downloadCourse(
  courseId: string,
  courseTitle: string,
  videoUrl: string,
  thumbnailUrl?: string,
  onProgress?: (progress: number) => void,
): Promise<string> {
  await ensureDownloadsDirExists();

  const filename = `${courseId}.mp4`;
  const localUri = `${getDownloadsDir()}${filename}`;

  // Check if already downloaded
  const existing = await getLocalCourseUri(courseId);
  if (existing) {
    return existing;
  }

  // Download video
  const downloadResumable = FileSystem.createDownloadResumable(
    videoUrl,
    localUri,
    {},
    (downloadProgress: any) => {
      const progress =
        downloadProgress.totalBytesWritten /
        downloadProgress.totalBytesExpectedToWrite;
      onProgress?.(progress);
    },
  );

  const result = await downloadResumable.downloadAsync();
  if (!result) {
    throw new Error("Download failed");
  }

  // Get file size from download result
  const size = result.headers?.["content-length"]
    ? parseInt(result.headers["content-length"], 10)
    : 0;

  // Download thumbnail if provided
  let localThumbnailUri: string | undefined;
  if (thumbnailUrl) {
    const thumbFilename = `${courseId}_thumb.png`;
    const thumbUri = `${getDownloadsDir()}${thumbFilename}`;
    try {
      const thumbResult = await FileSystem.downloadAsync(
        thumbnailUrl,
        thumbUri,
      );
      localThumbnailUri = thumbResult.uri;
    } catch (e) {
      console.warn("[DownloadManager] Failed to download thumbnail:", e);
    }
  }

  // Add to index
  const downloads = await getDownloadedCourses();
  const newDownload: DownloadedCourse = {
    id: courseId,
    title: courseTitle,
    localUri: result.uri,
    thumbnailUri: localThumbnailUri,
    downloadedAt: Date.now(),
    size,
  };

  downloads.push(newDownload);
  await AsyncStorage.setItem(DOWNLOADS_INDEX_KEY, JSON.stringify(downloads));

  return result.uri;
}

/**
 * Delete a downloaded course
 */
export async function deleteCourse(courseId: string): Promise<void> {
  const downloads = await getDownloadedCourses();
  const course = downloads.find((d) => d.id === courseId);

  if (!course) return;

  // Delete video file
  try {
    await FileSystem.deleteAsync(course.localUri, { idempotent: true });
  } catch (e) {
    console.warn("[DownloadManager] Failed to delete video:", e);
  }

  // Delete thumbnail if exists
  if (course.thumbnailUri) {
    try {
      await FileSystem.deleteAsync(course.thumbnailUri, { idempotent: true });
    } catch (e) {
      console.warn("[DownloadManager] Failed to delete thumbnail:", e);
    }
  }

  // Remove from index
  await removeCourseFromIndex(courseId);
}

/**
 * Remove course from index
 */
async function removeCourseFromIndex(courseId: string): Promise<void> {
  const downloads = await getDownloadedCourses();
  const filtered = downloads.filter((d) => d.id !== courseId);
  await AsyncStorage.setItem(DOWNLOADS_INDEX_KEY, JSON.stringify(filtered));
}

/**
 * Get total size of all downloads
 */
export async function getTotalDownloadSize(): Promise<number> {
  const downloads = await getDownloadedCourses();
  return downloads.reduce((sum, d) => sum + d.size, 0);
}

/**
 * Clear all downloads
 */
export async function clearAllDownloads(): Promise<void> {
  try {
    const DOWNLOADS_DIR = getDownloadsDir();
    await FileSystem.deleteAsync(DOWNLOADS_DIR, { idempotent: true });
    await AsyncStorage.removeItem(DOWNLOADS_INDEX_KEY);
  } catch (e) {
    console.error("[DownloadManager] Failed to clear downloads:", e);
  }
}
