import { Palette } from "@/constants/theme";
import { getJwt } from "@/lib/auth/token";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
    ArrowLeft,
    CheckCircle,
    ChevronRight,
    ClipboardList,
    RotateCcw,
    XCircle,
} from "lucide-react-native";
import React, { useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

interface QuizQuestion {
  id: string;
  question: string;
  choices: string[];
  answer: string;
  explanation?: string;
}

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

type Phase = "exam" | "result";

async function getToken(): Promise<string | null> {
  return getJwt();
}

export default function ExamScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id, quizData, courseTitle, difficulty } = useLocalSearchParams<{
    id: string;
    quizData?: string;
    courseTitle?: string;
    difficulty?: string;
  }>();
  const gradientId = useMemo(() => `examGrad-${Date.now()}`, []);

  const questions: QuizQuestion[] = useMemo(() => {
    if (!quizData) return [];
    try {
      const parsed = JSON.parse(quizData);
      return Array.isArray(parsed) ? parsed : (parsed.questions ?? []);
    } catch {
      return [];
    }
  }, [quizData]);

  const accentColor = Palette.primary;
  const displayTitle = courseTitle ?? "แบบทดสอบ";

  const [phase, setPhase] = useState<Phase>("exam");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const currentQ = questions[currentIndex];
  const selectedAnswer = answers[currentQ?.id ?? ""];
  const isAnswered = !!selectedAnswer;

  const score = questions.filter((q) => answers[q.id] === q.answer).length;

  const handleSelectAnswer = (choice: string) => {
    if (isAnswered || !currentQ) return;
    setAnswers((prev) => ({ ...prev, [currentQ.id]: choice }));
    setShowExplanation(false);
  };

  const handleNext = () => {
    setShowExplanation(false);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    setSubmitting(true);
    try {
      const token = await getToken();
      const wrong = questions.length - score;
      if (token && id) {
        const apiBase = process.env.EXPO_PUBLIC_API_BASE_URL;
        await fetch(`${apiBase}/quiz/complete`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ id, correct: score, wrong }),
        });
      }
    } catch (e) {
      Alert.alert("หมายเหตุ: บันทึกผลไม่สำเร็จ", "แต่ผลการสอบยังคงไว้ให้ผ่าน");
    } finally {
      setSubmitting(false);
      setPhase("result");
    }
  };

  const handleRestart = () => {
    setAnswers({});
    setCurrentIndex(0);
    setShowExplanation(false);
    setPhase("exam");
  };

  const scorePercent =
    questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
  const passed = scorePercent >= 60;

  if (questions.length === 0) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 bg-surface-alt items-center justify-center px-8">
          <ClipboardList size={48} color="#CBD5E1" strokeWidth={1.5} />
          <Text className="text-lg font-bold text-brand-text mt-4 mb-2 text-center">
            ไม่มีข้อสอบ
          </Text>
          <Text className="text-sm text-brand-muted text-center mb-6">
            ไม่ได้รับข้อมูลแบบทดสอบ กรุณากลับและลองใหม่
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="px-6 py-3 rounded-xl"
            style={{ backgroundColor: accentColor }}
          >
            <Text className="text-white font-bold">กลับ</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  const renderExam = () => (
    <ScrollView
      className="flex-1 px-5"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 40, paddingTop: 8 }}
    >
      {/* Progress dots */}
      <View className="flex-row gap-1.5 mb-4 justify-center flex-wrap">
        {questions.map((q, i) => (
          <View
            key={q.id}
            className="rounded-full"
            style={{
              width: 8,
              height: 8,
              backgroundColor: answers[q.id]
                ? answers[q.id] === q.answer
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
        <View
          className="px-2.5 py-1 rounded-lg self-start mb-4"
          style={{ backgroundColor: accentColor + "20" }}
        >
          <Text className="text-xs font-bold" style={{ color: accentColor }}>
            ข้อ {currentIndex + 1}/{questions.length}
          </Text>
        </View>

        <Text className="text-base font-bold text-brand-text leading-7 mb-5">
          {currentQ?.question}
        </Text>

        {/* Choices from array */}
        {currentQ?.choices.map((choiceText, ci) => {
          const choiceKey = String(ci);
          const isSelected = selectedAnswer === choiceKey;
          const isRightAnswer =
            currentQ.answer === choiceKey || currentQ.answer === choiceText;
          let borderColor: string = "transparent";
          let textColor: string = Palette.textSecondary ?? "#64748B";

          if (isAnswered) {
            if (isRightAnswer) {
              borderColor = "#10B981";
              textColor = "#10B981";
            } else if (isSelected) {
              borderColor = "#EF4444";
              textColor = "#EF4444";
            }
          } else if (isSelected) {
            borderColor = accentColor;
            textColor = accentColor;
          }

          return (
            <TouchableOpacity
              key={ci}
              className="bg-surface-alt rounded-xl p-4 mb-2.5 flex-row items-center"
              style={{ borderWidth: 2, borderColor }}
              activeOpacity={isAnswered ? 1 : 0.7}
              onPress={() => handleSelectAnswer(choiceKey)}
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
                <Text className="text-sm font-black text-white">
                  {["A", "B", "C", "D"][ci] ?? String(ci + 1)}
                </Text>
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
        {isAnswered && currentQ?.explanation && (
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
                  {currentQ.explanation}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {isAnswered && (
        <TouchableOpacity
          className="rounded-xl py-4 flex-row items-center justify-center"
          style={{ backgroundColor: submitting ? "#94A3B8" : accentColor }}
          activeOpacity={0.8}
          disabled={submitting}
          onPress={handleNext}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Text className="text-white font-black text-base mr-2">
                {currentIndex < questions.length - 1 ? "ข้อถัดไป" : "ส่งคำตอบ"}
              </Text>
              <ChevronRight size={20} color="white" strokeWidth={2.5} />
            </>
          )}
        </TouchableOpacity>
      )}
    </ScrollView>
  );

  const renderResult = () => (
    <ScrollView
      className="flex-1 px-5"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 40, paddingTop: 8 }}
    >
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
          {difficulty
            ? ` · ระดับ${difficulty === "easy" ? "ง่าย" : difficulty === "medium" ? "ปานกลาง" : "ยาก"}`
            : ""}
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
            <Text className="text-white font-bold text-sm">กลับ</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text className="text-base font-bold text-brand-text mb-3">
        เฉลยข้อสอบ
      </Text>
      {questions.map((q, i) => {
        const userAnswer = answers[q.id];
        const correct =
          userAnswer === q.answer || q.choices[Number(userAnswer)] === q.answer;
        const correctText =
          q.choices.find((c) => c === q.answer) ??
          q.choices[Number(q.answer)] ??
          q.answer;
        const userText =
          userAnswer !== undefined
            ? (q.choices[Number(userAnswer)] ?? userAnswer)
            : "-";
        return (
          <View
            key={q.id}
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
                <Text className="text-xs text-success">✓ {correctText}</Text>
                {!correct && (
                  <Text className="text-xs text-danger mt-0.5">
                    ✗ คุณตอบ: {userText}
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
        <View className="relative" style={{ height: 130 + insets.top }}>
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
                <Text
                  className="text-xl font-black text-white"
                  numberOfLines={1}
                >
                  {displayTitle}
                </Text>
                <Text className="text-sm text-white/80">
                  {phase === "exam"
                    ? `ข้อ ${currentIndex + 1}/${questions.length}`
                    : `${score}/${questions.length} ถูก`}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {phase === "exam" ? renderExam() : renderResult()}
      </View>
    </>
  );
}
