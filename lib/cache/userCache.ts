import AsyncStorage from "@react-native-async-storage/async-storage";

const USER_CACHE_KEY = "@sandboxedu_user_cache";

export interface CachedUser {
  name?: string;
  surname?: string;
  displayName?: string;
  avatarURL?: string;
  sclass?: number;
  room?: number;
  cachedAt: number;
}

export async function saveUserCache(user: Omit<CachedUser, "cachedAt">): Promise<void> {
  try {
    const data: CachedUser = { ...user, cachedAt: Date.now() };
    await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn("[UserCache] Failed to save:", e);
  }
}

export async function getUserCache(): Promise<CachedUser | null> {
  try {
    const json = await AsyncStorage.getItem(USER_CACHE_KEY);
    if (!json) return null;
    return JSON.parse(json) as CachedUser;
  } catch {
    return null;
  }
}

export async function clearUserCache(): Promise<void> {
  await AsyncStorage.removeItem(USER_CACHE_KEY);
}
