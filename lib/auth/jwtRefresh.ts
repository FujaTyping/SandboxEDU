/**
 * JWT Refresh Token Mechanism
 * ตรวจสอบและ refresh JWT อัตโนมัติ
 */

import { supabase } from "@/lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { clearJwt, getJwt, saveJwt } from "./token";

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
    const session = sessionData.session;
    const apiBase = process.env.EXPO_PUBLIC_API_BASE_URL;

    if (!session || !apiBase) {
      return false;
    }

    // ดึง displayName จาก Supabase user metadata
    let displayName =
      (session.user.user_metadata?.displayName as string | undefined) ?? "";

    // ถ้าไม่มี displayName ลอง refresh Supabase session ก่อน
    if (!displayName) {
      const { data: refreshedData } = await supabase.auth.refreshSession();
      displayName =
        (refreshedData.session?.user.user_metadata?.displayName as
          | string
          | undefined) ?? "";
    }

    if (!displayName) {
      return false;
    }

    // Revalidate to get new JWT — /users/revalidate ไม่ต้องการ auth header
    const revalRes = await fetch(`${apiBase}/users/revalidate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName }),
    });

    if (!revalRes.ok) {
      return false;
    }

    // รองรับทั้ง JSON {token/jwt/secret} และ plain text
    const revalText = await revalRes.text();
    let jwt: string | null = null;
    try {
      const revalData = JSON.parse(revalText);
      jwt = revalData.token ?? revalData.jwt ?? revalData.secret ?? null;
    } catch {
      jwt = revalText.trim();
    }

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
      // ไม่ clear JWT — คืน token เดิมไปก่อน แทนที่จะบังคับ logout
      return jwt;
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
