import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Keyboard,
  Platform,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";

import { useAppTheme } from "../../lib/theme";
import { getBeginnerPlan } from "../../lib/ecoAssistant";

const LEAVES = require("../../../assets/leaves-texture.png");

const FONTS = {
  title: "Nunito_800ExtraBold",
  title2: "Nunito_700Bold",
  body: "Manrope_600SemiBold",
  strong: "Manrope_700Bold",
} as const;

type StepType = "multi" | "yesno" | "text";

type Step =
  | {
      id: string;
      type: "multi";
      title: string;
      subtitle?: string;
      options: string[];
      max?: number;
    }
  | {
      id: string;
      type: "yesno";
      title: string;
      subtitle?: string;
    }
  | {
      id: string;
      type: "text";
      title: string;
      subtitle?: string;
      placeholder?: string;
      minChars?: number;
    };

type Answers = Record<string, { type: StepType; value: boolean | string | string[] }>;

const shadow = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  android: { elevation: 5 },
  default: {},
});

type Colors = {
  bg: string;
  card: string;
  text: string;
  sub: string;
  line: string;
  accent: string;
  accentSoft: string;
  teal: string;
  inputBg: string;
  inputLine: string;
  placeholder: string;
};

function makeColors(colors: any, isDark: boolean): Colors {
  const accent = "#2F6F4E";
  return {
    bg: colors?.background ?? (isDark ? "#0E0F11" : "#F6F7F4"),
    card: colors?.card ?? (isDark ? "#15171A" : "#FFFFFF"),
    text: colors?.text ?? (isDark ? "#F2F3F4" : "#111214"),
    sub: isDark ? "rgba(242,243,244,0.72)" : "rgba(17,18,20,0.62)",
    line: colors?.border ?? (isDark ? "rgba(242,243,244,0.10)" : "rgba(0,0,0,0.10)"),
    accent,
    accentSoft: isDark ? "rgba(47,111,78,0.22)" : "rgba(47,111,78,0.14)",
    teal: isDark ? "rgba(90,220,170,0.85)" : "rgba(47,111,78,1)",
    inputBg: isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.72)",
    inputLine: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)",
    placeholder: isDark ? "rgba(242,243,244,0.40)" : "rgba(17,18,20,0.38)",
  };
}

export default function BeginnerQuestionsScreen() {
  const nav = useNavigation<any>();
  const { colors, isDark } = useAppTheme() as any;

  const COLORS = useMemo(() => makeColors(colors, !!isDark), [colors, isDark]);
  const styles = useMemo(() => createStyles(COLORS, !!isDark), [COLORS, isDark]);

  const steps: Step[] = useMemo(
    () => [
      {
        id: "goals",
        type: "multi",
        title: "З чого хочеш почати?",
        subtitle: "Обери все, що тобі відгукується (можна кілька).",
        options: [
          "Сортування вдома",
          "Менше пластику",
          "Еко-звички щодня",
          "Еко-покупки",
          "Економія ресурсів (вода/світло)",
          "Ком’юніті / волонтерство",
          "Пункти прийому / куди здавати",
        ],
      },
      {
        id: "experience",
        type: "yesno",
        title: "Ти вже колись сортувала сміття регулярно?",
        subtitle: "Навіть якщо недовго — це ок.",
      },
      {
        id: "home",
        type: "text",
        title: "Опиши коротко свій побут",
        subtitle: "Напр.: з ким живеш, чи є місце під контейнери, як часто готуєш тощо.",
        placeholder: "Напиши 2–5 речень…",
        minChars: 20,
      },
      {
        id: "barriers",
        type: "multi",
        title: "Що найбільше заважає?",
        subtitle: "Обери 1–3.",
        options: [
          "Не знаю, що куди",
          "Немає місця вдома",
          "Лінь/забуваю",
          "Немає пунктів прийому поруч",
          "Сім’я/оточення не підтримує",
          "Думаю, що це не має сенсу",
          "Інше",
        ],
        max: 3,
      },
      {
        id: "motivation",
        type: "text",
        title: "Чому тобі це важливо?",
        subtitle: "Це допоможе AI зробити план саме під тебе.",
        placeholder: "Напиши своїми словами…",
        minChars: 10,
      },
    ],
    []
  );

  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);

  const [isTyping, setIsTyping] = useState(false);

  const started = Object.keys(answers).length > 0;
  const finished = aiResult != null;

  const step = steps[idx];
  const currentValue = answers[step.id]?.value;

  // confirm exit mid-test
  useEffect(() => {
    const sub = nav.addListener("beforeRemove", (e: any) => {
      if (!started || finished) return;
      e.preventDefault();
      Alert.alert("Вийти з опитування?", "Ви точно хочете вийти? Відповіді не збережуться.", [
        { text: "Залишитись", style: "cancel" },
        { text: "Вийти", style: "destructive", onPress: () => nav.dispatch(e.data.action) },
      ]);
    });
    return sub;
  }, [nav, started, finished]);

  const setAnswer = (value: Answers[string]["value"]) => {
    setAnswers((prev) => ({ ...prev, [step.id]: { type: step.type, value } }));
  };

  const toggleMulti = (opt: string) => {
    const prev = Array.isArray(currentValue) ? currentValue : [];
    const exists = prev.includes(opt);
    let next = exists ? prev.filter((x) => x !== opt) : [...prev, opt];

    const max = step.type === "multi" ? step.max : undefined;
    if (!exists && max && next.length > max) next = next.slice(0, max);

    setAnswer(next);
  };

  const canNext = useMemo(() => {
    if (finished) return false;
    if (step.type === "yesno") return typeof currentValue === "boolean";
    if (step.type === "multi") return Array.isArray(currentValue) && currentValue.length > 0;
    if (step.type === "text") {
      const v = typeof currentValue === "string" ? currentValue.trim() : "";
      const min = step.minChars ?? 1;
      return v.length >= min;
    }
    return false;
  }, [step, currentValue, finished]);

  const back = () => {
    Keyboard.dismiss();
    if (idx > 0) setIdx((i) => i - 1);
  };

  const reset = () => {
    Keyboard.dismiss();
    setIdx(0);
    setAnswers({});
    setAiResult(null);
    setAiLoading(false);
  };

  const finish = async () => {
    Keyboard.dismiss();
    setAiLoading(true);
    try {
      const res = await getBeginnerPlan(answers as any);
      setAiResult(res.plan ?? "Не вдалося сформувати план.");
    } catch (e: any) {
      Alert.alert("Помилка", e?.message ?? "Не вдалося отримати відповідь AI");
    } finally {
      setAiLoading(false);
    }
  };

  const next = () => {
    if (aiLoading) return;
    if (!canNext) return;

    if (isTyping) {
      Keyboard.dismiss();
      setTimeout(() => {
        if (idx < steps.length - 1) setIdx((i) => i + 1);
        else finish();
      }, 40);
      return;
    }

    if (idx < steps.length - 1) setIdx((i) => i + 1);
    else finish();
  };

  const progress = (idx + 1) / steps.length;

  if (aiResult) {
    return (
      <View style={styles.root}>
        <LinearGradient
          colors={isDark ? ["#14241B", "#111315"] : ["#F6F9F6", "#FFFFFF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.bg}
        />
        <Image source={LEAVES} resizeMode="cover" style={styles.texture} />
        <View pointerEvents="none" style={styles.veil} />

        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <View style={styles.heroInner}>
              <View style={styles.heroTopRow}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>EcoLife • Еко-старт</Text>
                </View>
              </View>

              <Text style={styles.heroTitle}>Твій еко-старт-план 🌿</Text>
              <Text style={styles.heroSub}>AI врахував твої відповіді й зібрав план під тебе.</Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.rowInner}>
              <Text style={styles.resultText}>{aiResult}</Text>
            </View>
          </View>

          <View style={styles.actions}>
            <Pressable onPress={reset} style={({ pressed }) => [styles.actionBtnPrimary, { opacity: pressed ? 0.9 : 1 }]}>
              <Text style={styles.goTxt}>Пройти ще раз / Скинути результат</Text>
            </Pressable>

            <Pressable onPress={() => nav.goBack()} style={({ pressed }) => [styles.actionBtnGhost, { opacity: pressed ? 0.9 : 1 }]}>
              <Text style={styles.actionGhostTxt}>Назад</Text>
            </Pressable>
          </View>

          <View style={{ height: 18 }} />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={isDark ? ["#14241B", "#111315"] : ["#F6F9F6", "#FFFFFF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.bg}
      />
      <Image source={LEAVES} resizeMode="cover" style={styles.texture} />
      <View pointerEvents="none" style={styles.veil} />

      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <View style={styles.heroInner}>
            <View style={styles.heroTopRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>EcoLife • Eco-start</Text>
              </View>
            </View>

            <Text style={styles.heroTitle}>Почнемо з простого</Text>
            <Text style={styles.heroSub}>Відповідай чесно — план буде під твій ритм та умови.</Text>

            <View style={styles.progressWrap}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
              </View>
              <Text style={styles.progressMeta}>
                {idx + 1}/{steps.length}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.rowInner}>
            <View style={styles.rowTop}>
              <Text style={styles.rowTitle}>{step.title}</Text>
            </View>

            {!!step.subtitle && <Text style={styles.qSub}>{step.subtitle}</Text>}

            {/* YES/NO */}
            {step.type === "yesno" && (
              <View style={styles.segment}>
                <Pressable
                  onPress={() => setAnswer(true)}
                  style={({ pressed }) => [
                    styles.segmentBtn,
                    currentValue === true && styles.segmentBtnActive,
                    { opacity: pressed ? 0.92 : 1 },
                  ]}
                >
                  <View style={[styles.dot, currentValue === true && styles.dotOn]} />
                  <Text style={[styles.segmentText, currentValue === true && styles.segmentTextOn]}>Так</Text>
                </Pressable>

                <Pressable
                  onPress={() => setAnswer(false)}
                  style={({ pressed }) => [
                    styles.segmentBtn,
                    currentValue === false && styles.segmentBtnActive,
                    { opacity: pressed ? 0.92 : 1 },
                  ]}
                >
                  <View style={[styles.dot, currentValue === false && styles.dotOn]} />
                  <Text style={[styles.segmentText, currentValue === false && styles.segmentTextOn]}>Ні</Text>
                </Pressable>
              </View>
            )}

            {/* MULTI */}
            {step.type === "multi" && (
              <>
                <View style={styles.multiWrap}>
                  {step.options.map((o) => {
                    const selected = Array.isArray(currentValue) && currentValue.includes(o);
                    return (
                      <Pressable
                        key={o}
                        onPress={() => toggleMulti(o)}
                        style={({ pressed }) => [
                          styles.chip,
                          selected && styles.chipOn,
                          { opacity: pressed ? 0.92 : 1 },
                        ]}
                      >
                        <View style={[styles.dot, selected && styles.dotOn]} />
                        <Text style={[styles.chipText, selected && styles.chipTextOn]}>{o}</Text>
                      </Pressable>
                    );
                  })}
                </View>

                {step.max ? (
                  <View style={styles.rowPill}>
                    <Text style={styles.rowPillText}>
                      Ліміт: {step.max} • Обрано: {Array.isArray(currentValue) ? currentValue.length : 0}
                    </Text>
                  </View>
                ) : null}
              </>
            )}

            {/* TEXT */}
            {step.type === "text" && (
              <View style={styles.searchWrap}>
                <Text style={styles.inputLabel}>Твоя відповідь</Text>
                <TextInput
                  value={typeof currentValue === "string" ? currentValue : ""}
                  onChangeText={(t) => setAnswer(t)}
                  placeholder={step.placeholder ?? "Напиши тут…"}
                  placeholderTextColor={COLORS.placeholder}
                  multiline
                  style={styles.input}
                  onFocus={() => setIsTyping(true)}
                  onBlur={() => setIsTyping(false)}
                  submitBehavior="blurAndSubmit"
                  onSubmitEditing={() => {
                    if (canNext && !aiLoading) next();
                  }}
                />
                <View style={styles.textMeta}>
                  <Text style={styles.textMetaTxt}>Мінімум: {step.minChars ?? 1}</Text>
                  <Text style={styles.textMetaTxt}>
                    {typeof currentValue === "string" ? currentValue.trim().length : 0}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {aiLoading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator />
            <Text style={styles.loadingText}>AI готує рекомендації…</Text>
          </View>
        ) : null}

        <View style={styles.actions}>
          <Pressable
            onPress={back}
            disabled={idx === 0}
            style={({ pressed }) => [
              styles.actionBtnGhost,
              idx === 0 && { opacity: 0.4 },
              { opacity: pressed ? 0.92 : 1 },
            ]}
          >
            <Text style={styles.actionGhostTxt}>Назад</Text>
          </Pressable>

          <Pressable
            onPress={next}
            disabled={!canNext || aiLoading}
            style={({ pressed }) => [
              styles.goBtn,
              (!canNext || aiLoading) && { opacity: 0.55 },
              { opacity: pressed ? 0.92 : 1 },
            ]}
          >
            <Text style={styles.goTxt}>{idx === steps.length - 1 ? "Завершити" : "Далі"}</Text>
          </Pressable>
        </View>

        <View style={{ height: 18 }} />
      </ScrollView>
    </View>
  );
}

function createStyles(COLORS: Colors, isDark: boolean) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: "transparent" },
    bg: { ...StyleSheet.absoluteFillObject },
    texture: { ...StyleSheet.absoluteFillObject, opacity: isDark ? 0.06 : 0.08, transform: [{ scale: 1.15 }] },
    veil: { ...StyleSheet.absoluteFillObject, backgroundColor: isDark ? "rgba(0,0,0,0.10)" : "rgba(255,255,255,0.18)" },

    listContent: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 18 },

    hero: {
  borderRadius: 22,
  backgroundColor: isDark ? "rgba(20,36,27,0.90)" : "#FFFFFF",
  borderWidth: 1,
  borderColor: COLORS.line,
  overflow: "hidden",
  ...shadow,
},
    heroInner: { padding: 14 },
    heroTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
    badge: { backgroundColor: COLORS.accentSoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
    badgeText: { color: COLORS.accent, fontSize: 12, fontFamily: FONTS.strong },
    heroTitle: { marginTop: 2, fontSize: 20, color: COLORS.text, fontFamily: FONTS.title },
    heroSub: { marginTop: 8, fontSize: 13, color: COLORS.sub, lineHeight: 18, fontFamily: FONTS.body },

    progressWrap: { marginTop: 12, flexDirection: "row", alignItems: "center", gap: 10 },
    progressTrack: {
      flex: 1,
      height: 10,
      borderRadius: 999,
      backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
      overflow: "hidden",
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.06)",
    },
    progressFill: { height: "100%", borderRadius: 999, backgroundColor: COLORS.accent },
    progressMeta: { color: COLORS.sub, fontFamily: FONTS.strong, fontSize: 12 },

    row: {
      marginTop: 12,
      borderRadius: 22,
      backgroundColor: isDark ? "rgba(20,36,27,0.90)" : "#FFFFFF",
      borderWidth: 1,
      borderColor: COLORS.line,
      overflow: "hidden",
      ...shadow,
      marginBottom: 10,
    },
    rowInner: { padding: 14 },
    rowTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
    rowTitle: { flex: 1, fontSize: 14, color: COLORS.text, fontFamily: FONTS.title2 },

    qSub: { marginTop: 10, fontSize: 12, color: COLORS.sub, lineHeight: 16, fontFamily: FONTS.body },

    segment: { flexDirection: "row", gap: 10, marginTop: 12 },
    segmentBtn: {
      flex: 1,
      borderRadius: 18,
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.06)",
      backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.03)",
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      justifyContent: "center",
    },
    segmentBtnActive: { backgroundColor: COLORS.accentSoft, borderColor: isDark ? "rgba(47,111,78,0.40)" : "rgba(47,111,78,0.28)" },
    segmentText: { color: COLORS.text, fontSize: 13, fontFamily: FONTS.strong, opacity: 0.9 },
    segmentTextOn: { color: COLORS.accent, opacity: 1 },

    multiWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 12 },
    chip: {
      borderRadius: 999,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.06)",
      backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.03)",
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      maxWidth: "100%",
    },
    chipOn: { backgroundColor: COLORS.accentSoft, borderColor: isDark ? "rgba(47,111,78,0.40)" : "rgba(47,111,78,0.28)" },
    chipText: { color: COLORS.text, fontSize: 12, fontFamily: FONTS.strong, opacity: 0.9, flexShrink: 1 },
    chipTextOn: { color: COLORS.accent, opacity: 1 },

    dot: {
      width: 10,
      height: 10,
      borderRadius: 999,
      borderWidth: 2,
      borderColor: isDark ? "rgba(242,243,244,0.32)" : "rgba(17,18,20,0.20)",
      backgroundColor: "transparent",
    },
    dotOn: {
      borderColor: COLORS.accent,
      backgroundColor: COLORS.accent,
    },

    searchWrap: {
      marginTop: 12,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.06)",
      backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.03)",
      padding: 12,
    },
    inputLabel: { fontSize: 12, color: COLORS.sub, fontFamily: FONTS.body, marginBottom: 8 },
    input: {
      borderWidth: 1,
      borderColor: COLORS.inputLine,
      backgroundColor: COLORS.inputBg,
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 12,
      fontSize: 13,
      color: COLORS.text,
      fontFamily: FONTS.body,
      minHeight: 120,
      textAlignVertical: "top",
    },
    textMeta: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
    textMetaTxt: { color: COLORS.sub, fontFamily: FONTS.strong, fontSize: 11 },

    actions: { flexDirection: "row", gap: 10, marginTop: 12 },
    goBtn: {
      flex: 1,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: 16,
      backgroundColor: COLORS.accent,
      alignItems: "center",
      justifyContent: "center",
      minWidth: 120,
    },
    goTxt: { color: "#fff", fontSize: 12, fontFamily: FONTS.strong },

    actionBtnPrimary: {
      flex: 1,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: 16,
      backgroundColor: COLORS.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    actionBtnGhost: {
      flex: 1,
      borderRadius: 16,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: COLORS.line,
      backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.03)",
      alignItems: "center",
      justifyContent: "center",
      minWidth: 120,
    },
    actionGhostTxt: { color: COLORS.text, fontSize: 12, fontFamily: FONTS.strong },

    rowPill: { marginTop: 12, alignSelf: "flex-start", backgroundColor: COLORS.accentSoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
    rowPillText: { color: COLORS.accent, fontSize: 12, fontFamily: FONTS.strong },

    loadingRow: { flexDirection: "row", gap: 10, alignItems: "center", marginTop: 10 },
    loadingText: { color: COLORS.sub, fontFamily: FONTS.strong },

    resultText: { color: COLORS.text, fontSize: 13, fontFamily: FONTS.body, lineHeight: 18 },
  });
}