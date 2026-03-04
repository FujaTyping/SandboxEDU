import { openDatabase } from '../database';

export interface Subject {
  id: number;
  title: string;
  description?: string;
  color?: string;
  icon?: string;
  total_chapters: number;
  completed_chapters: number;
  created_at: string;
  updated_at: string;
}

/**
 * สร้างวิชาใหม่
 */
export async function createSubject(
  title: string,
  description?: string,
  color?: string,
  icon?: string
): Promise<number> {
  const db = await openDatabase();
  const result = await db.runAsync(
    'INSERT INTO subjects (title, description, color, icon) VALUES (?, ?, ?, ?)',
    [title, description || null, color || null, icon || null]
  );
  return result.lastInsertRowId;
}

/**
 * ดึงวิชาทั้งหมด
 */
export async function getAllSubjects(): Promise<Subject[]> {
  const db = await openDatabase();
  return await db.getAllAsync<Subject>('SELECT * FROM subjects ORDER BY created_at DESC');
}

/**
 * ดึงข้อมูลวิชาตาม ID
 */
export async function getSubjectById(id: number): Promise<Subject | null> {
  const db = await openDatabase();
  const subject = await db.getFirstAsync<Subject>('SELECT * FROM subjects WHERE id = ?', [id]);
  return subject || null;
}

/**
 * อัพเดทข้อมูลวิชา
 */
export async function updateSubject(
  id: number,
  data: Partial<Omit<Subject, 'id' | 'created_at' | 'updated_at'>>
): Promise<void> {
  const db = await openDatabase();
  const fields: string[] = [];
  const values: any[] = [];

  if (data.title !== undefined) {
    fields.push('title = ?');
    values.push(data.title);
  }
  if (data.description !== undefined) {
    fields.push('description = ?');
    values.push(data.description);
  }
  if (data.color !== undefined) {
    fields.push('color = ?');
    values.push(data.color);
  }
  if (data.icon !== undefined) {
    fields.push('icon = ?');
    values.push(data.icon);
  }
  if (data.total_chapters !== undefined) {
    fields.push('total_chapters = ?');
    values.push(data.total_chapters);
  }
  if (data.completed_chapters !== undefined) {
    fields.push('completed_chapters = ?');
    values.push(data.completed_chapters);
  }

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  await db.runAsync(
    `UPDATE subjects SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
}

/**
 * ลบวิชา
 */
export async function deleteSubject(id: number): Promise<void> {
  const db = await openDatabase();
  await db.runAsync('DELETE FROM subjects WHERE id = ?', [id]);
}

/**
 * อัพเดทจำนวนบทเรียนที่เสร็จแล้ว
 */
export async function updateSubjectProgress(subjectId: number): Promise<void> {
  const db = await openDatabase();
  await db.runAsync(
    `UPDATE subjects 
     SET completed_chapters = (
       SELECT COUNT(*) FROM chapters 
       WHERE subject_id = ? AND status = 'completed'
     ),
     total_chapters = (
       SELECT COUNT(*) FROM chapters 
       WHERE subject_id = ?
     ),
     updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [subjectId, subjectId, subjectId]
  );
}
