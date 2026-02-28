import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, Alert, ActivityIndicator, Keyboard } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAppTheme } from "../../lib/theme";
import { getBeginnerPlan } from "../../lib/ecoAssistant";
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

type Answers = Record<
  string,
  { type: StepType; value: boolean | string | string[] }
>;

export default function BeginnerQuestionsScreen() {
  const nav = useNavigation<any>();
  const { colors, isDark } = useAppTheme() as any;

  const styles = useMemo(() => createStyles(colors, !!isDark), [colors, isDark]);

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
        subtitle: "Напр.: живу з батьками/сама, є місце під контейнери, як часто готую, тощо.",
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
        placeholder: "Напиши своїм словами…",
        minChars: 10,
      },
    ],
    []
  );

  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);

  const started = Object.keys(answers).length > 0; 
  const finished = aiResult != null;

  const step = steps[idx];

  useEffect(() => {
    const sub = nav.addListener("beforeRemove", (e: any) => {
      if (!started || finished) return;

      e.preventDefault();
      Alert.alert(
        "Вийти з опитування?",
        "Ви точно хочете вийти? Відповіді не збережуться.",
        [
          { text: "Залишитись", style: "cancel" },
          { text: "Вийти", style: "destructive", onPress: () => nav.dispatch(e.data.action) },
        ]
      );
    });

    return sub;
  }, [nav, started, finished]);

  const currentValue = answers[step.id]?.value;

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

  const next = () => {
    Keyboard.dismiss();
   setTimeout(() => {
     if (idx < steps.length - 1) setIdx((i) => i + 1);
     else finish();
   }, 0);
    };

  const back = () => {
   Keyboard.dismiss();
 setTimeout(() => {
      if (idx > 0) setIdx((i) => i - 1);
    }, 0);
  };

  const reset = () => {
    setIdx(0);
    setAnswers({});
    setAiResult(null);
    setAiLoading(false);
  };

  const finish = async () => {
    Keyboard.dismiss();
    setAiLoading(true);
    try {
const res = await getBeginnerPlan(answers);
setAiResult(res.plan);
    } catch (e: any) {
      Alert.alert("Помилка", e?.message ?? "Не вдалося отримати відповідь AI");
    } finally {
      setAiLoading(false);
    }
  };
  if (aiResult) {

 return (
    <ScrollView
     contentContainerStyle={styles.container}
           showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
    <Text style={styles.h1}>Твій еко-старт-план 🌿</Text>
        <Text style={styles.sub}>AI проаналізував відповіді й зібрав план під тебе.</Text>

        <View style={styles.resultCard}>
          <Text style={styles.resultText}>{aiResult}</Text>
        </View>

        <View style={{ height: 12 }} />

        <Pressable onPress={reset} style={styles.primaryBtn}>
          <Text style={styles.primaryBtnText}>Пройти ще раз / Скинути результат</Text>
        </Pressable>

        <Pressable onPress={() => nav.goBack()} style={styles.secondaryBtn}>
          <Text style={styles.secondaryBtnText}>Назад</Text>
        </Pressable>
      </ScrollView>
    );
  }

 return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
     keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.h1}>Еко-старт</Text>
      <Text style={styles.sub}>Кілька запитань — і ми підберемо старт саме під тебе.</Text>

      <View style={styles.progressRow}>
        <Text style={styles.progressText}>
          {idx + 1} / {steps.length}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>{step.title}</Text>
        {!!step.subtitle && <Text style={styles.subtitle}>{step.subtitle}</Text>}

        {step.type === "yesno" && (
          <View style={styles.row}>
            <Pressable onPress={() => setAnswer(true)} style={[styles.choice, currentValue === true && styles.choiceActive]}>
              <Text style={[styles.choiceText, currentValue === true && styles.choiceTextActive]}>Так</Text>
            </Pressable>
            <Pressable onPress={() => setAnswer(false)} style={[styles.choice, currentValue === false && styles.choiceActive]}>
              <Text style={[styles.choiceText, currentValue === false && styles.choiceTextActive]}>Ні</Text>
            </Pressable>
          </View>
        )}

        {step.type === "multi" && (
          <View style={styles.multiWrap}>
            {step.options.map((o) => {
              const selected = Array.isArray(currentValue) && currentValue.includes(o);
              return (
                <Pressable key={o} onPress={() => toggleMulti(o)} style={[styles.multiItem, selected && styles.multiItemActive]}>
                  <Text style={[styles.multiText, selected && styles.multiTextActive]}>{o}</Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {step.type === "text" && (
          <View style={styles.textWrap}>
            <TextInput
              value={typeof currentValue === "string" ? currentValue : ""}
              onChangeText={(t) => setAnswer(t)}
              placeholder={step.placeholder ?? "Напиши тут…"}
              placeholderTextColor={styles._placeholder.color}
              multiline
              style={styles.textInput}
                 submitBehavior="blurAndSubmit"
  onSubmitEditing={() => {
    if (canNext && !aiLoading) next();
  }}
/>
          </View>
        )}
      </View>

      {aiLoading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator />
          <Text style={styles.loadingText}>AI готує рекомендації…</Text>
        </View>
      ) : null}

      <View style={styles.navRow}>
        <Pressable onPress={back} disabled={idx === 0} style={[styles.navBtn, idx === 0 && { opacity: 0.4 }]}>
          <Text style={styles.navBtnText}>Назад</Text>
        </Pressable>

        <Pressable onPress={next} disabled={!canNext || aiLoading} style={[styles.navBtnPrimary, (!canNext || aiLoading) && { opacity: 0.5 }]}>
          <Text style={styles.navBtnPrimaryText}>{idx === steps.length - 1 ? "Завершити" : "Далі"}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function createStyles(colors: any, isDark: boolean) {
  const bg = colors?.background ?? (isDark ? "#0E0F11" : "#fff");
  const text = colors?.text ?? (isDark ? "#F2F3F4" : "#111214");
  const sub = isDark ? "rgba(242,243,244,0.72)" : "rgba(17,18,20,0.62)";
  const card = colors?.card ?? (isDark ? "#15171A" : "#FFFFFF");
  const border = colors?.border ?? (isDark ? "rgba(242,243,244,0.10)" : "rgba(0,0,0,0.10)");
  const accent = "#2F6F4E";

  return StyleSheet.create({
    _placeholder: { color: isDark ? "rgba(242,243,244,0.40)" : "rgba(17,18,20,0.38)" },

    container: { padding: 16, paddingTop: 14, paddingBottom: 32, backgroundColor: bg, gap: 12 },

    h1: { fontSize: 20, fontWeight: "900", color: text },
    sub: { fontSize: 13, fontWeight: "700", color: sub, lineHeight: 18 },

    progressRow: { alignItems: "flex-end" },
    progressText: { fontSize: 12, fontWeight: "800", color: sub },

    card: { borderRadius: 22, borderWidth: 1, borderColor: border, backgroundColor: card, padding: 14, gap: 10 },
    title: { fontSize: 16, fontWeight: "900", color: text },
    subtitle: { fontSize: 13, fontWeight: "700", color: sub, lineHeight: 18 },

    row: { flexDirection: "row", gap: 10 },
    choice: { flex: 1, borderRadius: 18, borderWidth: 1, borderColor: border, paddingVertical: 12, alignItems: "center" },
    choiceActive: { borderColor: accent, backgroundColor: isDark ? "rgba(47,111,78,0.18)" : "rgba(47,111,78,0.10)" },
    choiceText: { fontWeight: "900", color: text },
    choiceTextActive: { color: accent },

    multiWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    multiItem: { borderRadius: 999, borderWidth: 1, borderColor: border, paddingVertical: 10, paddingHorizontal: 12 },
    multiItemActive: { borderColor: accent, backgroundColor: isDark ? "rgba(47,111,78,0.18)" : "rgba(47,111,78,0.10)" },
    multiText: { fontSize: 12, fontWeight: "800", color: text },
    multiTextActive: { color: accent },

    textWrap: { borderRadius: 18, borderWidth: 1, borderColor: border, backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", padding: 12 },
    textInput: { minHeight: 110, color: text, fontSize: 13, fontWeight: "700" },

    navRow: { flexDirection: "row", gap: 10, marginTop: 6 },
    navBtn: { flex: 1, borderRadius: 18, borderWidth: 1, borderColor: border, backgroundColor: card, paddingVertical: 12, alignItems: "center" },
    navBtnText: { fontWeight: "900", color: text },

    navBtnPrimary: { flex: 1, borderRadius: 18, backgroundColor: accent, paddingVertical: 12, alignItems: "center" },
    navBtnPrimaryText: { fontWeight: "900", color: "#fff" },

    loadingRow: { flexDirection: "row", gap: 10, alignItems: "center", paddingTop: 6 },
    loadingText: { color: sub, fontWeight: "800" },

    resultCard: { borderRadius: 22, borderWidth: 1, borderColor: border, backgroundColor: card, padding: 14 },
    resultText: { color: text, fontSize: 13, fontWeight: "700", lineHeight: 18 },

    primaryBtn: { borderRadius: 18, backgroundColor: accent, paddingVertical: 12, alignItems: "center" },
    primaryBtnText: { fontWeight: "900", color: "#fff" },
    secondaryBtn: { borderRadius: 18, borderWidth: 1, borderColor: border, backgroundColor: card, paddingVertical: 12, alignItems: "center" },
    secondaryBtnText: { fontWeight: "900", color: text },
  });
}