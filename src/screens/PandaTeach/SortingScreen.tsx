import React, { useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet, Alert } from "react-native";
import { earnEduPoints } from "../../lib/eduApi";
import { useEduProfile } from "../../lib/useEduProfile";

type Bin = "paper" | "plastic" | "glass" | "organic" | "other";
type Item = { name: string; correct: Bin; tip: string };

export default function SortingScreen() {
  const { refresh } = useEduProfile();
  const [i, setI] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);

  const bins = useMemo(
    () =>
      [
        { id: "paper" as const, label: "📄 Папір" },
        { id: "plastic" as const, label: "🧴 Пластик" },
        { id: "glass" as const, label: "🍾 Скло" },
        { id: "organic" as const, label: "🍌 Органіка" },
        { id: "other" as const, label: "🗑️ Інше" },
      ] as const,
    []
  );

  const items = useMemo<Item[]>(
    () => [
      { name: "Газета", correct: "paper", tip: "Суха макулатура → папір." },
      { name: "Пляшка зі скла", correct: "glass", tip: "Скло часто здають окремо." },
      { name: "Пляшка від води (PET)", correct: "plastic", tip: "Пластик → окрема фракція." },
    ],
    []
  );

  const current = items[i % items.length];

  const pick = async (bin: Bin) => {
    try {
      setMsg(null);
      const ok = bin === current.correct;

      if (ok) {
        const res: any = await earnEduPoints("sorting", 1);
        await refresh();
        if (res?.ok === false) setMsg(res?.reason ?? "Ліміт на сьогодні 🐼");
        else setMsg(`✅ Так! +${res?.added ?? 1} бал. ${current.tip}`);
      } else {
        setMsg(`❌ Не зовсім. ${current.tip}`);
      }

      setI((v) => v + 1);
    } catch (e: any) {
      Alert.alert("Помилка", e?.message ?? "Не вдалося нарахувати бали");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🗑️ Сортування</Text>

      <View style={styles.card}>
        <Text style={styles.big}>Куди викинути?</Text>
        <Text style={styles.item}>{current.name}</Text>
      </View>

      <View style={styles.grid}>
        {bins.map((b) => (
          <Pressable key={b.id} onPress={() => pick(b.id)} style={styles.bin}>
            <Text style={styles.binText}>{b.label}</Text>
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
  card: { padding: 16, borderRadius: 20, borderWidth: 1, borderColor: "rgba(0,0,0,0.10)", backgroundColor: "rgba(248,251,249,1)", gap: 6 },
  big: { fontSize: 12, fontWeight: "900", opacity: 0.6 },
  item: { fontSize: 18, fontWeight: "900" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "space-between" },
  bin: { width: "48%", paddingVertical: 12, paddingHorizontal: 12, borderRadius: 18, borderWidth: 1, alignItems: "center" },
  binText: { fontWeight: "900", fontSize: 13, opacity: 0.9 },
  msg: { fontSize: 12, fontWeight: "900", opacity: 0.85, lineHeight: 16 },
});
