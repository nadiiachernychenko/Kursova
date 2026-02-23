import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";

const SECTIONS: Array<{ title: string; points: string[] }> = [
  {
    title: "5 базових правил",
    points: [
      "Сортуй тільки те, що чисте й сухе (мінімально промити, висушити).",
      "Стисни об’ємне (пляшки, пакування) — менше місця у контейнерах.",
      "Знімай кришки там, де це потрібно (часто пластик/метал окремо).",
      "Не змішуй небезпечні відходи зі звичайними (батарейки, лампи, ліки).",
      "Якщо сумніваєшся — краще запитай або віднеси в змішані, але небезпечне — ніколи.",
    ],
  },
  {
    title: "Якщо у твоєму районі немає контейнерів",
    points: [
      "Почни з небезпечних: батарейки/лампи/електроніка — шукай точки збору в супермаркетах або на карті.",
      "Збирай окремо вдома хоча б: пластик, папір, скло, метал — і відвозь раз на тиждень/місяць.",
      "Якщо зовсім немає куди здати — зменшуй утворення відходів: багаторазові пляшки, пакети, контейнери.",
    ],
  },
  {
    title: "Небезпечні відходи",
    points: [
      "Батарейки й акумулятори — тільки в спеціальні бокси.",
      "Лампи (особливо люмінесцентні) — в пункти прийому, не в смітник.",
      "Ліки — не зливати/не викидати в унітаз; краще в пункти збору або за правилами міста.",
      "Фарби/аерозолі/хімія — окремий прийом.",
    ],
  },
];

export default function SortIntroScreen() {
  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.h1}>Короткий інструктаж</Text>
      <Text style={styles.sub}>Щоб сортування було простим і без помилок</Text>

      {SECTIONS.map((s) => (
        <View key={s.title} style={styles.card}>
          <Text style={styles.cardTitle}>{s.title}</Text>
          <View style={styles.points}>
            {s.points.map((p) => (
              <Text key={p} style={styles.point}>
                • {p}
              </Text>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0B1220" },
  content: { padding: 16, gap: 12 },
  h1: { color: "#F9FAFB", fontSize: 22, fontWeight: "800" },
  sub: { color: "#A7B0BE", marginTop: 6, marginBottom: 8 },
  card: {
    backgroundColor: "#0F1A2E",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#1F2A44",
  },
  cardTitle: { color: "#F9FAFB", fontWeight: "800", marginBottom: 8 },
  points: { gap: 8 },
  point: { color: "#D1D5DB", lineHeight: 20 },
});