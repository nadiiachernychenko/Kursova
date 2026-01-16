import React, { useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet, Alert } from "react-native";
import { earnEduPoints } from "../../lib/eduApi";
import { useEduProfile } from "../../lib/useEduProfile";

export default function EcoFactsScreen() {
  const { refresh } = useEduProfile();
  const [i, setI] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);

  const FACTS = useMemo(
    () => [
      "🔋 Одна батарейка може забруднити землю на роки — здавай у спецпункти.",
      "🧴 Скло можна переробляти багато разів без втрати якості.",
      "🧾 Чеки часто термопапір — не завжди підходить у макулатуру.",
    ],
    []
  );

  const next = async () => {
    try {
      setMsg(null);
      const res: any = await earnEduPoints("facts", 1);
      await refresh();

      if (res?.ok === false) setMsg(res?.reason ?? "На сьогодні ліміт 🐼");
      else setMsg(`+${res?.added ?? 1} бал ✨`);

      setI((v) => v + 1);
    } catch (e: any) {
      Alert.alert("Помилка", e?.message ?? "Не вдалося нарахувати бали");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🌿 Еко-факти</Text>
      <Text style={styles.card}>{FACTS[i % FACTS.length]}</Text>

      {msg ? <Text style={styles.msg}>{msg}</Text> : null}

      <Pressable onPress={next} style={({ pressed }) => [styles.btn, pressed && { opacity: 0.9 }]}>
        <Text style={styles.btnText}>Наступний факт →</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "900" },
  card: { padding: 16, borderRadius: 20, borderWidth: 1, borderColor: "rgba(0,0,0,0.10)", backgroundColor: "rgba(248,251,249,1)", fontSize: 14, fontWeight: "800", lineHeight: 20 },
  msg: { fontSize: 12, fontWeight: "900", opacity: 0.85 },
  btn: { marginTop: 6, paddingVertical: 12, borderRadius: 18, borderWidth: 1, alignItems: "center" },
  btnText: { fontWeight: "900", fontSize: 13 },
});
