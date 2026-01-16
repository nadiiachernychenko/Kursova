import React, { useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet, Alert } from "react-native";
import { earnEduPoints } from "../../lib/eduApi";
import { useEduProfile } from "../../lib/useEduProfile";

type Q = { q: string; options: string[]; correctIndex: number; explain: string };

export default function PandaAsksScreen() {
  const { refresh } = useEduProfile();
  const [i, setI] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);

  const QUESTIONS = useMemo<Q[]>(
    () => [
      {
        q: "🐼 Що краще робити з батарейками?",
        options: ["Викинути в загальне сміття", "Здати в спецпункт", "Закопати"],
        correctIndex: 1,
        explain: "Батарейки містять токсичні метали — здавай у спецпункти.",
      },
    ],
    []
  );

  const item = QUESTIONS[i % QUESTIONS.length];

  const pick = async (idx: number) => {
    try {
      setMsg(null);
      const ok = idx === item.correctIndex;

      if (ok) {
        const res: any = await earnEduPoints("asks", 3);
        await refresh();
        if (res?.ok === false) setMsg(res?.reason ?? "Ліміт на сьогодні 🐼");
        else setMsg(`✅ Так! +${res?.added ?? 3} бали. ${item.explain}`);
      } else {
        setMsg(`❌ Ні. ${item.explain}`);
      }

      setI((v) => v + 1);
    } catch (e: any) {
      Alert.alert("Помилка", e?.message ?? "Не вдалося нарахувати бали");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>❓ Панда питає</Text>

      <View style={styles.card}><Text style={styles.question}>{item.q}</Text></View>

      <View style={{ gap: 10 }}>
        {item.options.map((opt, idx) => (
          <Pressable key={idx} onPress={() => pick(idx)} style={styles.option}>
            <Text style={styles.optionText}>{opt}</Text>
          </Pressable>
        ))}
      </View>

      {msg ? <Text style={styles.msg}>{msg}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "900" },
  card: { padding: 16, borderRadius: 20, borderWidth: 1, borderColor: "rgba(0,0,0,0.10)", backgroundColor: "rgba(248,251,249,1)" },
  question: { fontSize: 14, fontWeight: "900", lineHeight: 20 },
  option: { paddingVertical: 12, paddingHorizontal: 12, borderRadius: 18, borderWidth: 1 },
  optionText: { fontWeight: "900", fontSize: 13, opacity: 0.9 },
  msg: { fontSize: 12, fontWeight: "900", opacity: 0.85, lineHeight: 16 },
});
