import * as SQLite from "expo-sqlite";

const DB_NAME = "sandboxedu.db";

let db: SQLite.SQLiteDatabase | null = null;

/**
 * เปิดการเชื่อมต่อ database
 */
export async function openDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;

  db = await SQLite.openDatabaseAsync(DB_NAME);
  return db;
}

/**
 * สร้างตารางทั้งหมดในฐานข้อมูล
 */
export async function initDatabase(): Promise<void> {
  const database = await openDatabase();

  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    
    -- ตาราง Users
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      avatar_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    -- ตาราง Subjects (วิชา)
    CREATE TABLE IF NOT EXISTS subjects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      color TEXT,
      icon TEXT,
      total_chapters INTEGER DEFAULT 0,
      completed_chapters INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    -- ตาราง Chapters (บทเรียน)
    CREATE TABLE IF NOT EXISTS chapters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subject_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      order_index INTEGER NOT NULL,
      status TEXT DEFAULT 'locked' CHECK(status IN ('locked', 'in_progress', 'completed')),
      is_exam INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
    );
    
    -- ตาราง Lessons (เนื้อหาบทเรียน)
    CREATE TABLE IF NOT EXISTS lessons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chapter_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      order_index INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
    );
    
    -- ตาราง Study Progress (ความคืบหน้าการเรียน)
    CREATE TABLE IF NOT EXISTS study_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      chapter_id INTEGER NOT NULL,
      progress_percent INTEGER DEFAULT 0,
      time_spent INTEGER DEFAULT 0,
      last_studied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
      UNIQUE(user_id, chapter_id)
    );
    
    -- ตาราง Exam Results (ผลสอบ)
    CREATE TABLE IF NOT EXISTS exam_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      chapter_id INTEGER NOT NULL,
      score INTEGER NOT NULL,
      total_questions INTEGER NOT NULL,
      passed INTEGER DEFAULT 0,
      completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
    );
    
    -- ตาราง Daily Study (สถิติการเรียนรายวัน)
    CREATE TABLE IF NOT EXISTS daily_study (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      study_date DATE NOT NULL,
      hours REAL DEFAULT 0,
      chapters_completed INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, study_date)
    );
    
    -- ตาราง Downloaded Videos (คลิปที่ดาวน์โหลด)
    CREATE TABLE IF NOT EXISTS downloaded_videos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      video_id TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      subject_name TEXT NOT NULL,
      grade TEXT NOT NULL,
      thumbnail_url TEXT,
      file_path TEXT,
      duration INTEGER DEFAULT 0,
      file_size INTEGER DEFAULT 0,
      watch_progress INTEGER DEFAULT 0,
      is_completed INTEGER DEFAULT 0,
      downloaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_watched_at DATETIME
    );

    -- ตาราง Downloaded Documents (เอกสาร)
    CREATE TABLE IF NOT EXISTS downloaded_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      doc_id TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      subject_name TEXT NOT NULL,
      grade TEXT NOT NULL,
      file_path TEXT,
      local_file_uri TEXT,
      file_size INTEGER DEFAULT 0,
      doc_type TEXT DEFAULT 'pdf' CHECK(doc_type IN ('pdf','docx','pptx')),
      downloaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- ตาราง Exam Questions (ข้อสอบ)
    CREATE TABLE IF NOT EXISTS exam_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exam_id TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      subject_name TEXT NOT NULL,
      grade TEXT NOT NULL,
      question TEXT NOT NULL,
      choice_a TEXT NOT NULL,
      choice_b TEXT NOT NULL,
      choice_c TEXT NOT NULL,
      choice_d TEXT NOT NULL,
      answer TEXT NOT NULL CHECK(answer IN ('A','B','C','D')),
      explanation TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- ตาราง User Profile (cached จาก server)
    CREATE TABLE IF NOT EXISTS user_profile (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      remote_id TEXT UNIQUE,
      email TEXT NOT NULL,
      name TEXT NOT NULL,
      grade TEXT,
      avatar_url TEXT,
      auth_token TEXT,
      token_expires_at DATETIME,
      is_logged_in INTEGER DEFAULT 0,
      last_synced_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- ตาราง Offline Exam Results (ผลสอบที่ยังไม่ได้ sync)
    CREATE TABLE IF NOT EXISTS offline_exam_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exam_id TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      grade TEXT NOT NULL,
      score INTEGER NOT NULL,
      total_questions INTEGER NOT NULL,
      correct_count INTEGER NOT NULL,
      time_spent_sec INTEGER DEFAULT 0,
      answers_json TEXT,
      passed INTEGER DEFAULT 0,
      synced INTEGER DEFAULT 0,
      taken_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- ตาราง Sync Queue (รายการที่รอ push ขึ้น server)
    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','syncing','done','failed')),
      retry_count INTEGER DEFAULT 0,
      last_error TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      synced_at DATETIME
    );

    -- ตาราง App Settings (key-value)
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Index สำหรับ performance
    CREATE INDEX IF NOT EXISTS idx_chapters_subject ON chapters(subject_id);
    CREATE INDEX IF NOT EXISTS idx_lessons_chapter ON lessons(chapter_id);
    CREATE INDEX IF NOT EXISTS idx_progress_user ON study_progress(user_id);
    CREATE INDEX IF NOT EXISTS idx_progress_chapter ON study_progress(chapter_id);
    CREATE INDEX IF NOT EXISTS idx_exam_user ON exam_results(user_id);
    CREATE INDEX IF NOT EXISTS idx_daily_user_date ON daily_study(user_id, study_date);
    CREATE INDEX IF NOT EXISTS idx_videos_subject ON downloaded_videos(subject_id);
    CREATE INDEX IF NOT EXISTS idx_videos_grade ON downloaded_videos(grade);
    CREATE INDEX IF NOT EXISTS idx_exam_q_exam ON exam_questions(exam_id);
    CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);
    CREATE INDEX IF NOT EXISTS idx_offline_exam_synced ON offline_exam_results(synced);
  `);

  console.log("✅ Database initialized successfully");
}

/**
 * ลบข้อมูลทั้งหมดในฐานข้อมูล (สำหรับ development)
 */
export async function clearDatabase(): Promise<void> {
  const database = await openDatabase();

  await database.execAsync(`
    DELETE FROM daily_study;
    DELETE FROM exam_results;
    DELETE FROM study_progress;
    DELETE FROM lessons;
    DELETE FROM chapters;
    DELETE FROM subjects;
    DELETE FROM users;
  `);

  console.log("🗑️ Database cleared");
}

/**
 * ลบฐานข้อมูลทั้งหมด (รวมถึงตาราง)
 */
export async function dropDatabase(): Promise<void> {
  const database = await openDatabase();

  await database.execAsync(`
    DROP TABLE IF EXISTS daily_study;
    DROP TABLE IF EXISTS exam_results;
    DROP TABLE IF EXISTS study_progress;
    DROP TABLE IF EXISTS lessons;
    DROP TABLE IF EXISTS chapters;
    DROP TABLE IF EXISTS subjects;
    DROP TABLE IF EXISTS users;
  `);

  console.log("💥 Database dropped");
}

/**
 * ปิดการเชื่อมต่อ database
 */
export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
    console.log("🔒 Database closed");
  }
}

export { db };

