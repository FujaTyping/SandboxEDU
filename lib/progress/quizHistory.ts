import AsyncStorage from "@react-native-async-storage/async-storage";

const QUIZ_HISTORY_KEY = "@quiz_history";

export interface QuizRecord {
  id: string;
  courseId: string;
  courseTitle: string;
  subject?: string;
  correct: number;
  wrong: number;
  total: number;
  score: number;
  timestamp: number;
}

async function getAllHistory(): Promise<QuizRecord[]> {
  try {
    const json = await AsyncStorage.getItem(QUIZ_HISTORY_KEY);
    if (!json) return [];
    return JSON.parse(json);
  } catch {
    return [];
  }
}

export async function saveQuizRecord(
  record: Omit<QuizRecord, "id" | "score">,
): Promise<void> {
  try {
    const all = await getAllHistory();
    const newRecord: QuizRecord = {
      ...record,
      id: `${record.courseId}_${record.timestamp}`,
      score:
        record.total > 0
          ? Math.round((record.correct / record.total) * 100)
          : 0,
    };
    all.push(newRecord);
    const trimmed = all.length > 100 ? all.slice(all.length - 100) : all;
    await AsyncStorage.setItem(QUIZ_HISTORY_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.error("[QuizHistory] Failed to save:", e);
  }
}

export async function getQuizHistory(): Promise<QuizRecord[]> {
  const all = await getAllHistory();
  return all.sort((a, b) => a.timestamp - b.timestamp);
}

export async function getQuizHistoryByCourse(
  courseId: string,
): Promise<QuizRecord[]> {
  const all = await getAllHistory();
  return all
    .filter((r) => r.courseId === courseId)
    .sort((a, b) => a.timestamp - b.timestamp);
}

export async function clearQuizHistory(): Promise<void> {
  await AsyncStorage.removeItem(QUIZ_HISTORY_KEY);
}
