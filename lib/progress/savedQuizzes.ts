import AsyncStorage from "@react-native-async-storage/async-storage";

const SAVED_QUIZZES_PREFIX = "@saved_quiz_";

export interface SavedQuiz {
  courseId: string;
  courseTitle: string;
  difficulty: "easy" | "medium" | "hard";
  questions: object[];
  savedAt: number;
}

function quizKey(courseId: string, difficulty: string): string {
  return `${SAVED_QUIZZES_PREFIX}${courseId}_${difficulty}`;
}

/** บันทึก quiz questions ลง local storage */
export async function saveQuizData(
  courseId: string,
  courseTitle: string,
  difficulty: "easy" | "medium" | "hard",
  questions: object[],
): Promise<void> {
  try {
    const record: SavedQuiz = {
      courseId,
      courseTitle,
      difficulty,
      questions,
      savedAt: Date.now(),
    };
    await AsyncStorage.setItem(quizKey(courseId, difficulty), JSON.stringify(record));
  } catch (e) {
    console.warn("[SavedQuizzes] Failed to save:", e);
  }
}

/** โหลด quiz questions จาก local storage */
export async function loadSavedQuiz(
  courseId: string,
  difficulty: "easy" | "medium" | "hard",
): Promise<SavedQuiz | null> {
  try {
    const json = await AsyncStorage.getItem(quizKey(courseId, difficulty));
    if (!json) return null;
    return JSON.parse(json) as SavedQuiz;
  } catch {
    return null;
  }
}

/** ตรวจสอบว่ามี quiz บันทึกไว้หรือไม่ (รองรับทุก difficulty) */
export async function getAvailableSavedDifficulties(
  courseId: string,
): Promise<Array<"easy" | "medium" | "hard">> {
  const difficulties: Array<"easy" | "medium" | "hard"> = ["easy", "medium", "hard"];
  const available: Array<"easy" | "medium" | "hard"> = [];
  await Promise.all(
    difficulties.map(async (d) => {
      const key = quizKey(courseId, d);
      const val = await AsyncStorage.getItem(key);
      if (val) available.push(d);
    }),
  );
  return available;
}

/** ลบ quiz ที่บันทึกไว้ของ course นั้น (ทุก difficulty) */
export async function clearSavedQuizzes(courseId: string): Promise<void> {
  const difficulties = ["easy", "medium", "hard"];
  await Promise.all(
    difficulties.map((d) => AsyncStorage.removeItem(quizKey(courseId, d))),
  );
}
