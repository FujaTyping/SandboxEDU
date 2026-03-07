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

export interface ThetaTopic {
  topic: string;
  theta: number; // IRT ability estimate, range roughly -3 to +3
}

export interface ThetaSubject {
  subject: string;
  subjectId: string;
  color: string;
  topics: ThetaTopic[];
}

export const mockThetaData: ThetaSubject[] = [
  {
    subject: "คณิตศาสตร์",
    subjectId: "math",
    color: "#3B82F6",
    topics: [
      { topic: "พีชคณิต", theta: 1.4 },
      { topic: "เรขาคณิต", theta: 0.6 },
      { topic: "สถิติ", theta: -0.3 },
      { topic: "ตรีโกณ", theta: 1.1 },
      { topic: "แคลคูลัส", theta: -1.2 },
    ],
  },
  {
    subject: "วิทยาศาสตร์",
    subjectId: "physics",
    color: "#10B981",
    topics: [
      { topic: "กลศาสตร์", theta: 0.8 },
      { topic: "ไฟฟ้า", theta: -0.5 },
      { topic: "คลื่น", theta: 0.2 },
      { topic: "ชีววิทยา", theta: 1.6 },
      { topic: "เคมี", theta: -0.9 },
    ],
  },
  {
    subject: "ภาษาไทย",
    subjectId: "thai",
    color: "#EC4899",
    topics: [
      { topic: "การอ่าน", theta: 1.8 },
      { topic: "การเขียน", theta: 0.9 },
      { topic: "ไวยากรณ์", theta: 0.4 },
      { topic: "วรรณคดี", theta: -0.2 },
      { topic: "การพูด", theta: 1.3 },
    ],
  },
  {
    subject: "ภาษาอังกฤษ",
    subjectId: "english",
    color: "#8B5CF6",
    topics: [
      { topic: "Reading", theta: 0.5 },
      { topic: "Writing", theta: -0.7 },
      { topic: "Grammar", theta: 0.3 },
      { topic: "Listening", theta: 1.0 },
      { topic: "Vocabulary", theta: 1.5 },
    ],
  },
  {
    subject: "สังคมศึกษา",
    subjectId: "social",
    color: "#F59E0B",
    topics: [
      { topic: "ประวัติศาสตร์", theta: 1.2 },
      { topic: "ภูมิศาสตร์", theta: 0.1 },
      { topic: "เศรษฐศาสตร์", theta: -1.0 },
      { topic: "พลเมือง", theta: 0.7 },
      { topic: "ศาสนา", theta: 1.4 },
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
