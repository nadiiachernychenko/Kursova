import React, { useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet, Alert } from "react-native";
import { earnEduPoints } from "../../lib/eduApi";
import { useEduProfile } from "../../lib/useEduProfile";

type Item = { text: string; truth: boolean; explain: string };

export default function MyTruthScreen() {
  const { refresh } = useEduProfile();
  const [i, setI] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);

  const ITEMS = useMemo<Item[]>(
    () => [
      { text: "Папір можна переробляти нескінченно.", truth: false, explain: "Ні — волокна зношуються після кількох циклів." },
      { text: "Скло можна переробляти багато разів.", truth: true, explain: "Так — без втрати якості." },
    ],
    []
  );

  const item = ITEMS[i % ITEMS.length];

  const answer = async (userTruth: boolean) => {
    try {
      setMsg(null);
      const ok = userTruth === item.truth;

      if (ok) {
        const res: any = await earnEduPoints("myth", 2);
        await refresh();
        if (res?.ok === false) setMsg(res?.reason ?? "Ліміт на сьогодні 🐼");
        else setMsg(`✅ Правильно! +${res?.added ?? 2} бали. ${item.explain}`);
      } else {
        setMsg(`❌ Не зовсім. ${item.explain}`);
      }

      setI((v) => v + 1);
    } catch (e: any) {
      Alert.alert("Помилка", e?.message ?? "Не вдалося нарахувати бали");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧠 Міф чи правда?</Text>

      <View style={styles.card}>
        <Text style={styles.statement}>{item.text}</Text>
      </View>

      <View style={styles.row}>
        <Pressable onPress={() => answer(false)} style={styles.btn}><Text style={styles.btnText}>Міф</Text></Pressable>
        <Pressable onPress={() => answer(true)} style={styles.btn}><Text style={styles.btnText}>Правда</Text></Pressable>
      </View>

      {msg ? <Text style={styles.msg}>{msg}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "900" },
  card: { padding: 16, borderRadius: 20, borderWidth: 1, borderColor: "rgba(0,0,0,0.10)", backgroundColor: "rgba(248,251,249,1)" },
  statement: { fontSize: 14, fontWeight: "900", lineHeight: 20 },
  row: { flexDirection: "row", gap: 10 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 18, borderWidth: 1, alignItems: "center" },
  btnText: { fontWeight: "900", fontSize: 13 },
  msg: { fontSize: 12, fontWeight: "900", opacity: 0.85, lineHeight: 16 },
});
