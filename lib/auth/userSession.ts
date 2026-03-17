import AsyncStorage from "@react-native-async-storage/async-storage";

const CURRENT_USER_KEY = "@current_user_id";

export async function getCurrentUserId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(CURRENT_USER_KEY);
  } catch {
    return null;
  }
}

export async function setCurrentUserId(userId: string): Promise<void> {
  await AsyncStorage.setItem(CURRENT_USER_KEY, userId);
}

export async function clearCurrentUserId(): Promise<void> {
  await AsyncStorage.removeItem(CURRENT_USER_KEY);
}

/**
 * ลบเฉพาะ private user data (progress, history, enrolled, cache)
 * ไม่แตะ @downloads_index และ @saved_quiz_* เพราะเป็น offline asset ที่ยังใช้ได้
 */
export async function clearPrivateUserData(): Promise<void> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const toRemove = allKeys.filter(
      (k) =>
        k.startsWith("@video_progress") ||
        k.startsWith("@quiz_history") ||
        k.startsWith("@enrolled_") ||
        k.startsWith("@last_sync_ts") ||
        k.startsWith("@sandboxedu_user_cache"),
    );
    if (toRemove.length > 0) {
      await AsyncStorage.multiRemove(toRemove);
    }
  } catch (e) {
    console.warn("[UserSession] Failed to clear private data:", e);
  }
}

/**
 * เรียกตอน logout — sync ก่อน (best-effort) แล้วค่อย clear private data
 * downloads และ saved quizzes ยังคงอยู่สำหรับ user ถัดไปบนอุปกรณ์เดิม
 */
export async function syncThenClearPrivate(): Promise<void> {
  try {
    const { performFullSync } = await import("@/lib/sync/syncManager");
    await performFullSync();
  } catch {
    /* best-effort — ถ้า sync ไม่สำเร็จ (offline) ก็ยังต้อง logout ได้ */
  }
  await clearPrivateUserData();
}

/**
 * เรียกตอน login — ถ้า userId เปลี่ยน (user คนใหม่) ให้ clear private data เก่าก่อน
 */
export async function handleUserLogin(newUserId: string): Promise<boolean> {
  const prevUserId = await getCurrentUserId();
  const isNewUser = prevUserId !== null && prevUserId !== newUserId;

  if (isNewUser) {
    await clearPrivateUserData();
  }

  await setCurrentUserId(newUserId);
  return isNewUser;
}
