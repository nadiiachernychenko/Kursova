import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Image,
  ScrollView,
  Alert,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import {
  answerExpertLesson,
  getExpertLessons,
  resetExpertLessonProgress,
  type ExpertLesson,
  type ExpertLessonAnswerResult,
} from "../../lib/eduApi";
import { useEduProfile } from "../../lib/useEduProfile";
import { useAppTheme } from "../../lib/theme";

const LEAVES = require("../../../assets/leaves-texture.png");

const FONTS = {
  title: "Nunito_800ExtraBold",
  title2: "Nunito_700Bold",
  body: "Manrope_600SemiBold",
  strong: "Manrope_700Bold",
} as const;

type Phase = "read" | "question" | "result";

type ResultState = {
  correct: boolean;
  tryAgain: boolean;
  pointsAdded: number;
  text: string;
};

export default function EcoExpertLevel2LessonScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { refresh } = useEduProfile();
  const { isDark } = useAppTheme();

  const lessonId = route.params?.lessonId as string;

  const COLORS = {
    bgTop: isDark ? "#10261D" : "#E8F6ED",
    bgBottom: isDark ? "#091711" : "#F7FCF8",
    veil: isDark ? "rgba(0,0,0,0.14)" : "rgba(255,255,255,0.18)",
    card: isDark ? "rgba(16,34,27,0.97)" : "rgba(255,255,255,0.98)",
    cardSoft: isDark ? "#173126" : "#F2F8F4",
    line: isDark ? "rgba(156,214,180,0.12)" : "rgba(44,108,75,0.10)",
    text: isDark ? "#F4FFF8" : "#173626",
    sub: isDark ? "#B8D5C3" : "#617868",
    accent: "#2F9E68",
    accentDeep: "#226F49",
    accentSoft: isDark ? "rgba(47,158,104,0.16)" : "#E5F4EB",
    wrongSoft: isDark ? "rgba(224,109,109,0.13)" : "#FFF2F2",
    rightSoft: isDark ? "rgba(47,158,104,0.16)" : "#EAF7EF",
headerBg: isDark ? "#214636" : "#DFF7EE",
backText: isDark ? "#E8E2B8" : "#5F7E50",
    shadow: "#000000",
  };

  const [items, setItems] = useState<ExpertLesson[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<Phase>("read");
  const [attemptNo, setAttemptNo] = useState(1);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [result, setResult] = useState<ResultState | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [readReady, setReadReady] = useState(false);

  const aliveRef = useRef(true);
  const inFlightRef = useRef(false);

  const load = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    try {
      setLoading(true);
      setMsg(null);

      const data = await getExpertLessons(2);

      if (!aliveRef.current) return;

      setItems(data);
    } catch (e: any) {
      if (!aliveRef.current) return;
      setMsg(e?.message ?? "Не вдалося завантажити урок");
    } finally {
      if (aliveRef.current) setLoading(false);
      inFlightRef.current = false;
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      aliveRef.current = true;
      load();

      return () => {
        aliveRef.current = false;
      };
    }, [load])
  );

  const lesson = useMemo(
    () => items.find((x) => x.id === lessonId) ?? null,
    [items, lessonId]
  );

  const nextLesson = useMemo(() => {
    if (!lesson) return null;
    const currentIndex = items.findIndex((x) => x.id === lesson.id);
    return items.slice(currentIndex + 1).find((x) => !x.is_done) ?? null;
  }, [items, lesson]);

  const handleReadScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (phase !== "read") return;
    const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
    if (contentOffset.y + layoutMeasurement.height >= contentSize.height - 28) {
      setReadReady(true);
    }
  };

  const handleAnswer = async (choiceIndex: number) => {
    if (!lesson) return;

    try {
      setBusy(true);
      setSelectedIndex(choiceIndex);
      setMsg(null);

      const res: ExpertLessonAnswerResult = await answerExpertLesson(
        lesson.id,
        choiceIndex,
        attemptNo
      );

      if (res?.ok === false && res?.reason === "already_done") {
        await refresh();
        await load();
        setResult({
          correct: true,
          tryAgain: false,
          pointsAdded: 0,
          text: "Урок уже пройдено.",
        });
        setPhase("result");
        return;
      }

      if (res?.ok === false && res?.reason === "not_found") {
        throw new Error("Урок не знайдено");
      }

      if (res.correct) {
        const pointsText =
          Number(res.points_added ?? 0) > 0 ? `\n\n+${Number(res.points_added ?? 0)} балів` : "";

        setResult({
          correct: true,
          tryAgain: false,
          pointsAdded: Number(res.points_added ?? 0),
          text: `✅ Правильно!${pointsText}${res.explain ? `\n\n${res.explain}` : ""}`,
        });
        setPhase("result");
        await refresh();
        await load();
        return;
      }

      if (res.try_again) {
        setResult({
          correct: false,
          tryAgain: true,
          pointsAdded: 0,
          text: res.explain ?? "2 шанс — прочитай текст ще раз уважніше.",
        });
        setPhase("result");
        return;
      }

      setResult({
        correct: false,
        tryAgain: false,
        pointsAdded: 0,
        text: `❌ Неправильно.${res.explain ? `\n\n${res.explain}` : ""}`,
      });
      setPhase("result");
    } catch (e: any) {
      Alert.alert("Помилка", e?.message ?? "Не вдалося перевірити відповідь");
    } finally {
      setBusy(false);
    }
  };
const handleResetLesson = async () => {
  if (!lesson) return;

  try {
    setBusy(true);
    setMsg(null);

    const res = await resetExpertLessonProgress(lesson.id);

    if (res?.ok === false && res?.reason === "not_found") {
      throw new Error("Урок не знайдено");
    }

    if (res?.ok === false && res?.reason === "not_done") {
      setMsg("Урок ще не був пройдений.");
      return;
    }

    await refresh();
    await load();

    setPhase("read");
    setAttemptNo(1);
    setSelectedIndex(null);
    setResult(null);
    setReadReady(false);
    setMsg("Прогрес уроку скинуто. Можна пройти ще раз.");
  } catch (e: any) {
    Alert.alert("Помилка", e?.message ?? "Не вдалося скинути прогрес уроку");
  } finally {
    setBusy(false);
  }
};
  if (loading && !lesson) {
    return (
      <View style={styles.root}>
        <LinearGradient
          colors={[COLORS.bgTop, COLORS.bgBottom]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.bg}
        />
        <Image source={LEAVES} style={[styles.texture, { opacity: isDark ? 0.04 : 0.06 }]} resizeMode="cover" />
        <View style={[styles.veil, { backgroundColor: COLORS.veil }]} />
        <View style={styles.centerState}>
          <ActivityIndicator color={COLORS.accentDeep} />
          <Text style={[styles.centerText, { color: COLORS.sub }]}>Завантаження уроку…</Text>
        </View>
      </View>
    );
  }

  if (!lesson) {
    return (
      <View style={styles.root}>
        <LinearGradient
          colors={[COLORS.bgTop, COLORS.bgBottom]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.bg}
        />
        <Image source={LEAVES} style={[styles.texture, { opacity: isDark ? 0.04 : 0.06 }]} resizeMode="cover" />
        <View style={[styles.veil, { backgroundColor: COLORS.veil }]} />

        <View style={styles.fixedHeaderWrap}>
          <View
            style={[
              styles.fixedHeader,
              {
                backgroundColor: COLORS.headerBg,
                borderColor: COLORS.line,
                shadowColor: COLORS.shadow,
              },
            ]}
          >
            <Pressable
              onPress={() => navigation.goBack()}
              style={({ pressed }) => [
                styles.backChip,
                {
                  backgroundColor: isDark ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.55)",
                  borderColor: COLORS.line,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Text style={[styles.backChipText, { color: COLORS.backText }]}>Назад</Text>
            </Pressable>

            <Text style={[styles.headerTitle, { color: COLORS.text }]}>Урок</Text>
          </View>
        </View>

        <View style={styles.centerState}>
          <Text style={[styles.centerTitle, { color: COLORS.text }]}>Урок не знайдено</Text>
          <Pressable
            style={({ pressed }) => [
              styles.mainBtn,
              {
                backgroundColor: COLORS.accent,
                borderColor: COLORS.accent,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.mainBtnText}>Повернутися</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[COLORS.bgTop, COLORS.bgBottom]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.bg}
      />
      <Image source={LEAVES} style={[styles.texture, { opacity: isDark ? 0.04 : 0.06 }]} resizeMode="cover" />
      <View style={[styles.veil, { backgroundColor: COLORS.veil }]} />

      <View style={styles.fixedHeaderWrap}>
        <View
          style={[
            styles.fixedHeader,
            {
              backgroundColor: COLORS.headerBg,
              borderColor: COLORS.line,
              shadowColor: COLORS.shadow,
            },
          ]}
        >
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [
              styles.backChip,
              {
                backgroundColor: isDark ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.55)",
                borderColor: COLORS.line,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Text style={[styles.backChipText, { color: COLORS.backText }]}>Назад</Text>
          </Pressable>

          <Text style={[styles.headerTitle, { color: COLORS.text }]}>{lesson.title}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        onScroll={handleReadScroll}
        scrollEventThrottle={16}
      >
        <View
          style={[
            styles.articleCard,
            {
              backgroundColor: COLORS.card,
              borderColor: COLORS.line,
              shadowColor: COLORS.shadow,
            },
          ]}
        >
         {phase === "result" ? (
  <>
    <View
      style={[
        styles.resultBox,
        {
          backgroundColor: result?.correct ? COLORS.rightSoft : COLORS.wrongSoft,
          borderColor: COLORS.line,
        },
      ]}
    >
      <Text style={[styles.resultText, { color: COLORS.text }]}>{result?.text}</Text>
    </View>

    {result?.correct ? (
      <Pressable
        onPress={() => {
          if (nextLesson) {
            navigation.replace("EcoExpertLevel2Lesson", { lessonId: nextLesson.id });
          } else {
            navigation.goBack();
          }
        }}
        style={({ pressed }) => [
          styles.mainBtn,
          {
            backgroundColor: COLORS.accent,
            borderColor: COLORS.accent,
            opacity: pressed ? 0.9 : 1,
          },
        ]}
      >
        <Text style={styles.mainBtnText}>
          {nextLesson ? "Перейти до наступного уроку" : "Повернутися до списку"}
        </Text>
      </Pressable>
    ) : result?.tryAgain ? (
      <Pressable
        onPress={() => {
          setPhase("read");
          setAttemptNo(2);
          setSelectedIndex(null);
          setResult(null);
          setReadReady(false);
        }}
        style={({ pressed }) => [
          styles.mainBtn,
          {
            backgroundColor: COLORS.accent,
            borderColor: COLORS.accent,
            opacity: pressed ? 0.9 : 1,
          },
        ]}
      >
        <Text style={styles.mainBtnText}>Прочитати ще раз</Text>
      </Pressable>
    ) : (
      <Pressable
        onPress={() => navigation.goBack()}
        style={({ pressed }) => [
          styles.mainBtn,
          {
            backgroundColor: COLORS.accent,
            borderColor: COLORS.accent,
            opacity: pressed ? 0.9 : 1,
          },
        ]}
      >
        <Text style={styles.mainBtnText}>Повернутися до списку</Text>
      </Pressable>
    )}
  </>
) : lesson.is_done ? (
  <>
    <View style={[styles.doneBox, { backgroundColor: COLORS.accentSoft, borderColor: COLORS.line }]}>
      <Text style={[styles.doneText, { color: COLORS.text }]}>Цей урок уже пройдено ✅</Text>
    </View>

    <Pressable
      disabled={busy}
      onPress={handleResetLesson}
      style={({ pressed }) => [
        styles.secondaryBtn,
        {
          backgroundColor: COLORS.cardSoft,
          borderColor: COLORS.line,
          opacity: busy ? 0.6 : pressed ? 0.9 : 1,
        },
      ]}
    >
      <Text style={[styles.secondaryBtnText, { color: COLORS.text }]}>
        Хочу перепройти
      </Text>
    </Pressable>
  </>
) : phase === "read" ? (
            <>
              <Text style={[styles.readText, { color: COLORS.text }]}>{lesson.content}</Text>

              {readReady ? (
                <Pressable
                  onPress={() => {
                    setPhase("question");
                    setSelectedIndex(null);
                    setResult(null);
                  }}
                  style={({ pressed }) => [
                    styles.mainBtn,
                    {
                      backgroundColor: COLORS.accent,
                      borderColor: COLORS.accent,
                      opacity: pressed ? 0.9 : 1,
                    },
                  ]}
                >
                  <Text style={styles.mainBtnText}>Перейти до запитань</Text>
                </Pressable>
              ) : null}
            </>
          ) : phase === "question" ? (
            <>
              <View style={[styles.questionBox, { backgroundColor: COLORS.cardSoft, borderColor: COLORS.line }]}>
                <Text style={[styles.questionLabel, { color: COLORS.sub }]}>Питання по темі</Text>
                <Text style={[styles.questionText, { color: COLORS.text }]}>{lesson.question}</Text>
              </View>

              {[lesson.option_a, lesson.option_b, lesson.option_c].map((opt, idx) => (
                <Pressable
                  key={`${lesson.id}-${idx}`}
                  disabled={busy}
                  onPress={() => handleAnswer(idx)}
                  style={({ pressed }) => [
                    styles.optionBtn,
                    {
                      backgroundColor: COLORS.cardSoft,
                      borderColor: selectedIndex === idx ? COLORS.accent : COLORS.line,
                      opacity: busy ? 0.65 : pressed ? 0.92 : 1,
                    },
                  ]}
                >
                  <View style={styles.optionLeft}>
                    <View
                      style={[
                        styles.optionDot,
                        {
                          borderColor: COLORS.accentDeep,
                          backgroundColor: isDark ? "rgba(255,255,255,0.02)" : "#FFFFFF",
                        },
                      ]}
                    >
                      <Text style={[styles.optionDotText, { color: COLORS.accentDeep }]}>
                        {String.fromCharCode(65 + idx)}
                      </Text>
                    </View>

                    <Text style={[styles.optionText, { color: COLORS.text }]}>{opt}</Text>
                  </View>

                  {busy && selectedIndex === idx ? (
                    <ActivityIndicator size="small" color={COLORS.accentDeep} />
                  ) : null}
                </Pressable>
              ))}
            </>
          ) : (
            <>
              <View
                style={[
                  styles.resultBox,
                  {
                    backgroundColor: result?.correct ? COLORS.rightSoft : COLORS.wrongSoft,
                    borderColor: COLORS.line,
                  },
                ]}
              >
                <Text style={[styles.resultText, { color: COLORS.text }]}>{result?.text}</Text>
              </View>

              {result?.correct ? (
                <Pressable
                  onPress={() => {
                    if (nextLesson) {
                      navigation.replace("EcoExpertLevel2Lesson", { lessonId: nextLesson.id });
                    } else {
                      navigation.goBack();
                    }
                  }}
                  style={({ pressed }) => [
                    styles.mainBtn,
                    {
                      backgroundColor: COLORS.accent,
                      borderColor: COLORS.accent,
                      opacity: pressed ? 0.9 : 1,
                    },
                  ]}
                >
                  <Text style={styles.mainBtnText}>
  {nextLesson ? "Перейти до наступного уроку" : "Повернутися до списку"}
</Text>
                </Pressable>
              ) : result?.tryAgain ? (
                <Pressable
                  onPress={() => {
                    setPhase("read");
                    setAttemptNo(2);
                    setSelectedIndex(null);
                    setResult(null);
                    setReadReady(false);
                  }}
                  style={({ pressed }) => [
                    styles.mainBtn,
                    {
                      backgroundColor: COLORS.accent,
                      borderColor: COLORS.accent,
                      opacity: pressed ? 0.9 : 1,
                    },
                  ]}
                >
                  <Text style={styles.mainBtnText}>Прочитати ще раз</Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={() => navigation.goBack()}
                  style={({ pressed }) => [
                    styles.mainBtn,
                    {
                      backgroundColor: COLORS.accent,
                      borderColor: COLORS.accent,
                      opacity: pressed ? 0.9 : 1,
                    },
                  ]}
                >
                  <Text style={styles.mainBtnText}>Повернутися до списку</Text>
                </Pressable>
              )}
            </>
          )}

          {msg ? (
            <View style={[styles.msgBox, { backgroundColor: COLORS.wrongSoft, borderColor: COLORS.line }]}>
              <Text style={[styles.msgText, { color: COLORS.text }]}>{msg}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "transparent" },
  bg: { ...StyleSheet.absoluteFillObject },
  texture: { ...StyleSheet.absoluteFillObject, transform: [{ scale: 1.08 }] },
  veil: { ...StyleSheet.absoluteFillObject },

  fixedHeaderWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
  },

  fixedHeader: {
    minHeight: 116,
    borderWidth: 1,
    borderRadius: 0,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },

  backChip: {
    alignSelf: "flex-start",
    minWidth: 62,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
      marginTop: 2,

  },

  backChipText: {
    fontFamily: FONTS.strong,
    fontSize: 12,
  },

  headerTitle: {
    textAlign: "center",
    fontFamily: FONTS.title2,
    fontSize: 18,
    lineHeight: 24,
    marginTop: 10,
  },

  content: {
    paddingHorizontal: 8,
    paddingTop: 132,
    paddingBottom: 18,
  },
secondaryBtn: {
  minHeight: 42,
  borderWidth: 1,
  borderRadius: 14,
  alignItems: "center",
  justifyContent: "center",
  paddingHorizontal: 14,
  marginTop: 6,
},

secondaryBtnText: {
  fontFamily: FONTS.strong,
  fontSize: 14,
},
  articleCard: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 16,
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 1,
    gap: 12,
  },

  readText: {
    fontFamily: FONTS.body,
    fontSize: 15,
    lineHeight: 25,
  },

  questionBox: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    gap: 8,
  },

  questionLabel: {
    fontFamily: FONTS.strong,
    fontSize: 13,
  },

  questionText: {
    fontFamily: FONTS.title2,
    fontSize: 18,
    lineHeight: 24,
  },

  optionBtn: {
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 13,
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  optionLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  optionDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  optionDotText: {
    fontFamily: FONTS.strong,
    fontSize: 13,
  },

  optionText: {
    flex: 1,
    fontFamily: FONTS.strong,
    fontSize: 14,
    lineHeight: 20,
  },

  resultBox: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
  },

  resultText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    lineHeight: 20,
  },

  mainBtn: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    marginTop: 18,
    marginBottom: 2,
  },

  mainBtnText: {
    color: "#FFFFFF",
    fontFamily: FONTS.strong,
    fontSize: 14,
  },

  doneBox: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },

  doneText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    lineHeight: 20,
  },

  msgBox: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
  },

  msgText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    lineHeight: 20,
  },

  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 24,
  },

  centerTitle: {
    fontFamily: FONTS.title2,
    fontSize: 18,
    textAlign: "center",
  },

  centerText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    textAlign: "center",
  },

  backBtn: {
    minHeight: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },

  backBtnText: {
    color: "#FFFFFF",
    fontFamily: FONTS.strong,
    fontSize: 14,
  },
});