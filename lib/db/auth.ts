/**
 * lib/db/auth.ts
 * Local auth & profile — offline-first
 *
 * Internet ถูกใช้เฉพาะใน:
 *   - loginWithServer()   → POST /auth/login
 *   - refreshProfile()    → GET  /profile
 *   - logout()            → POST /auth/logout  (optional, graceful)
 *
 * ข้อมูล profile + token ถูก cache ไว้ใน SQLite table `user_profile`
 * เพื่อให้แอพทำงานออฟไลน์ได้หลังจาก login ครั้งแรก
 */

import { openDatabase } from "../database";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LocalProfile {
  id: number;
  remote_id: string | null;
  email: string;
  name: string;
  grade: string | null;
  avatar_url: string | null;
  auth_token: string | null;
  token_expires_at: string | null;
  is_logged_in: number;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LoginResult {
  success: boolean;
  profile?: LocalProfile;
  error?: string;
  isOffline?: boolean;
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getLocalProfile(): Promise<LocalProfile | null> {
  const db = await openDatabase();
  return await db.getFirstAsync<LocalProfile>(
    `SELECT * FROM user_profile WHERE is_logged_in = 1 LIMIT 1`,
  );
}

export async function isLoggedIn(): Promise<boolean> {
  const profile = await getLocalProfile();
  return profile !== null;
}

export async function getAuthToken(): Promise<string | null> {
  const profile = await getLocalProfile();
  if (!profile?.auth_token) return null;
  if (profile.token_expires_at) {
    const exp = new Date(profile.token_expires_at).getTime();
    if (Date.now() > exp) return null; // expired
  }
  return profile.auth_token;
}

// ─── Write ────────────────────────────────────────────────────────────────────

/** บันทึก/อัปเดต profile จาก server response ลง local DB */
export async function cacheProfile(data: {
  remote_id: string;
  email: string;
  name: string;
  grade?: string;
  avatar_url?: string;
  auth_token: string;
  token_expires_at?: string;
}): Promise<LocalProfile> {
  const db = await openDatabase();

  // clear old sessions
  await db.runAsync(`UPDATE user_profile SET is_logged_in = 0`);

  await db.runAsync(
    `INSERT INTO user_profile
       (remote_id, email, name, grade, avatar_url, auth_token, token_expires_at,
        is_logged_in, last_synced_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     ON CONFLICT(remote_id) DO UPDATE SET
       email             = excluded.email,
       name              = excluded.name,
       grade             = excluded.grade,
       avatar_url        = excluded.avatar_url,
       auth_token        = excluded.auth_token,
       token_expires_at  = excluded.token_expires_at,
       is_logged_in      = 1,
       last_synced_at    = CURRENT_TIMESTAMP,
       updated_at        = CURRENT_TIMESTAMP`,
    [
      data.remote_id,
      data.email,
      data.name,
      data.grade ?? null,
      data.avatar_url ?? null,
      data.auth_token,
      data.token_expires_at ?? null,
    ],
  );

  const profile = await getLocalProfile();
  return profile!;
}

/** อัปเดตข้อมูล profile ที่แก้ offline (รอ sync) */
export async function updateLocalProfile(data: {
  name?: string;
  grade?: string;
  avatar_url?: string;
}): Promise<void> {
  const db = await openDatabase();
  const fields: string[] = ["updated_at = CURRENT_TIMESTAMP"];
  const values: (string | null)[] = [];

  if (data.name !== undefined) { fields.push("name = ?"); values.push(data.name); }
  if (data.grade !== undefined) { fields.push("grade = ?"); values.push(data.grade); }
  if (data.avatar_url !== undefined) { fields.push("avatar_url = ?"); values.push(data.avatar_url); }

  if (fields.length === 1) return; // nothing to update
  await db.runAsync(
    `UPDATE user_profile SET ${fields.join(", ")} WHERE is_logged_in = 1`,
    values,
  );
}

/** Logout: ล้าง token + flag locally, ยิง API ออนไลน์แยกต่างหาก */
export async function localLogout(): Promise<void> {
  const db = await openDatabase();
  await db.runAsync(
    `UPDATE user_profile SET
       is_logged_in = 0,
       auth_token = NULL,
       token_expires_at = NULL,
       updated_at = CURRENT_TIMESTAMP
     WHERE is_logged_in = 1`,
  );
}

// ─── Online helpers (ต้องเรียกจาก UI layer ที่มี network check) ────────────────

/**
 * loginWithServer — ติดต่อ API เพื่อ login แล้ว cache ผลลงใน SQLite
 * ถ้าออฟไลน์ จะ fallback ไปใช้ cached profile (token อาจ expire)
 *
 * @param baseUrl  - เช่น "https://api.sandboxedu.app"
 * @param email
 * @param password
 */
export async function loginWithServer(
  baseUrl: string,
  email: string,
  password: string,
): Promise<LoginResult> {
  try {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { success: false, error: (body as any).message ?? `HTTP ${res.status}` };
    }

    const body = await res.json();
    const profile = await cacheProfile({
      remote_id: body.user.id,
      email: body.user.email,
      name: body.user.name,
      grade: body.user.grade,
      avatar_url: body.user.avatar_url,
      auth_token: body.token,
      token_expires_at: body.expires_at,
    });

    return { success: true, profile };
  } catch (err: any) {
    // network error → try cached profile
    const cached = await getLocalProfile();
    if (cached) {
      return { success: true, profile: cached, isOffline: true };
    }
    return { success: false, error: "ไม่มีอินเทอร์เน็ตและไม่มีข้อมูลที่บันทึกไว้" };
  }
}

/**
 * refreshProfile — ดึง profile ล่าสุดจาก server มา cache ใหม่
 */
export async function refreshProfile(baseUrl: string): Promise<boolean> {
  const token = await getAuthToken();
  if (!token) return false;
  try {
    const res = await fetch(`${baseUrl}/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return false;
    const body = await res.json();
    await cacheProfile({
      remote_id: body.id,
      email: body.email,
      name: body.name,
      grade: body.grade,
      avatar_url: body.avatar_url,
      auth_token: token,
    });
    return true;
  } catch {
    return false;
  }
}

// ─── App Settings helpers ─────────────────────────────────────────────────────

export async function getSetting(key: string): Promise<string | null> {
  const db = await openDatabase();
  const row = await db.getFirstAsync<{ value: string }>(
    `SELECT value FROM app_settings WHERE key = ?`,
    [key],
  );
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = await openDatabase();
  await db.runAsync(
    `INSERT INTO app_settings (key, value, updated_at)
     VALUES (?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`,
    [key, value],
  );
}
