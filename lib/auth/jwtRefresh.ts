/**
 * JWT Refresh Token Mechanism
 * ตรวจสอบและ refresh JWT อัตโนมัติ
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { saveJwt, getJwt, clearJwt } from "./token";
import { supabase } from "@/lib/supabase";

const JWT_EXPIRY_KEY = "@sandboxedu_jwt_expiry";
const REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes before expiry

/**
 * Decode JWT and get expiry time
 */
function decodeJwtExpiry(token: string): number | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payload = JSON.parse(atob(parts[1]));
    return payload.exp ? payload.exp * 1000 : null; // Convert to milliseconds
  } catch {
    return null;
  }
}

/**
 * Save JWT with expiry time
 */
export async function saveJwtWithExpiry(token: string): Promise<void> {
  await saveJwt(token);
  const expiry = decodeJwtExpiry(token);
  if (expiry) {
    await AsyncStorage.setItem(JWT_EXPIRY_KEY, expiry.toString());
  }
}

/**
 * Check if JWT is expired or about to expire
 */
export async function isJwtExpired(): Promise<boolean> {
  const expiryStr = await AsyncStorage.getItem(JWT_EXPIRY_KEY);
  if (!expiryStr) return true;

  const expiry = parseInt(expiryStr, 10);
  const now = Date.now();

  return now >= expiry - REFRESH_THRESHOLD;
}

/**
 * Refresh JWT token
 */
export async function refreshJwt(): Promise<boolean> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    const apiBase = process.env.EXPO_PUBLIC_API_BASE_URL;

    if (!accessToken || !apiBase) {
      return false;
    }

    // Get user info
    const userRes = await fetch(`${apiBase}/users/get`, {
      headers: { authorization: `Bearer ${accessToken}` },
    });

    if (!userRes.ok) {
      return false;
    }

    const userData = await userRes.json();
    const displayName = userData.displayName ?? userData.name;

    if (!displayName) {
      return false;
    }

    // Revalidate to get new JWT
    const revalRes = await fetch(`${apiBase}/users/revalidate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName }),
    });

    if (!revalRes.ok) {
      return false;
    }

    const revalData = await revalRes.json();
    const jwt = revalData.token ?? revalData.jwt ?? revalData.secret;

    if (!jwt) {
      return false;
    }

    await saveJwtWithExpiry(jwt);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get JWT with auto-refresh
 */
export async function getJwtWithRefresh(): Promise<string | null> {
  const jwt = await getJwt();
  if (!jwt) return null;

  const expired = await isJwtExpired();
  if (expired) {
    const refreshed = await refreshJwt();
    if (!refreshed) {
      await clearJwt();
      return null;
    }
    return getJwt();
  }

  return jwt;
}

/**
 * Clear JWT and expiry
 */
export async function clearJwtWithExpiry(): Promise<void> {
  await clearJwt();
  await AsyncStorage.removeItem(JWT_EXPIRY_KEY);
}
