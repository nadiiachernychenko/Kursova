import React, { useCallback, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Image,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { getExpertItem, answerExpertItem, type ExpertItem } from "../../lib/eduApi";
import { useEduProfile } from "../../lib/useEduProfile";
import { useAppTheme } from "../../lib/theme";
const LEAVES = require("../../../assets/leaves-texture.png");

const FONTS = {
  title: "Nunito_800ExtraBold",
  title2: "Nunito_700Bold",
  body: "Manrope_600SemiBold",
  strong: "Manrope_700Bold",
} as const;

export default function EcoExpertLevel1Screen() {
const navigation = useNavigation<any>();
  const { refresh } = useEduProfile();
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

  const [item, setItem] = useState<ExpertItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [answerBusy, setAnswerBusy] = useState<number | null>(null);
  const [resultOpen, setResultOpen] = useState(false);
  const [resultText, setResultText] = useState<string | null>(null);
  const [resultCorrect, setResultCorrect] = useState<boolean | null>(null);
  const [finished, setFinished] = useState(false);

  const aliveRef = useRef(true);
  const inFlightRef = useRef(false);
  const didFirstLoadRef = useRef(false);

  const load = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    try {
      setLoading(true);
      setResultOpen(false);
      setResultText(null);
      setResultCorrect(null);
      setAnswerBusy(null);

      const row = await getExpertItem(1);

      if (!aliveRef.current) return;

      if (!row) {
        setItem(null);
        setFinished(true);
        setResultOpen(false);
        setResultCorrect(null);
        setResultText(null);
        return;
      }

      setFinished(false);
      setItem(row);
    } catch (e: any) {
      if (!aliveRef.current) return;
      setItem(null);
      setFinished(false);
      setResultOpen(true);
      setResultCorrect(false);
      setResultText(e?.message ?? "Помилка завантаження");
    } finally {
      if (aliveRef.current) setLoading(false);
      inFlightRef.current = false;
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      aliveRef.current = true;

      if (!didFirstLoadRef.current) {
        didFirstLoadRef.current = true;
        load();
      }

      return () => {
        aliveRef.current = false;
      };
    }, [load])
  );

  const pick = async (choiceIndex: number) => {
    if (!item) return;
    if (answerBusy !== null) return;
    if (resultOpen) return;

    try {
      setAnswerBusy(choiceIndex);

      const data = await answerExpertItem(item.id, choiceIndex);

      if (data?.ok === false && data?.reason === "already_answered") {
        setResultCorrect(false);
        setResultOpen(true);
        setResultText("Це питання вже було. Натисни «Далі».");
        return;
      }

      const correct = !!data?.correct;
      const explain = (data?.explain ?? "").toString().trim();
      const rawPoints = Number(data?.points_added ?? 0);

      setResultCorrect(correct);

      if (correct) {
        const pointsText = rawPoints > 0 ? ` • +${rawPoints} балів` : "";
        setResultText(`✅ Правильно${pointsText}${explain ? `\n\n${explain}` : ""}`);
        await refresh();
      } else {
        setResultText(`❌ Неправильно${explain ? `\n\n${explain}` : ""}`);
      }

      setResultOpen(true);
    } catch (e: any) {
      setResultCorrect(false);
      setResultText(e?.message ?? "Помилка");
      setResultOpen(true);
    } finally {
      setAnswerBusy(null);
    }
  };

  const optionsLocked = resultOpen || answerBusy !== null;

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[COLORS.bgTop, COLORS.bgBottom]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.bg}
      />
      <Image source={LEAVES} style={[styles.texture, { opacity: isDark ? 0.05 : 0.07 }]} resizeMode="cover" />
      <View style={[styles.veil, { backgroundColor: COLORS.veil }]} />

      <View style={styles.content}>
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
            <View style={[styles.badge, { backgroundColor: COLORS.accentSoft, borderColor: COLORS.line }]}>
              <Text style={[styles.badgeText, { color: COLORS.accentDeep }]}>Eco Expert</Text>
            </View>

            <View style={[styles.levelPill, { borderColor: COLORS.line }]}>
              <Text style={[styles.levelPillText, { color: COLORS.text }]}>Level 1</Text>
            </View>
          </View>

          <Text style={[styles.heroTitle, { color: COLORS.text }]}>Перевіримо твої еко-знання 🌿</Text>
          <Text style={[styles.heroSub, { color: COLORS.sub }]}>
            Обирай правильну відповідь та рухайся далі.
          </Text>
        </LinearGradient>

        <View
          style={[
            styles.questionCard,
            {
              backgroundColor: COLORS.card,
              borderColor: COLORS.line,
              shadowColor: COLORS.shadow,
            },
          ]}
        >
          {loading ? (
            <View style={styles.centerState}>
              <ActivityIndicator color={COLORS.accentDeep} />
              <Text style={[styles.centerStateText, { color: COLORS.sub }]}>Завантаження…</Text>
            </View>
          ) : item ? (
            <>
              <Text style={[styles.questionText, { color: COLORS.text }]} numberOfLines={4}>
                {item.question}
              </Text>

              <View style={styles.optionsWrap}>
                {item.options.map((opt, idx) => {
                  const busy = answerBusy === idx;

                  return (
                    <Pressable
                      key={idx}
                      onPress={() => pick(idx)}
                      disabled={optionsLocked}
                      style={({ pressed }) => [
                        styles.optionBtn,
                        {
                          backgroundColor: COLORS.cardSoft,
                          borderColor: COLORS.line,
                          opacity: pressed && !optionsLocked ? 0.9 : optionsLocked ? 0.62 : 1,
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

                        <Text style={[styles.optionText, { color: COLORS.text }]} numberOfLines={2}>
                          {opt}
                        </Text>
                      </View>

                      {busy ? <ActivityIndicator size="small" color={COLORS.accentDeep} /> : null}
                    </Pressable>
                  );
                })}
              </View>
            </>
          ) : finished ? (
            <View style={styles.centerState}>
              <Text style={styles.finishEmoji}>🎉</Text>
              <Text style={[styles.centerStateTitle, { color: COLORS.text }]}>Перший рівень завершено</Text>
              <Text style={[styles.centerStateText, { color: COLORS.sub }]}>
                Молодчинка! Ти вже пройшов всі питання цього рівня.
              </Text>

              <View style={styles.finishActions}>
  <Pressable
    style={({ pressed }) => [
      styles.finishPrimaryBtn,
      {
        backgroundColor: COLORS.accent,
        borderColor: COLORS.accent,
        opacity: pressed ? 0.92 : 1,
      },
    ]}
    onPress={() => navigation.navigate("PandaShop")}
  >
    <Text style={styles.finishPrimaryBtnText}>
Переглянути наступні Levels
    </Text>
  </Pressable>
</View>
            </View>
          ) : (
            <View style={styles.centerState}>
              <Text style={[styles.centerStateTitle, { color: COLORS.text }]}>Немає питань</Text>
            </View>
          )}
        </View>

        {resultText ? (
          <View
            style={[
              styles.resultCard,
              {
                backgroundColor:
                  resultCorrect === true ? COLORS.rightSoft : resultCorrect === false ? COLORS.wrongSoft : COLORS.card,
                borderColor: resultCorrect === false ? "rgba(224,109,109,0.2)" : COLORS.line,
              },
            ]}
          >
            <Text style={[styles.resultText, { color: COLORS.text }]}>{resultText}</Text>

            {!finished ? (
              <Pressable
                onPress={load}
                style={({ pressed }) => [
                  styles.nextBtn,
                  {
                    backgroundColor: COLORS.accent,
                    borderColor: COLORS.accent,
                    opacity: pressed ? 0.92 : 1,
                  },
                ]}
              >
                <Text style={styles.nextBtnText}>Далі</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "transparent" },
  bg: { ...StyleSheet.absoluteFillObject },
  texture: { ...StyleSheet.absoluteFillObject, transform: [{ scale: 1.12 }] },
  veil: { ...StyleSheet.absoluteFillObject },

  content: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
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
    gap: 6,
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

  questionCard: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1,
    padding: 14,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
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

  questionText: {
    fontFamily: FONTS.title2,
    fontSize: 19,
    lineHeight: 25,
  },

  optionsWrap: {
    marginTop: 12,
    gap: 8,
  },

  optionBtn: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 11,
    paddingHorizontal: 12,
    minHeight: 54,
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
    lineHeight: 19,
  },

  resultCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    gap: 10,
  },

  resultText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    lineHeight: 20,
  },

  nextBtn: {
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  nextBtnText: {
    color: "#FFFFFF",
    fontFamily: FONTS.strong,
    fontSize: 14,
  },

  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  centerStateTitle: {
    fontFamily: FONTS.title2,
    fontSize: 18,
    textAlign: "center",
  },

  centerStateText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },

  finishEmoji: {
    fontSize: 22,
  },

  finishActions: {
    width: "100%",
    marginTop: 8,
    gap: 8,
  },

  finishPrimaryBtn: {
    minHeight: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },

  finishPrimaryBtnText: {
    color: "#FFFFFF",
    fontFamily: FONTS.strong,
    fontSize: 13,
  },
});