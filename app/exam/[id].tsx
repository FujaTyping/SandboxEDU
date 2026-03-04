import { Palette } from "@/constants/theme";
import { ExamQuestion, getExamQuestions } from "@/lib/db/downloads";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
    ArrowLeft,
    CheckCircle,
    ChevronRight,
    ClipboardList,
    RotateCcw,
    XCircle,
} from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

const subjectColorMap: Record<string, string> = {
  math: "#3B82F6",
  physics: "#10B981",
  thai: "#EC4899",
  social: "#F59E0B",
  english: "#8B5CF6",
};

const subjectNameMap: Record<string, string> = {
  math: "คณิตศาสตร์",
  physics: "วิทยาศาสตร์",
  thai: "ภาษาไทย",
  social: "สังคมศึกษา",
  english: "ภาษาอังกฤษ",
};

const gradeNameMap: Record<string, string> = {
  m1: "ม.1",
  m2: "ม.2",
  m3: "ม.3",
  m4: "ม.4",
  m5: "ม.5",
  m6: "ม.6",
};

const cardShadow = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  android: { elevation: 4 },
  default: {},
});

type Phase = "intro" | "exam" | "result";

export default function ExamScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const gradientId = useMemo(() => `examGrad-${Date.now()}`, []);

  const [subjectId, grade] = (id || "").split("-");
  const accentColor = subjectColorMap[subjectId] ?? Palette.primary;

  const [phase, setPhase] = useState<Phase>("intro");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [loadingQ, setLoadingQ] = useState(true);

  const examId = `${grade}_${subjectId}_exam_1`;

  useEffect(() => {
    getExamQuestions(examId)
      .then((qs) => {
        setQuestions(qs);
        setLoadingQ(false);
      })
      .catch(() => setLoadingQ(false));
  }, [examId]);

  const currentQ = questions[currentIndex] as ExamQuestion | undefined;
  const selectedAnswer = answers[String(currentQ?.id ?? "")];
  const isAnswered = !!selectedAnswer;
  const isCorrect = selectedAnswer === currentQ?.answer;

  const score = Object.entries(answers).filter(
    ([qid, ans]) => questions.find((q) => String(q.id) === qid)?.answer === ans,
  ).length;

  const handleSelectAnswer = (choice: string) => {
    if (isAnswered || !currentQ) return;
    setAnswers((prev) => ({ ...prev, [String(currentQ.id)]: choice }));
    setShowExplanation(false);
  };

  const handleNext = () => {
    setShowExplanation(false);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setPhase("result");
    }
  };

  const handleRestart = () => {
    setAnswers({});
    setCurrentIndex(0);
    setShowExplanation(false);
    setPhase("exam");
  };

  const scorePercent = Math.round((score / questions.length) * 100);
  const passed = scorePercent >= 60;

  const renderIntro = () => (
    <ScrollView
      className="flex-1 px-5 -mt-2"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {loadingQ ? (
        <View className="items-center py-20">
          <ActivityIndicator size="large" color={accentColor} />
          <Text className="text-brand-muted mt-3">กำลังโหลดข้อสอบ...</Text>
        </View>
      ) : questions.length === 0 ? (
        <View className="items-center py-20 px-8">
          <View className="w-20 h-20 rounded-full bg-edge-light items-center justify-center mb-4">
            <ClipboardList
              size={36}
              color={Palette.textMuted}
              strokeWidth={1.5}
            />
          </View>
          <Text className="text-lg font-bold text-brand-text mb-2 text-center">
            ยังไม่มีข้อสอบ
          </Text>
          <Text className="text-sm text-brand-muted text-center">
            ดาวน์โหลดบทเรียนเพื่อรับข้อสอบ
          </Text>
        </View>
      ) : (
        <View className="bg-surface rounded-2xl p-6 mb-4" style={cardShadow}>
          <Text className="text-xl font-black text-brand-text mb-2">
            ข้อสอบ{subjectNameMap[subjectId] ?? subjectId}
          </Text>
          <Text className="text-sm text-brand-muted mb-5">
            {gradeNameMap[grade] ?? grade} · {questions.length} ข้อ
          </Text>

          <View className="flex-row gap-3 mb-6">
            <View className="flex-1 bg-surface-alt rounded-xl p-3 items-center">
              <Text
                className="text-2xl font-black"
                style={{ color: accentColor }}
              >
                {questions.length}
              </Text>
              <Text className="text-xs text-brand-muted mt-1">ข้อทั้งหมด</Text>
            </View>
            <View className="flex-1 bg-surface-alt rounded-xl p-3 items-center">
              <Text className="text-2xl font-black text-success">60%</Text>
              <Text className="text-xs text-brand-muted mt-1">เกณฑ์ผ่าน</Text>
            </View>
            <View className="flex-1 bg-surface-alt rounded-xl p-3 items-center">
              <Text className="text-2xl font-black text-brand-text">∞</Text>
              <Text className="text-xs text-brand-muted mt-1">
                ไม่จำกัดเวลา
              </Text>
            </View>
          </View>

          <TouchableOpacity
            className="rounded-xl py-4 items-center"
            style={{ backgroundColor: accentColor }}
            activeOpacity={0.8}
            onPress={() => setPhase("exam")}
          >
            <Text className="text-white font-black text-lg">เริ่มทำข้อสอบ</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );

  const renderExam = () => (
    <ScrollView
      className="flex-1 px-5 -mt-2"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* Progress dots */}
      <View className="flex-row gap-1.5 mb-4 justify-center flex-wrap">
        {questions.map((q, i) => (
          <View
            key={q.id ?? i}
            className="rounded-full"
            style={{
              width: 8,
              height: 8,
              backgroundColor: answers[String(q.id)]
                ? answers[String(q.id)] === q.answer
                  ? "#10B981"
                  : "#EF4444"
                : i === currentIndex
                  ? accentColor
                  : "#E2E8F0",
            }}
          />
        ))}
      </View>

      {/* Question card */}
      <View className="bg-surface rounded-2xl p-5 mb-4" style={cardShadow}>
        <View className="flex-row items-center mb-4">
          <View
            className="px-2.5 py-1 rounded-lg mr-2"
            style={{ backgroundColor: accentColor + "20" }}
          >
            <Text className="text-xs font-bold" style={{ color: accentColor }}>
              ข้อ {currentIndex + 1}/{questions.length}
            </Text>
          </View>
        </View>

        <Text className="text-base font-bold text-brand-text leading-7 mb-5">
          {currentQ?.question}
        </Text>

        {/* Choices */}
        {(["A", "B", "C", "D"] as const).map((choice) => {
          const isSelected = selectedAnswer === choice;
          const isRightAnswer = currentQ?.answer === choice;
          let bg = "bg-surface-alt";
          let borderColor: string = "transparent";
          let textColor: string = Palette.textSecondary;

          if (isAnswered) {
            if (isRightAnswer) {
              bg = "bg-surface-alt";
              borderColor = "#10B981";
              textColor = "#10B981";
            } else if (isSelected && !isRightAnswer) {
              bg = "bg-surface-alt";
              borderColor = "#EF4444";
              textColor = "#EF4444";
            }
          } else if (isSelected) {
            borderColor = accentColor;
            textColor = accentColor;
          }

          const choiceText =
            choice === "A"
              ? currentQ?.choice_a
              : choice === "B"
                ? currentQ?.choice_b
                : choice === "C"
                  ? currentQ?.choice_c
                  : currentQ?.choice_d;

          return (
            <TouchableOpacity
              key={choice}
              className={`${bg} rounded-xl p-4 mb-2.5 flex-row items-center`}
              style={{ borderWidth: 2, borderColor }}
              activeOpacity={isAnswered ? 1 : 0.7}
              onPress={() => handleSelectAnswer(choice)}
            >
              <View
                className="w-8 h-8 rounded-full items-center justify-center mr-3"
                style={{
                  backgroundColor:
                    isAnswered && isRightAnswer
                      ? "#10B981"
                      : isAnswered && isSelected
                        ? "#EF4444"
                        : isSelected
                          ? accentColor
                          : "#E2E8F0",
                }}
              >
                <Text className="text-sm font-black text-white">{choice}</Text>
              </View>
              <Text
                className="flex-1 text-sm font-semibold"
                style={{ color: textColor }}
              >
                {choiceText}
              </Text>
              {isAnswered && isRightAnswer && (
                <CheckCircle size={18} color="#10B981" />
              )}
              {isAnswered && isSelected && !isRightAnswer && (
                <XCircle size={18} color="#EF4444" />
              )}
            </TouchableOpacity>
          );
        })}

        {/* Explanation */}
        {isAnswered && (
          <View className="mt-3">
            {!showExplanation ? (
              <TouchableOpacity
                className="py-2.5 items-center"
                onPress={() => setShowExplanation(true)}
              >
                <Text
                  className="text-sm font-semibold"
                  style={{ color: accentColor }}
                >
                  ดูคำอธิบาย
                </Text>
              </TouchableOpacity>
            ) : (
              <View
                className="rounded-xl p-4 mt-1"
                style={{ backgroundColor: accentColor + "10" }}
              >
                <Text
                  className="text-xs font-bold mb-1"
                  style={{ color: accentColor }}
                >
                  คำอธิบาย
                </Text>
                <Text className="text-sm text-brand-secondary leading-5">
                  {currentQ?.explanation ?? "-"}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {isAnswered && (
        <TouchableOpacity
          className="rounded-xl py-4 flex-row items-center justify-center"
          style={{ backgroundColor: accentColor }}
          activeOpacity={0.8}
          onPress={handleNext}
        >
          <Text className="text-white font-black text-base mr-2">
            {currentIndex < questions.length - 1 ? "ข้อถัดไป" : "ดูผลสอบ"}
          </Text>
          <ChevronRight size={20} color="white" strokeWidth={2.5} />
        </TouchableOpacity>
      )}
    </ScrollView>
  );

  const renderResult = () => (
    <ScrollView
      className="flex-1 px-5 -mt-2"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* Score card */}
      <View
        className="bg-surface rounded-2xl p-6 mb-4 items-center"
        style={cardShadow}
      >
        <View
          className="w-28 h-28 rounded-full items-center justify-center mb-4"
          style={{ backgroundColor: (passed ? "#10B981" : "#EF4444") + "20" }}
        >
          <Text
            className="text-4xl font-black"
            style={{ color: passed ? "#10B981" : "#EF4444" }}
          >
            {scorePercent}%
          </Text>
        </View>

        <Text className="text-2xl font-black text-brand-text mb-1">
          {passed ? "ผ่านการสอบ! 🎉" : "ยังไม่ผ่าน 😢"}
        </Text>
        <Text className="text-sm text-brand-muted mb-6">
          ตอบถูก {score}/{questions.length} ข้อ
        </Text>

        <View className="flex-row gap-3 w-full">
          <TouchableOpacity
            className="flex-1 bg-surface-alt rounded-xl py-3.5 flex-row items-center justify-center"
            activeOpacity={0.7}
            onPress={handleRestart}
          >
            <RotateCcw size={18} color={Palette.primary} strokeWidth={2} />
            <Text className="text-sm font-bold text-primary ml-2">
              ทำอีกครั้ง
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 rounded-xl py-3.5 flex-row items-center justify-center"
            style={{ backgroundColor: accentColor }}
            activeOpacity={0.8}
            onPress={() => router.back()}
          >
            <Text className="text-white font-bold text-sm">กลับไปเรียน</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Review answers */}
      <Text className="text-base font-bold text-brand-text mb-3">
        เฉลยข้อสอบ
      </Text>
      {questions.map((q, i) => {
        const userAnswer = answers[String(q.id)];
        const correct = userAnswer === q.answer;
        const choiceMap: Record<string, string> = {
          A: q.choice_a,
          B: q.choice_b,
          C: q.choice_c,
          D: q.choice_d,
        };
        return (
          <View
            key={q.id ?? i}
            className="bg-surface rounded-xl p-4 mb-2.5"
            style={cardShadow}
          >
            <View className="flex-row items-start">
              <View
                className="w-7 h-7 rounded-full items-center justify-center mr-3 mt-0.5"
                style={{ backgroundColor: correct ? "#10B981" : "#EF4444" }}
              >
                <Text className="text-xs font-black text-white">{i + 1}</Text>
              </View>
              <View className="flex-1">
                <Text
                  className="text-sm font-semibold text-brand-text mb-1"
                  numberOfLines={2}
                >
                  {q.question}
                </Text>
                <Text className="text-xs text-success">
                  ✓ {choiceMap[q.answer] ?? q.answer}
                </Text>
                {!correct && (
                  <Text className="text-xs text-danger mt-0.5">
                    ✗ คุณตอบ: {choiceMap[userAnswer] ?? "-"}
                  </Text>
                )}
              </View>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-surface-alt">
        {/* Gradient Header */}
        <View className="relative">
          <Svg
            style={{ position: "absolute", top: 0, left: 0, right: 0 }}
            width="100%"
            height={130 + insets.top}
          >
            <Defs>
              <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={accentColor} />
                <Stop offset="1" stopColor={accentColor + "AA"} />
              </LinearGradient>
            </Defs>
            <Rect
              width="100%"
              height={130 + insets.top}
              fill={`url(#${gradientId})`}
            />
          </Svg>

          <View className="px-5 pb-5" style={{ paddingTop: insets.top + 8 }}>
            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={() => router.back()}
                className="w-10 h-10 rounded-full bg-white/20 items-center justify-center mr-3"
                activeOpacity={0.7}
              >
                <ArrowLeft size={20} color="white" strokeWidth={2.5} />
              </TouchableOpacity>
              <View className="flex-1">
                <Text className="text-xl font-black text-white">
                  ข้อสอบ{subjectNameMap[subjectId] ?? subjectId}
                </Text>
                <Text className="text-sm text-white/80">
                  {gradeNameMap[grade] ?? grade}
                  {phase === "exam"
                    ? ` · ข้อ ${currentIndex + 1}/${questions.length}`
                    : ""}
                  {phase === "result"
                    ? ` · ${score}/${questions.length} ถูก`
                    : ""}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {phase === "intro" && renderIntro()}
        {phase === "exam" && renderExam()}
        {phase === "result" && renderResult()}
      </View>
    </>
  );
}
