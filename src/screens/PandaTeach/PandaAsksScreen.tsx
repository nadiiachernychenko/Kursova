import React, { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet, Alert, Image, ActivityIndicator, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { earnEduPoints } from "../../lib/eduApi";
import { useEduProfile } from "../../lib/useEduProfile";
import { useAppTheme } from "../../lib/theme";
import { getNextEduAsk, saveEduAskAnswer, type EduAsk } from "../../lib/eduAsks";

const LEAVES = require("../../../assets/leaves-texture.png");

export default function PandaAsksScreen() {
  const { refresh } = useEduProfile();
  const { colors, isDark } = useAppTheme() as any;

  const grad = useMemo(
    () => (isDark ? ["#07110D", "#0B1711", "#0E1D15"] : ["#F6FBF8", "#F2FAF5", "#ECF7F0"]),
    [isDark]
  );

  const styles = useMemo(() => createStyles(colors, !!isDark), [colors, isDark]);

  const [item, setItem] = useState<EduAsk | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);

  const [hint, setHint] = useState<string | null>(null);
  const [pointsMsg, setPointsMsg] = useState<string | null>(null);
  const [limitMsg, setLimitMsg] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const q = await getNextEduAsk("uk");
      setItem(q);
      setSelected(null);
      setChecked(false);
      setHint(null);
      setPointsMsg(null);
      setLimitMsg(null);
    } catch (e: any) {
      Alert.alert("Помилка", e?.message ?? "Не вдалося завантажити питання");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const pick = (idx: number) => {
    if (busy || loading || checked) return;
    setSelected(idx);
    setHint(null);
  };

  const checkAnswer = async () => {
    try {
      if (busy || loading || !item) return;

      if (selected === null) {
        setHint("Оберіть відповідь, щоб перевірити.");
        return;
      }

      setBusy(true);
      setHint(null);
      setLimitMsg(null);
      setPointsMsg(null);

      const ok = selected === item.correct_index;

      await saveEduAskAnswer(item.id, selected, ok);

      if (ok) {
        const res: any = await earnEduPoints("asks", 3);
        await refresh();

        const added = Number(res?.added ?? 0);

        if (res?.ok === false || added <= 0) {
          setLimitMsg(res?.reason ?? "Ліміт балів на сьогодні досягнуто. Можеш продовжувати без балів.");
        } else {
          setPointsMsg(`+${added} бали`);
          setTimeout(() => setPointsMsg(null), 1200);
        }
      }

      setChecked(true);
    } catch (e: any) {
      Alert.alert("Помилка", e?.message ?? "Не вдалося перевірити відповідь");
    } finally {
      setBusy(false);
    }
  };

  const next = async () => {
    if (busy || loading) return;
    await load();
  };

  const isCorrect = checked && selected !== null && selected === item?.correct_index;

  return (
    <View style={styles.root}>
      <LinearGradient style={styles.bg} colors={grad as any} start={{ x: 0.15, y: 0.05 }} end={{ x: 0.9, y: 1 }} />
      <Image source={LEAVES} resizeMode="cover" style={[StyleSheet.absoluteFillObject, { opacity: isDark ? 0.06 : 0.08, transform: [{ scale: 1.12 }] }]} />
      <View style={styles.veil} />

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Панда питає</Text>
          {pointsMsg ? <Text style={styles.points}>{pointsMsg}</Text> : null}
        </View>

        <View style={styles.card}>
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator />
              <Text style={styles.loadingText}>Завантажую…</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.cardInner}>
              <Text style={styles.question}>{item?.q ?? "Немає питань"}</Text>

              <View style={styles.opts}>
                {(item?.options ?? []).map((opt, idx) => {
                  const picked = selected === idx;
                  const correct = checked && idx === item?.correct_index;
                  const wrongPicked = checked && picked && idx !== item?.correct_index;

                  return (
                    <Pressable
                      key={idx}
                      onPress={() => pick(idx)}
                      disabled={busy || loading || checked}
                      style={({ pressed }) => [
                        styles.option,
                        picked && styles.optionPicked,
                        correct && styles.optionCorrect,
                        wrongPicked && styles.optionWrong,
                        pressed && !checked && { opacity: 0.9 },
                      ]}
                    >
                      <Text style={styles.optionText}>{opt}</Text>
                    </Pressable>
                  );
                })}
              </View>

              {hint ? (
                <View style={styles.hintBox}>
                  <Text style={styles.hintText}>{hint}</Text>
                </View>
              ) : null}

              <Pressable
                onPress={checked ? next : checkAnswer}
                disabled={busy || loading || (!checked && selected === null)}
                style={({ pressed }) => [
                  styles.btn,
                  (busy || loading || (!checked && selected === null)) && styles.btnDisabled,
                  pressed && !(busy || loading) && { opacity: 0.9 },
                ]}
              >
                <Text style={styles.btnText}>
                  {busy ? "Зачекай…" : checked ? "Наступне питання" : "Перевірити"}
                </Text>
              </Pressable>

              {checked ? (
                <View style={styles.feedbackBox}>
                  <Text style={styles.feedbackTitle}>{isCorrect ? "Правильно" : "Неправильно"}</Text>
                  <Text style={styles.feedbackText}>{item?.explain ?? ""}</Text>
                </View>
              ) : null}

              {limitMsg ? (
                <View style={styles.limitBox}>
                  <Text style={styles.limitText}>{limitMsg}</Text>
                </View>
              ) : null}
            </ScrollView>
          )}
        </View>
      </View>
    </View>
  );
}

function createStyles(colors: any, isDark: boolean) {
  const line = colors?.line ?? (isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.10)");
  const card = colors?.card ?? (isDark ? "rgba(20,26,24,0.78)" : "rgba(255,255,255,0.78)");
  const text = colors?.text ?? (isDark ? "#F2F6F4" : "#0E1512");
  const muted = colors?.muted ?? (isDark ? "rgba(242,246,244,0.72)" : "rgba(14,21,18,0.72)");

  return StyleSheet.create({
    root: { flex: 1, backgroundColor: "transparent" },
    bg: { ...StyleSheet.absoluteFillObject },
    veil: { ...StyleSheet.absoluteFillObject, backgroundColor: isDark ? "rgba(0,0,0,0.10)" : "rgba(255,255,255,0.18)" },

    content: { flex: 1, paddingHorizontal: 14, paddingTop: 28, paddingBottom: 18, gap: 12 },

    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    title: { fontSize: 22, fontFamily: "Nunito_800ExtraBold", color: text },
    points: { fontSize: 13, fontFamily: "Manrope_700Bold", color: "#2E7D55" },

    card: { flex: 1, borderRadius: 22, borderWidth: 1, borderColor: line, backgroundColor: card, overflow: "hidden" },
    cardInner: { padding: 16, gap: 12 },
    question: { fontSize: 16, lineHeight: 23, fontFamily: "Manrope_700Bold", color: text },

    opts: { gap: 10 },
    option: { paddingVertical: 12, paddingHorizontal: 12, borderRadius: 18, borderWidth: 1, borderColor: line, backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.60)" },
    optionPicked: { borderColor: isDark ? "rgba(10, 107, 172, 0.45)" : "rgba(46, 85, 124, 0.35)", backgroundColor: isDark
    ? "rgba(83, 174, 234, 0.12)"
    : "rgba(15, 119, 189, 0.08)",},
    optionCorrect: { borderColor: "rgba(46,125,85,0.55)", backgroundColor: isDark ? "rgba(46,125,85,0.18)" : "rgba(46,125,85,0.10)" },
    optionWrong: { borderColor: "rgba(220,60,60,0.55)", backgroundColor: isDark ? "rgba(220,60,60,0.14)" : "rgba(220,60,60,0.08)" },
    optionText: { fontSize: 13, lineHeight: 18, fontFamily: "Manrope_700Bold", color: text, opacity: 0.92 },

    hintBox: { alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, borderWidth: 1, borderColor: line, backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.60)" },
    hintText: { fontSize: 12, fontFamily: "Manrope_700Bold", color: muted },

    btn: { height: 48, borderRadius: 18, borderWidth: 1, borderColor: line, backgroundColor: isDark ? "rgba(46,125,85,0.22)" : "rgba(46,125,85,0.12)", alignItems: "center", justifyContent: "center" },
    btnDisabled: { opacity: 0.6 },
    btnText: { fontSize: 13, fontFamily: "Manrope_700Bold", color: text },

    feedbackBox: { padding: 12, borderRadius: 16, borderWidth: 1, borderColor: line, backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.55)", gap: 6 },
    feedbackTitle: { fontSize: 13, fontFamily: "Manrope_700Bold", color: text },
    feedbackText: { fontSize: 12, lineHeight: 17, fontFamily: "Manrope_600SemiBold", color: muted },

    limitBox: { alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, borderWidth: 1, borderColor: line, backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.60)" },
    limitText: { fontSize: 12, fontFamily: "Manrope_700Bold", color: muted },

    loadingBox: { paddingVertical: 16, gap: 10, alignItems: "center", justifyContent: "center" },
    loadingText: { fontSize: 12, fontFamily: "Manrope_700Bold", color: muted },
  });
}