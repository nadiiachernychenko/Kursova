import React, { useCallback, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Image,
  ScrollView,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { getExpertCase, answerExpertCase, type ExpertCase } from "../../lib/eduApi";
import { useEduProfile } from "../../lib/useEduProfile";
import { useAppTheme } from "../../lib/theme";

const LEAVES = require("../../../assets/leaves-texture.png");

const FONTS = {
  title: "Nunito_800ExtraBold",
  title2: "Nunito_700Bold",
  body: "Manrope_600SemiBold",
  strong: "Manrope_700Bold",
} as const;

const cleanExplain = (text?: string | null) => {
  return (text ?? "")
    .replace(/^Правильно[.!:]?\s*/i, "")
    .replace(/^Неправильно[.!:]?\s*/i, "")
    .trim();
};

export default function EcoExpertLevel3Screen() {
  const { refresh, expertLevel } = useEduProfile();
  const { isDark } = useAppTheme();

  const COLORS = {
    bgTop: isDark ? "#112C21" : "#E6F6EC",
    bgBottom: isDark ? "#091811" : "#F5FBF7",
    veil: isDark ? "rgba(0,0,0,0.16)" : "rgba(255,255,255,0.2)",
    card: isDark ? "rgba(16, 35, 27, 0.96)" : "rgba(255,255,255,0.96)",
    cardSoft: isDark ? "#173327" : "#F0F7F2",
    line: isDark ? "rgba(146, 211, 170, 0.14)" : "rgba(44, 108, 75, 0.12)",
    text: isDark ? "#F3FFF7" : "#173626",
    sub: isDark ? "#B6D2C0" : "#607766",
    accent: "#2FA36B",
    accentDeep: "#237E53",
    accentSoft: isDark ? "rgba(47,163,107,0.16)" : "#E4F5EB",
    wrongSoft: isDark ? "rgba(224,109,109,0.13)" : "#FFF2F2",
    rightSoft: isDark ? "rgba(47,163,107,0.16)" : "#EAF8F0",
    shadow: "#000000",
  };

  const [item, setItem] = useState<ExpertCase | null>(null);
  const [loading, setLoading] = useState(false);
  const [answerBusy, setAnswerBusy] = useState<number | null>(null);
  const [resultOpen, setResultOpen] = useState(false);
  const [resultText, setResultText] = useState<string | null>(null);
  const [resultCorrect, setResultCorrect] = useState<boolean | null>(null);

  const aliveRef = useRef(true);
  const inFlightRef = useRef(false);

  const unlocked = (expertLevel ?? 0) >= 3;

  const load = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    try {
      setLoading(true);
      setResultOpen(false);
      setResultText(null);
      setResultCorrect(null);

      const data = await getExpertCase(3);

      if (!aliveRef.current) return;

      setItem(data);
    } catch (e: any) {
      if (!aliveRef.current) return;
      setResultText(e?.message ?? "Не вдалося завантажити ситуацію");
    } finally {
      if (aliveRef.current) setLoading(false);
      inFlightRef.current = false;
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      aliveRef.current = true;
      refresh();
      load();

      return () => {
        aliveRef.current = false;
      };
    }, [refresh, load])
  );

  const pick = async (index: number) => {
    if (!item || resultOpen || answerBusy !== null) return;

    try {
      setAnswerBusy(index);

      const res = await answerExpertCase(item.id, index);

      const correct = !!res.correct;
      const points = Number(res.points_added ?? 0);
      const explain = cleanExplain(res.explain);

      setResultCorrect(correct);

      if (correct) {
        setResultText(`+${points} балів\n\n${explain}`);
        await refresh();
      } else {
        setResultText(explain);
      }

      setResultOpen(true);
    } catch (e: any) {
      setResultText(e?.message ?? "Помилка");
      setResultCorrect(false);
      setResultOpen(true);
    } finally {
      setAnswerBusy(null);
    }
  };

  if (!unlocked) {
    return (
      <View style={styles.root}>
        <LinearGradient
          colors={[COLORS.bgTop, COLORS.bgBottom]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.bg}
        />
        <Image
          source={LEAVES}
          style={[styles.texture, { opacity: isDark ? 0.05 : 0.07 }]}
          resizeMode="cover"
        />
        <View style={[styles.veil, { backgroundColor: COLORS.veil }]} />

        <View style={styles.lockedWrap}>
          <View
            style={[
              styles.lockedCard,
              {
                backgroundColor: COLORS.card,
                borderColor: COLORS.line,
                shadowColor: COLORS.shadow,
              },
            ]}
          >
            <Text style={styles.lockedEmoji}>🧩</Text>
            <Text style={[styles.lockedTitle, { color: COLORS.text }]}>
              Еко-ситуації • Level 3
            </Text>
            <Text style={[styles.lockedSub, { color: COLORS.sub }]}>
              Цей розділ відкривається після переходу на третій рівень.
            </Text>
          </View>
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

      <Image
        source={LEAVES}
        style={[styles.texture, { opacity: isDark ? 0.05 : 0.07 }]}
        resizeMode="cover"
      />

      <View style={[styles.veil, { backgroundColor: COLORS.veil }]} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={isDark ? ["#18392A", "#11271D"] : ["#DCEFE3", "#EEF8F1"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.hero,
            {
              borderColor: COLORS.line,
              shadowColor: COLORS.shadow,
            },
          ]}
        >
          <View style={styles.heroTop}>
            <View
              style={[
                styles.badge,
                { backgroundColor: COLORS.accentSoft, borderColor: COLORS.line },
              ]}
            >
              <Text style={[styles.badgeText, { color: COLORS.accentDeep }]}>
                Eco Expert
              </Text>
            </View>

            <View style={[styles.levelPill, { borderColor: COLORS.line }]}>
              <Text style={[styles.levelPillText, { color: COLORS.text }]}>Level 3</Text>
            </View>
          </View>

          <Text style={[styles.heroTitle, { color: COLORS.text }]}>Еко-ситуації🧩</Text>

          <Text style={[styles.heroSub, { color: COLORS.sub }]}>
            Обирай правильне рішення у життєвих ситуаціях та отримуй бали.
          </Text>
        </LinearGradient>

        {resultOpen ? (
          <View
            style={[
              styles.resultScreenCard,
              {
                backgroundColor: resultCorrect ? COLORS.rightSoft : COLORS.wrongSoft,
                borderColor: COLORS.line,
                shadowColor: COLORS.shadow,
              },
            ]}
          >
            <Text style={styles.resultBigEmoji}>{resultCorrect ? "✅" : "🌱"}</Text>

            <Text style={[styles.resultScreenTitle, { color: COLORS.text }]}>
              {resultCorrect ? "Правильно!" : "Неправильно"}
            </Text>

            <Text style={[styles.resultScreenText, { color: COLORS.sub }]}>
              {resultText}
            </Text>

            <Pressable
              style={({ pressed }) => [
                styles.nextBtn,
                {
                  backgroundColor: COLORS.accent,
                  borderColor: COLORS.accent,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
              onPress={load}
            >
              <Text style={styles.nextBtnText}>Наступна ситуація →</Text>
            </Pressable>
          </View>
        ) : null}

        {loading && !resultOpen ? (
          <View
            style={[
              styles.infoBox,
              {
                backgroundColor: COLORS.card,
                borderColor: COLORS.line,
              },
            ]}
          >
            <ActivityIndicator color={COLORS.accent} />
            <Text style={[styles.infoText, { color: COLORS.sub }]}>
              Завантажуємо ситуацію...
            </Text>
          </View>
        ) : null}

        {item && !resultOpen ? (
          <View
            style={[
              styles.card,
              {
                backgroundColor: COLORS.card,
                borderColor: COLORS.line,
                shadowColor: COLORS.shadow,
              },
            ]}
          >
            <View style={styles.caseTop}>
              <View
                style={[
                  styles.caseIcon,
                  {
                    backgroundColor: COLORS.accentSoft,
                    borderColor: COLORS.line,
                  },
                ]}
              >
                <Text style={[styles.caseIconText, { color: COLORS.accentDeep }]}>?</Text>
              </View>

              <View style={styles.caseTitleWrap}>
                <Text style={[styles.caseTitle, { color: COLORS.text }]}>Ситуація</Text>
                <Text style={[styles.caseSub, { color: COLORS.sub }]}>
                  Обери найкращу відповідь
                </Text>
              </View>
            </View>

            <Text style={[styles.story, { color: COLORS.sub }]}>{item.story}</Text>

            <View
              style={[
                styles.questionBox,
                {
                  backgroundColor: COLORS.cardSoft,
                  borderColor: COLORS.line,
                },
              ]}
            >
              <Text style={[styles.question, { color: COLORS.text }]}>{item.question}</Text>
            </View>

            <View style={styles.optionsWrap}>
              {item.options.map((opt, i) => (
                <Pressable
                  key={i}
                  disabled={answerBusy !== null || resultOpen}
                  onPress={() => pick(i)}
                  style={({ pressed }) => [
                    styles.option,
                    {
                      backgroundColor: COLORS.cardSoft,
                      borderColor: COLORS.line,
                      opacity: pressed ? 0.9 : 1,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.optionNum,
                      {
                        backgroundColor: COLORS.accentSoft,
                        borderColor: COLORS.line,
                      },
                    ]}
                  >
                    <Text style={[styles.optionNumText, { color: COLORS.accentDeep }]}>
                      {String.fromCharCode(65 + i)}
                    </Text>
                  </View>

                  <Text style={[styles.optionText, { color: COLORS.text }]}>{opt}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {!item && !loading && !resultOpen ? (
          <View
            style={[
              styles.finishCard,
              {
                backgroundColor: COLORS.rightSoft,
                borderColor: COLORS.line,
              },
            ]}
          >
            <Text style={styles.finishEmoji}>🎉</Text>
            <Text style={[styles.finishTitle, { color: COLORS.text }]}>
              Рівень 3 завершено
            </Text>
            <Text style={[styles.finishSub, { color: COLORS.sub }]}>
              Ти пройшла всі еко-ситуації цього рівня.
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "transparent" },
  bg: { ...StyleSheet.absoluteFillObject },
  texture: { ...StyleSheet.absoluteFillObject, transform: [{ scale: 1.12 }] },
  veil: { ...StyleSheet.absoluteFillObject },

  content: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 18,
    gap: 10,
  },

  hero: {
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
    gap: 8,
  },

  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  badge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  badgeText: {
    fontFamily: FONTS.strong,
    fontSize: 11,
  },

  levelPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(255,255,255,0.22)",
  },

  levelPillText: {
    fontFamily: FONTS.strong,
    fontSize: 11,
  },

  heroTitle: {
    fontFamily: FONTS.title,
    fontSize: 20,
    lineHeight: 24,
  },

  heroSub: {
    fontFamily: FONTS.body,
    fontSize: 13,
    lineHeight: 18,
  },

  infoBox: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    gap: 8,
  },

  infoText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },

  card: {
    borderWidth: 1,
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 14,
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
    gap: 12,
  },

  caseTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  caseIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  caseIconText: {
    fontFamily: FONTS.strong,
    fontSize: 16,
  },

  caseTitleWrap: {
    flex: 1,
  },

  caseTitle: {
    fontFamily: FONTS.title2,
    fontSize: 17,
    lineHeight: 22,
  },

  caseSub: {
    fontFamily: FONTS.body,
    fontSize: 13,
    lineHeight: 18,
  },

  story: {
    fontFamily: FONTS.body,
    fontSize: 14,
    lineHeight: 20,
  },

  questionBox: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
  },

  question: {
    fontFamily: FONTS.title2,
    fontSize: 17,
    lineHeight: 23,
  },

  optionsWrap: {
    gap: 8,
  },

  option: {
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  optionNum: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  optionNumText: {
    fontFamily: FONTS.strong,
    fontSize: 13,
  },

  optionText: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 14,
    lineHeight: 20,
  },

  resultScreenCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    alignItems: "center",
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
    gap: 10,
  },

  resultBigEmoji: {
    fontSize: 42,
  },

  resultScreenTitle: {
    fontFamily: FONTS.title,
    fontSize: 24,
    lineHeight: 30,
    textAlign: "center",
  },

  resultScreenText: {
    fontFamily: FONTS.body,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },

  nextBtn: {
    marginTop: 4,
    minHeight: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },

  nextBtnText: {
    color: "#FFFFFF",
    fontFamily: FONTS.strong,
    fontSize: 13,
  },

  finishCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    gap: 8,
    alignItems: "center",
  },

  finishEmoji: {
    fontSize: 22,
  },

  finishTitle: {
    fontFamily: FONTS.title2,
    fontSize: 18,
    textAlign: "center",
  },

  finishSub: {
    fontFamily: FONTS.body,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },

  lockedWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  lockedCard: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    alignItems: "center",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
    gap: 8,
  },

  lockedEmoji: {
    fontSize: 28,
  },

  lockedTitle: {
    fontFamily: FONTS.title2,
    fontSize: 20,
    textAlign: "center",
  },

  lockedSub: {
    fontFamily: FONTS.body,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
});