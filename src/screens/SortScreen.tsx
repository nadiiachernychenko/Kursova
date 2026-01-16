import { useMemo, useState } from "react";
import { View, Text, StyleSheet, TextInput, FlatList, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { CATEGORIES, ITEMS } from "../data/sorting";
import type { SortStackParamList } from "../navigation/SortStack";

export default function SortScreen() {
  const [q, setQ] = useState("");

  const navigation = useNavigation<NativeStackNavigationProp<SortStackParamList>>();

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return ITEMS.filter((x) => x.name.toLowerCase().includes(s)).slice(0, 20);
  }, [q]);

  return (
    <View style={styles.container}>
      <Text style={styles.subtitle}>Введи назву відходу — підкажу категорію</Text>

      <TextInput
        value={q}
        onChangeText={setQ}
        placeholder="Наприклад: батарейки, пляшка, коробка…"
        style={styles.input}
        autoCapitalize="none"
      />

      {q.trim().length > 0 ? (
        <View style={{ marginTop: 8, flex: 1 }}>
          <Text style={styles.section}>Результати</Text>

          <FlatList
            data={results}
            keyExtractor={(item) => item.name}
            renderItem={({ item }) => {
              const cat = CATEGORIES.find((c) => c.id === item.categoryId);
              return (
                <Pressable
                  style={styles.resultRow}
                  onPress={() => {
                    if (!cat) return;
                    navigation.navigate("Category", { id: cat.id });
                  }}
                >
                  <Text style={styles.resultName}>{item.name}</Text>
                  <Text style={styles.resultCat}>
                    {cat?.emoji} {cat?.title}
                  </Text>
                  {item.note ? <Text style={styles.resultNote}>{item.note}</Text> : null}
                </Pressable>
              );
            }}
          />
        </View>
      ) : (
        <View style={{ marginTop: 8, flex: 1 }}>
          <Text style={styles.section}>Категорії</Text>

          <FlatList
            data={CATEGORIES}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable
                style={styles.card}
                onPress={() => navigation.navigate("Category", { id: item.id })}
              >
                <Text style={styles.cardTitle}>
                  {item.emoji} {item.title}
                </Text>
                <Text style={styles.cardSub}>{item.colorHint}</Text>
              </Pressable>
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 28, fontWeight: "800", marginTop: 8 },
subtitle: { fontSize: 16, fontWeight: "600", opacity: 0.8, marginTop: 8 },
  input: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.18)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  section: { marginTop: 12, marginBottom: 8, fontSize: 16, fontWeight: "700" },

  card: {
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  cardTitle: { fontSize: 17, fontWeight: "700", marginBottom: 4 },
  cardSub: { fontSize: 13, opacity: 0.75 },

  resultRow: {
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  resultName: { fontSize: 16, fontWeight: "700" },
  resultCat: { marginTop: 2, fontSize: 14, opacity: 0.85 },
  resultNote: { marginTop: 6, fontSize: 13, opacity: 0.75 },
});
