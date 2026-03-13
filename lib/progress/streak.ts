import { getAllVideoProgress } from "./videoProgress";

/** วันที่ในรูป "YYYY-MM-DD" เพื่อเปรียบเทียบ */
function toDateStr(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function daysBetween(a: string, b: string): number {
  const msA = new Date(a).getTime();
  const msB = new Date(b).getTime();
  return Math.round(Math.abs(msA - msB) / 86400000);
}

export interface StreakResult {
  /** จำนวนวันที่ดู VDO ต่อเนื่องจนถึงวันนี้ (หรือเมื่อวาน) */
  current: number;
  /** ดูวันนี้แล้วหรือยัง */
  watchedToday: boolean;
}

/**
 * คำนวณ streak วันที่ดู VDO ต่อเนื่อง
 * นับจาก VideoProgress.lastUpdated — ถ้าวันใดมี progress ที่ update แล้ว >= MIN_PCT จะนับว่า "ดูวันนั้น"
 */
export async function calculateStreak(
  minPct: number = 5,
): Promise<StreakResult> {
  try {
    const allProgress = await getAllVideoProgress();
    const values = Object.values(allProgress);

    if (values.length === 0) return { current: 0, watchedToday: false };

    // กรอง course ที่มี progress >= minPct แล้วดึง lastUpdated
    const activeDates = values
      .filter((p) => p.percentage >= minPct && p.lastUpdated)
      .map((p) => toDateStr(p.lastUpdated));

    if (activeDates.length === 0) return { current: 0, watchedToday: false };

    // unique dates, sorted descending
    const uniqueDates = [...new Set(activeDates)].sort((a, b) =>
      b.localeCompare(a),
    );

    const today = toDateStr(Date.now());
    const yesterday = toDateStr(Date.now() - 86400000);

    const watchedToday = uniqueDates[0] === today;

    // streak เริ่มจากวันที่ใหม่สุด — ถ้าไม่ใช่วันนี้หรือเมื่อวาน streak = 0
    const startDate = uniqueDates[0];
    if (startDate !== today && startDate !== yesterday) {
      return { current: 0, watchedToday: false };
    }

    // นับวันต่อเนื่องย้อนหลัง
    let streak = 1;
    for (let i = 1; i < uniqueDates.length; i++) {
      const diff = daysBetween(uniqueDates[i - 1], uniqueDates[i]);
      if (diff === 1) {
        streak++;
      } else {
        break;
      }
    }

    return { current: streak, watchedToday };
  } catch {
    return { current: 0, watchedToday: false };
  }
}
