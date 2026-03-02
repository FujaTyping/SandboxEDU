export interface Chapter {
  id: string;
  title: string;
  status: "completed" | "in_progress" | "locked";
  type: "lesson" | "exam";
}

export interface Subject {
  id: string;
  name: string;
  icon: string;
  color: string;
  progress: number;
  chapters: Chapter[];
}

export interface DailyStudy {
  day: string;
  hours: number;
}

export interface UserProfile {
  name: string;
  age: number;
  grade: string;
  avatar: string;
  studyProgress: number;
  examScore: number;
}

export const mockUser: UserProfile = {
  name: "สมชาย",
  age: 15,
  grade: "ม.3",
  avatar: "",
  studyProgress: 65,
  examScore: 72,
};

export const mockSubjects: Subject[] = [
  {
    id: "english",
    name: "อังกฤษ",
    icon: "Languages",
    color: "#5EEAD4",
    progress: 50,
    chapters: [
      { id: "en1", title: "บทที่1", status: "completed", type: "lesson" },
      { id: "en2", title: "บทที่2", status: "in_progress", type: "lesson" },
      { id: "en3", title: "บทที่3", status: "locked", type: "lesson" },
      { id: "en_exam", title: "สอบ", status: "locked", type: "exam" },
    ],
  },
  {
    id: "math",
    name: "คณิต",
    icon: "Calculator",
    color: "#FBBF24",
    progress: 70,
    chapters: [
      { id: "ma1", title: "บทที่1", status: "completed", type: "lesson" },
      { id: "ma2", title: "บทที่2", status: "completed", type: "lesson" },
      { id: "ma3", title: "บทที่3", status: "in_progress", type: "lesson" },
      { id: "ma_exam", title: "สอบ", status: "locked", type: "exam" },
    ],
  },
  {
    id: "thai",
    name: "ไทย",
    icon: "BookOpen",
    color: "#34D399",
    progress: 60,
    chapters: [
      { id: "th1", title: "บทที่1", status: "completed", type: "lesson" },
      { id: "th2", title: "บทที่2", status: "in_progress", type: "lesson" },
      { id: "th3", title: "บทที่3", status: "locked", type: "lesson" },
      { id: "th_exam", title: "สอบ", status: "locked", type: "exam" },
    ],
  },
  {
    id: "science",
    name: "วิทย์",
    icon: "Microscope",
    color: "#F87171",
    progress: 40,
    chapters: [
      { id: "sc1", title: "บทที่1", status: "completed", type: "lesson" },
      { id: "sc2", title: "บทที่2", status: "locked", type: "lesson" },
      { id: "sc3", title: "บทที่3", status: "locked", type: "lesson" },
      { id: "sc_exam", title: "สอบ", status: "locked", type: "exam" },
    ],
  },
];

export const mockDailyStudy: DailyStudy[] = [
  { day: "จ", hours: 1 },
  { day: "อ", hours: 2 },
  { day: "พ", hours: 3 },
  { day: "พฤ", hours: 5 },
  { day: "ศ", hours: 6 },
  { day: "ส", hours: 4 },
  { day: "อา", hours: 3 },
];
