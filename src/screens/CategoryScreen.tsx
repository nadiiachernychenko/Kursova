import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { CATEGORIES } from "../data/sorting";
import type { SortStackParamList } from "../navigation/SortStack";

type Props = NativeStackScreenProps<SortStackParamList, "Category">;

export default function CategoryScreen({ route }: Props) {
  const { id } = route.params;
  const category = CATEGORIES.find((c) => c.id === id);

  if (!category) {
    return (
      <View style={styles.center}>
        <Text>Категорію не знайдено</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>
        {category.emoji} {category.title}
      </Text>
      <Text style={styles.hint}>{category.colorHint}</Text>

      <Section title="✅ Можна">
        {category.can.map((x) => (
          <Text key={x} style={styles.item}>
            • {x}
          </Text>
        ))}
      </Section>

      <Section title="❌ Не можна">
        {category.cannot.map((x) => (
          <Text key={x} style={styles.item}>
            • {x}
          </Text>
        ))}
      </Section>

      <Section title="💡 Поради">
        {category.tips.map((x) => (
          <Text key={x} style={styles.item}>
            • {x}
          </Text>
        ))}
      </Section>
    </ScrollView>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 28, fontWeight: "800", marginBottom: 6 },
  hint: { fontSize: 14, opacity: 0.7, marginBottom: 16 },

  section: { marginBottom: 18 },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 6 },
  item: { fontSize: 15, lineHeight: 22 },
});
