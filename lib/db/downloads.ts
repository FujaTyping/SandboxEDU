import { openDatabase } from "../database";

export interface DownloadedVideo {
  id?: number;
  video_id: string;
  title: string;
  subject_id: string;
  subject_name: string;
  grade: string;
  thumbnail_url?: string;
  file_path?: string;
  duration?: number;
  file_size?: number;
  watch_progress?: number;
  is_completed?: number;
  downloaded_at?: string;
  last_watched_at?: string;
}

export interface ExamQuestion {
  id?: number;
  exam_id: string;
  subject_id: string;
  subject_name: string;
  grade: string;
  question: string;
  choice_a: string;
  choice_b: string;
  choice_c: string;
  choice_d: string;
  answer: "A" | "B" | "C" | "D";
  explanation?: string;
}

export async function saveDownloadedVideo(
  video: DownloadedVideo,
): Promise<void> {
  const db = await openDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO downloaded_videos 
      (video_id, title, subject_id, subject_name, grade, thumbnail_url, file_path, duration, file_size)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      video.video_id,
      video.title,
      video.subject_id,
      video.subject_name,
      video.grade,
      video.thumbnail_url ?? null,
      video.file_path ?? null,
      video.duration ?? 0,
      video.file_size ?? 0,
    ],
  );
}

export async function getAllDownloadedVideos(): Promise<DownloadedVideo[]> {
  const db = await openDatabase();
  return await db.getAllAsync<DownloadedVideo>(
    `SELECT * FROM downloaded_videos ORDER BY downloaded_at DESC`,
  );
}

export async function getVideosBySubject(
  subject_id: string,
): Promise<DownloadedVideo[]> {
  const db = await openDatabase();
  return await db.getAllAsync<DownloadedVideo>(
    `SELECT * FROM downloaded_videos WHERE subject_id = ? ORDER BY downloaded_at DESC`,
    [subject_id],
  );
}

export async function getVideosByGrade(
  grade: string,
): Promise<DownloadedVideo[]> {
  const db = await openDatabase();
  return await db.getAllAsync<DownloadedVideo>(
    `SELECT * FROM downloaded_videos WHERE grade = ? ORDER BY subject_name, downloaded_at DESC`,
    [grade],
  );
}

export async function getVideoById(
  video_id: string,
): Promise<DownloadedVideo | null> {
  const db = await openDatabase();
  return await db.getFirstAsync<DownloadedVideo>(
    `SELECT * FROM downloaded_videos WHERE video_id = ?`,
    [video_id],
  );
}

export async function updateWatchProgress(
  video_id: string,
  progress: number,
): Promise<void> {
  const db = await openDatabase();
  const is_completed = progress >= 90 ? 1 : 0;
  await db.runAsync(
    `UPDATE downloaded_videos SET watch_progress = ?, is_completed = ?, last_watched_at = CURRENT_TIMESTAMP WHERE video_id = ?`,
    [progress, is_completed, video_id],
  );
}

export async function deleteDownloadedVideo(video_id: string): Promise<void> {
  const db = await openDatabase();
  await db.runAsync(`DELETE FROM downloaded_videos WHERE video_id = ?`, [
    video_id,
  ]);
}

export async function isVideoDownloaded(video_id: string): Promise<boolean> {
  const db = await openDatabase();
  const result = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM downloaded_videos WHERE video_id = ?`,
    [video_id],
  );
  return (result?.count ?? 0) > 0;
}

export async function getDownloadStats(): Promise<{
  total: number;
  completed: number;
  byGrade: { grade: string; count: number }[];
  bySubject: { subject_name: string; count: number; avg_progress: number }[];
}> {
  const db = await openDatabase();
  const total = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM downloaded_videos`,
  );
  const completed = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM downloaded_videos WHERE is_completed = 1`,
  );
  const byGrade = await db.getAllAsync<{ grade: string; count: number }>(
    `SELECT grade, COUNT(*) as count FROM downloaded_videos GROUP BY grade ORDER BY grade`,
  );
  const bySubject = await db.getAllAsync<{
    subject_name: string;
    count: number;
    avg_progress: number;
  }>(
    `SELECT subject_name, COUNT(*) as count, AVG(watch_progress) as avg_progress FROM downloaded_videos GROUP BY subject_id ORDER BY subject_name`,
  );
  return {
    total: total?.count ?? 0,
    completed: completed?.count ?? 0,
    byGrade,
    bySubject,
  };
}

export interface DownloadedDocument {
  id?: number;
  doc_id: string;
  title: string;
  subject_id: string;
  subject_name: string;
  grade: string;
  file_path?: string;
  local_file_uri?: string;
  file_size?: number;
  doc_type?: "pdf" | "docx" | "pptx";
  downloaded_at?: string;
}

export async function saveDownloadedDocument(
  doc: DownloadedDocument,
): Promise<void> {
  const db = await openDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO downloaded_documents
       (doc_id, title, subject_id, subject_name, grade, file_path, local_file_uri, file_size, doc_type)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      doc.doc_id,
      doc.title,
      doc.subject_id,
      doc.subject_name,
      doc.grade,
      doc.file_path ?? null,
      doc.local_file_uri ?? null,
      doc.file_size ?? 0,
      doc.doc_type ?? "pdf",
    ],
  );
}

export async function isDocumentDownloaded(doc_id: string): Promise<boolean> {
  const db = await openDatabase();
  const result = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM downloaded_documents WHERE doc_id = ?`,
    [doc_id],
  );
  return (result?.count ?? 0) > 0;
}

export async function getDocumentById(
  doc_id: string,
): Promise<DownloadedDocument | null> {
  const db = await openDatabase();
  return await db.getFirstAsync<DownloadedDocument>(
    `SELECT * FROM downloaded_documents WHERE doc_id = ?`,
    [doc_id],
  );
}

export async function getDocumentsBySubject(
  subject_id: string,
  grade: string,
): Promise<DownloadedDocument[]> {
  const db = await openDatabase();
  return await db.getAllAsync<DownloadedDocument>(
    `SELECT * FROM downloaded_documents WHERE subject_id = ? AND grade = ? ORDER BY downloaded_at DESC`,
    [subject_id, grade],
  );
}

export async function deleteDownloadedDocument(doc_id: string): Promise<void> {
  const db = await openDatabase();
  await db.runAsync(`DELETE FROM downloaded_documents WHERE doc_id = ?`, [
    doc_id,
  ]);
}

/**
 * อัปเดต local_file_uri หลังดาวน์โหลดไฟล์จริงลงเครื่อง
 */
export async function updateDocumentLocalUri(
  doc_id: string,
  local_file_uri: string,
): Promise<void> {
  const db = await openDatabase();
  await db.runAsync(
    `UPDATE downloaded_documents SET local_file_uri = ? WHERE doc_id = ?`,
    [local_file_uri, doc_id],
  );
}

export async function saveExamQuestions(
  questions: ExamQuestion[],
): Promise<void> {
  const db = await openDatabase();
  for (const q of questions) {
    await db.runAsync(
      `INSERT OR IGNORE INTO exam_questions 
        (exam_id, subject_id, subject_name, grade, question, choice_a, choice_b, choice_c, choice_d, answer, explanation)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        q.exam_id,
        q.subject_id,
        q.subject_name,
        q.grade,
        q.question,
        q.choice_a,
        q.choice_b,
        q.choice_c,
        q.choice_d,
        q.answer,
        q.explanation ?? null,
      ],
    );
  }
}

export async function getExamQuestions(
  exam_id: string,
): Promise<ExamQuestion[]> {
  const db = await openDatabase();
  return await db.getAllAsync<ExamQuestion>(
    `SELECT * FROM exam_questions WHERE exam_id = ? ORDER BY id`,
    [exam_id],
  );
}
