import { openDatabase } from '../database';

export interface User {
  id: number;
  email: string;
  name: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

/**
 * สร้างผู้ใช้ใหม่
 */
export async function createUser(email: string, name: string, avatarUrl?: string): Promise<number> {
  const db = await openDatabase();
  const result = await db.runAsync(
    'INSERT INTO users (email, name, avatar_url) VALUES (?, ?, ?)',
    [email, name, avatarUrl || null]
  );
  return result.lastInsertRowId;
}

/**
 * ดึงข้อมูลผู้ใช้ตาม ID
 */
export async function getUserById(id: number): Promise<User | null> {
  const db = await openDatabase();
  const user = await db.getFirstAsync<User>('SELECT * FROM users WHERE id = ?', [id]);
  return user || null;
}

/**
 * ดึงข้อมูลผู้ใช้ตาม email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  const db = await openDatabase();
  const user = await db.getFirstAsync<User>('SELECT * FROM users WHERE email = ?', [email]);
  return user || null;
}

/**
 * อัพเดทข้อมูลผู้ใช้
 */
export async function updateUser(id: number, data: Partial<Omit<User, 'id' | 'created_at'>>): Promise<void> {
  const db = await openDatabase();
  const fields: string[] = [];
  const values: any[] = [];

  if (data.name !== undefined) {
    fields.push('name = ?');
    values.push(data.name);
  }
  if (data.email !== undefined) {
    fields.push('email = ?');
    values.push(data.email);
  }
  if (data.avatar_url !== undefined) {
    fields.push('avatar_url = ?');
    values.push(data.avatar_url);
  }

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  await db.runAsync(
    `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
}

/**
 * ลบผู้ใช้
 */
export async function deleteUser(id: number): Promise<void> {
  const db = await openDatabase();
  await db.runAsync('DELETE FROM users WHERE id = ?', [id]);
}
