/**
 * lib/db/sync.ts
 * Offline-first Sync System
 *
 * การทำงาน:
 *   1. ทุก action ที่ควรขึ้น server (ผลสอบ, progress, profile update)
 *      จะถูก enqueue ลงใน `sync_queue` ก่อน
 *   2. เมื่อมีอินเทอร์เน็ต ให้เรียก runSync() เพื่อ flush queue
 *   3. รองรับ retry สูงสุด MAX_RETRY ครั้ง ก่อน mark failed
 */

import { getAuthToken } from "./auth";
import { openDatabase } from "../database";

const MAX_RETRY = 3;

// ─── Types ────────────────────────────────────────────────────────────────────

export type SyncEventType =
  | "exam_result"      // ผลสอบ
  | "watch_progress"   // ความคืบหน้าการดูวิดีโอ
  | "profile_update"   // แก้ข้อมูล profile
  | "study_session";   // สรุปเวลาเรียน

export interface SyncQueueItem {
  id: number;
  event_type: SyncEventType;
  payload_json: string;
  status: "pending" | "syncing" | "done" | "failed";
  retry_count: number;
  last_error: string | null;
  created_at: string;
  synced_at: string | null;
}

export interface SyncResult {
  pushed: number;
  failed: number;
  pending: number;
}

// ─── Enqueue ──────────────────────────────────────────────────────────────────

/** เพิ่ม event เข้า queue (ไม่ต้องการ internet ณ ตอนนี้) */
export async function enqueue(
  event_type: SyncEventType,
  payload: Record<string, unknown>,
): Promise<void> {
  const db = await openDatabase();
  await db.runAsync(
    `INSERT INTO sync_queue (event_type, payload_json, status)
     VALUES (?, ?, 'pending')`,
    [event_type, JSON.stringify(payload)],
  );
}

/** Shortcut: บันทึกผลสอบ offline */
export async function enqueueExamResult(data: {
  exam_id: string;
  subject_id: string;
  grade: string;
  score: number;
  total_questions: number;
  correct_count: number;
  time_spent_sec: number;
  answers: Record<string, string>;
  passed: boolean;
}): Promise<void> {
  const db = await openDatabase();

  // บันทึกลง offline_exam_results ด้วย
  await db.runAsync(
    `INSERT INTO offline_exam_results
       (exam_id, subject_id, grade, score, total_questions, correct_count,
        time_spent_sec, answers_json, passed, synced)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    [
      data.exam_id,
      data.subject_id,
      data.grade,
      data.score,
      data.total_questions,
      data.correct_count,
      data.time_spent_sec,
      JSON.stringify(data.answers),
      data.passed ? 1 : 0,
    ],
  );

  // เพิ่มเข้า sync queue
  await enqueue("exam_result", { ...data, taken_at: new Date().toISOString() });
}

/** Shortcut: บันทึก watch progress offline */
export async function enqueueWatchProgress(
  video_id: string,
  progress: number,
  time_spent_sec: number,
): Promise<void> {
  await enqueue("watch_progress", {
    video_id,
    progress,
    time_spent_sec,
    recorded_at: new Date().toISOString(),
  });
}

/** Shortcut: บันทึกการอัปเดต profile */
export async function enqueueProfileUpdate(data: {
  name?: string;
  grade?: string;
  avatar_url?: string;
}): Promise<void> {
  await enqueue("profile_update", {
    ...data,
    updated_at: new Date().toISOString(),
  });
}

// ─── Read Queue ───────────────────────────────────────────────────────────────

export async function getPendingCount(): Promise<number> {
  const db = await openDatabase();
  const row = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM sync_queue WHERE status IN ('pending','failed') AND retry_count < ?`,
    [MAX_RETRY],
  );
  return row?.count ?? 0;
}

export async function getSyncQueueSummary(): Promise<{
  pending: number;
  syncing: number;
  done: number;
  failed: number;
}> {
  const db = await openDatabase();
  const rows = await db.getAllAsync<{ status: string; count: number }>(
    `SELECT status, COUNT(*) as count FROM sync_queue GROUP BY status`,
  );
  const map: Record<string, number> = {};
  rows.forEach((r) => { map[r.status] = r.count; });
  return {
    pending: map["pending"] ?? 0,
    syncing: map["syncing"] ?? 0,
    done: map["done"] ?? 0,
    failed: map["failed"] ?? 0,
  };
}

export async function getOfflineExamResults(options?: { synced?: boolean }) {
  const db = await openDatabase();
  const whereClause =
    options?.synced !== undefined ? `WHERE synced = ${options.synced ? 1 : 0}` : "";
  return await db.getAllAsync(
    `SELECT * FROM offline_exam_results ${whereClause} ORDER BY taken_at DESC`,
  );
}

// ─── Sync Runner ──────────────────────────────────────────────────────────────

/**
 * runSync — flush pending queue ขึ้น server
 * เรียกจาก UI เมื่อตรวจพบว่ามีอินเทอร์เน็ต
 *
 * @param baseUrl  - เช่น "https://api.sandboxedu.app"
 */
export async function runSync(baseUrl: string): Promise<SyncResult> {
  const db = await openDatabase();
  const token = await getAuthToken();

  const result: SyncResult = { pushed: 0, failed: 0, pending: 0 };

  if (!token) {
    result.pending = await getPendingCount();
    return result;
  }

  // ดึง items ที่ยังค้างอยู่
  const items = await db.getAllAsync<SyncQueueItem>(
    `SELECT * FROM sync_queue
     WHERE status IN ('pending','failed') AND retry_count < ?
     ORDER BY created_at ASC`,
    [MAX_RETRY],
  );

  for (const item of items) {
    // mark syncing
    await db.runAsync(
      `UPDATE sync_queue SET status = 'syncing' WHERE id = ?`,
      [item.id],
    );

    try {
      const endpoint = resolveEndpoint(baseUrl, item.event_type);
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: item.payload_json,
      });

      if (res.ok) {
        await db.runAsync(
          `UPDATE sync_queue SET status = 'done', synced_at = CURRENT_TIMESTAMP WHERE id = ?`,
          [item.id],
        );
        // ถ้าเป็น exam_result ให้ mark offline record ด้วย
        if (item.event_type === "exam_result") {
          const payload = JSON.parse(item.payload_json);
          await db.runAsync(
            `UPDATE offline_exam_results SET synced = 1 WHERE exam_id = ? AND taken_at = ?`,
            [payload.exam_id, payload.taken_at],
          );
        }
        result.pushed++;
      } else {
        const errText = await res.text().catch(() => `HTTP ${res.status}`);
        await markRetry(db, item.id, errText);
        result.failed++;
      }
    } catch (err: any) {
      await markRetry(db, item.id, err?.message ?? "network error");
      result.failed++;
    }
  }

  result.pending = await getPendingCount();
  return result;
}

/** ล้าง done items เก่ากว่า 7 วัน */
export async function cleanupSyncQueue(): Promise<void> {
  const db = await openDatabase();
  await db.runAsync(
    `DELETE FROM sync_queue WHERE status = 'done' AND synced_at < datetime('now', '-7 days')`,
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function resolveEndpoint(baseUrl: string, type: SyncEventType): string {
  const map: Record<SyncEventType, string> = {
    exam_result:    "/sync/exam-result",
    watch_progress: "/sync/watch-progress",
    profile_update: "/sync/profile",
    study_session:  "/sync/study-session",
  };
  return `${baseUrl}${map[type]}`;
}

async function markRetry(
  db: Awaited<ReturnType<typeof openDatabase>>,
  id: number,
  error: string,
): Promise<void> {
  await db.runAsync(
    `UPDATE sync_queue SET
       status = CASE WHEN retry_count + 1 >= ? THEN 'failed' ELSE 'pending' END,
       retry_count = retry_count + 1,
       last_error = ?
     WHERE id = ?`,
    [MAX_RETRY, error, id],
  );
}
