import React, { useMemo, useRef, useState } from "react";
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { supabase } from "../lib/supabase";

const W = Dimensions.get("window").width;

type Step = 0 | 1;

const interestsList = [
  { key: "habits", ua: "🌿 Еко-звички", en: "🌿 Eco habits" },
  { key: "sorting", ua: "♻️ Сортування", en: "♻️ Sorting" },
  { key: "saving", ua: "⚡ Економія ресурсів", en: "⚡ Saving resources" },
  { key: "all", ua: "🌍 Все одразу", en: "🌍 Everything" },
] as const;

const goalsList = [
  { key: "start_small", ua: "Почати з малого", en: "Start small" },
  { key: "build_habit", ua: "Сформувати звичку", en: "Build a habit" },
  { key: "learn", ua: "Дізнаватись нове", en: "Learn new things" },
  { key: "curious", ua: "Просто цікаво", en: "Just curious" },
] as const;

export default function OnboardingScreen({ lang, onDone }: { lang: "ua" | "en"; onDone: () => void }) {
  const s = useMemo(
    () =>
      lang === "ua"
        ? {
            t1: "Що тобі цікаво?",
            t1sub: "Можна обрати кілька",
            t2: "Навіщо тобі EcoLife?",
            skip: "Пропустити",
            next: "Далі",
            start: "Почати 🌱",
            later: "Ти зможеш змінити це пізніше у профілі",
          }
        : {
            t1: "What are you into?",
            t1sub: "You can pick multiple",
            t2: "Why EcoLife?",
            skip: "Skip",
            next: "Next",
            start: "Start 🌱",
            later: "You can change this later in your profile",
          },
    [lang]
  );

  const ref = useRef<ScrollView>(null);
  const [step, setStep] = useState<Step>(0);
  const [interests, setInterests] = useState<string[]>([]);
  const [goal, setGoal] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const toggleInterest = (k: string) => {
    setInterests((prev) => {
      if (k === "all") return ["all"];
      const next = prev.filter((x) => x !== "all");
      return next.includes(k) ? next.filter((x) => x !== k) : [...next, k];
    });
  };

  const goTo = (st: Step) => {
    setStep(st);
    ref.current?.scrollTo({ x: st * W, animated: true });
  };

  const skip = async () => {
    await save(["all"], null);
  };

  const save = async (ints: string[], g: string | null) => {
    try {
      setSaving(true);
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (!user) return;

      const { error } = await supabase.from("profiles").update({
        interests: ints.length ? ints : ["all"],
        goal: g,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      }).eq("id", user.id);

      if (error) throw error;
      onDone();
    } finally {
      setSaving(false);
    }
  };

  const next = async () => {
    if (step === 0) {
      goTo(1);
      return;
    }
    await save(interests.length ? interests : ["all"], goal);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.topRow}>
        <Pressable onPress={skip} disabled={saving} style={({ pressed }) => [styles.skipBtn, pressed && { opacity: 0.85 }, saving && { opacity: 0.6 }]}>
          <Text style={styles.skipText}>{s.skip}</Text>
        </Pressable>
      </View>

      <ScrollView
        ref={ref}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const st = Math.round(e.nativeEvent.contentOffset.x / W) as Step;
          setStep(st);
        }}
      >
        <View style={[styles.page, { width: W }]}>
          <Text style={styles.title}>{s.t1}</Text>
          <Text style={styles.sub}>{s.t1sub}</Text>

          <View style={styles.chips}>
            {interestsList.map((it) => {
              const active = interests.includes(it.key) || (it.key === "all" && interests.includes("all"));
              return (
                <Pressable
                  key={it.key}
                  onPress={() => toggleInterest(it.key)}
                  style={({ pressed }) => [
                    styles.chip,
                    active && styles.chipActive,
                    pressed && { opacity: 0.9 },
                  ]}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{lang === "ua" ? it.ua : it.en}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.later}>{s.later}</Text>
        </View>

        <View style={[styles.page, { width: W }]}>
          <Text style={styles.title}>{s.t2}</Text>

          <View style={styles.chips}>
            {goalsList.map((g) => {
              const active = goal === g.key;
              return (
                <Pressable
                  key={g.key}
                  onPress={() => setGoal(g.key)}
                  style={({ pressed }) => [
                    styles.chip,
                    active && styles.chipActive,
                    pressed && { opacity: 0.9 },
                  ]}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{lang === "ua" ? g.ua : g.en}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.later}>{s.later}</Text>
        </View>
      </ScrollView>

      <View style={styles.bottom}>
        <Pressable onPress={next} disabled={saving} style={({ pressed }) => [styles.btn, pressed && { opacity: 0.9 }, saving && { opacity: 0.6 }]}>
          <Text style={styles.btnText}>{step === 0 ? s.next : s.start}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#fff" },
  topRow: { padding: 16, alignItems: "flex-end" },
  skipBtn: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 14, borderWidth: 1, borderColor: "rgba(0,0,0,0.12)" },
  skipText: { fontWeight: "900", fontSize: 12, opacity: 0.8 },

  page: { paddingHorizontal: 18, paddingTop: 10 },
  title: { fontSize: 22, fontWeight: "900" },
  sub: { marginTop: 6, fontSize: 13, fontWeight: "700", opacity: 0.7 },

  chips: { marginTop: 14, gap: 10 },
  chip: { borderRadius: 16, borderWidth: 1, borderColor: "rgba(0,0,0,0.12)", paddingVertical: 12, paddingHorizontal: 12 },
  chipActive: { backgroundColor: "rgba(0,0,0,0.06)" },
  chipText: { fontWeight: "900", opacity: 0.85 },
  chipTextActive: { opacity: 1 },

  later: { marginTop: 14, fontSize: 12, fontWeight: "800", opacity: 0.6, lineHeight: 16 },

  bottom: { padding: 16 },
  btn: { paddingVertical: 14, borderRadius: 16, borderWidth: 1, alignItems: "center" },
  btnText: { fontWeight: "900" },
});
