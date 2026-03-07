import AsyncStorage from "@react-native-async-storage/async-storage";

const JWT_KEY = "@sandboxedu_jwt";

export async function saveJwt(token: string): Promise<void> {
  await AsyncStorage.setItem(JWT_KEY, token);
}

export async function getJwt(): Promise<string | null> {
  return AsyncStorage.getItem(JWT_KEY);
}

export async function clearJwt(): Promise<void> {
  await AsyncStorage.removeItem(JWT_KEY);
}
