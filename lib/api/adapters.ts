/**
 * API Adapters
 * แปลงข้อมูลระหว่าง API format ↔ Local DB format
 */

import type { DownloadedVideo, DownloadedDocument } from '@/lib/db/downloads';

// ─── API → Local DB ───────────────────────────────────────────────────────────

export interface ApiCourse {
  id: string;
  title: string;
  description?: string;
  color?: string;
  icon?: string;
  total_chapters?: number;
  completed_chapters?: number;
}

export function apiCourseToSubject(course: ApiCourse) {
  return {
    subject_id: course.id,
    title: course.title,
    description: course.description ?? '',
    color: course.color ?? '#3B82F6',
    icon: course.icon ?? 'book',
    total_chapters: course.total_chapters ?? 0,
    completed_chapters: course.completed_chapters ?? 0,
  };
}

export interface ApiUser {
  id: string;
  name: string;
  surname?: string;
  displayName: string;
  avatarURL?: string;
  sclass?: number;
  room?: number;
  email?: string;
}

export function apiUserToProfile(user: ApiUser, token?: string) {
  return {
    remote_id: user.id,
    email: user.email ?? `${user.displayName}@sandboxedu.local`,
    name: user.displayName,
    grade: user.sclass ? `ม.${user.sclass}` : null,
    avatar_url: user.avatarURL ?? null,
    auth_token: token ?? null,
  };
}

// ─── Local DB → API ───────────────────────────────────────────────────────────

export function examResultToQuizPayload(result: {
  exam_id: string;
  correct_count: number;
  total_questions: number;
}) {
  return {
    id: result.exam_id,
    correct: result.correct_count,
    wrong: result.total_questions - result.correct_count,
  };
}

export function videoProgressToComplete(video: DownloadedVideo) {
  return {
    id: video.video_id,
  };
}

export function profileUpdateToApi(update: {
  name?: string;
  grade?: string;
  avatar_url?: string;
}) {
  const fields: { field: string; value: string }[] = [];
  
  if (update.name) {
    fields.push({ field: 'displayName', value: update.name });
  }
  if (update.grade) {
    fields.push({ field: 'sclass', value: update.grade.replace('ม.', '') });
  }
  if (update.avatar_url) {
    fields.push({ field: 'avatarURL', value: update.avatar_url });
  }
  
  return fields;
}

// ─── Validation ───────────────────────────────────────────────────────────────

export function validateApiResponse(data: any, requiredFields: string[]): boolean {
  if (!data || typeof data !== 'object') return false;
  return requiredFields.every((field) => field in data);
}

export function safeParseApiResponse<T>(
  data: any,
  requiredFields: string[],
  fallback: T,
): T {
  if (validateApiResponse(data, requiredFields)) {
    return data as T;
  }
  console.warn('Invalid API response, using fallback:', { data, requiredFields });
  return fallback;
}
