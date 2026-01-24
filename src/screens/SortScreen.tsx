import { useMemo, useState } from "react";
import { View, Text, StyleSheet, TextInput, FlatList, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { CATEGORIES, ITEMS } from "../data/sorting";
import type { SortStackParamList } from "../navigation/SortStack";
import { useAppTheme } from "../lib/theme";

export default function SortScreen() {
  const { colors, isDark } = useAppTheme() as any;
  const PAL = useMemo(() => makePal(colors, !!isDark), [colors, isDark]);
  const styles = useMemo(() => createStyles(PAL), [PAL]);

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
        placeholderTextColor={PAL.placeholder}
        style={styles.input}
        autoCapitalize="none"
      />

      {q.trim().length > 0 ? (
        <View style={styles.listWrap}>
          <Text style={styles.section}>Результати</Text>

          <FlatList
            data={results}
            keyExtractor={(item) => item.name}
            renderItem={({ item }) => {
              const cat = CATEGORIES.find((c) => c.id === item.categoryId);
              return (
                <Pressable
                  style={({ pressed }) => [styles.resultRow, pressed && { opacity: 0.92 }]}
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
        <View style={styles.listWrap}>
          <Text style={styles.section}>Категорії</Text>

          <FlatList
            data={CATEGORIES}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}
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

type Pal = {
  bg: string;
  card: string;
  text: string;
  sub: string;
  border: string;
  placeholder: string;
};

function makePal(colors: any, isDark: boolean): Pal {
  const bg = colors?.background ?? colors?.bg ?? (isDark ? "#0E0F11" : "#FFFFFF");
  const card = colors?.card ?? (isDark ? "#15171A" : "#FFFFFF");
  const text = colors?.text ?? colors?.textOnDark ?? (isDark ? "#F2F3F4" : "#111214");
  const border = colors?.border ?? (isDark ? "rgba(242,243,244,0.10)" : "rgba(17,18,20,0.10)");
  const muted = colors?.muted ?? (isDark ? "rgba(242,243,244,0.70)" : "rgba(17,18,20,0.70)");

  return {
    bg,
    card,
    text,
    sub: muted,
    border,
    placeholder: muted,
  };
}

function createStyles(COLORS: Pal) {
  return StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: COLORS.bg },

    subtitle: {
      fontSize: 16,
      fontWeight: "600",
      marginTop: 8,
      color: COLORS.sub,
    },

    input: {
      marginTop: 12,
      borderWidth: 1,
      borderColor: COLORS.border,
      backgroundColor: COLORS.card,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      color: COLORS.text,
    },

    listWrap: { marginTop: 8, flex: 1 },

    section: {
      marginTop: 12,
      marginBottom: 8,
      fontSize: 16,
      fontWeight: "800",
      color: COLORS.text,
    },

    card: {
      borderWidth: 1,
      borderColor: COLORS.border,
      backgroundColor: COLORS.card,
      borderRadius: 14,
      padding: 14,
      marginBottom: 12,
    },

    cardTitle: {
      fontSize: 17,
      fontWeight: "800",
      marginBottom: 4,
      color: COLORS.text,
    },

    cardSub: {
      fontSize: 13,
      color: COLORS.sub,
    },

    resultRow: {
      borderWidth: 1,
      borderColor: COLORS.border,
      backgroundColor: COLORS.card,
      borderRadius: 14,
      padding: 12,
      marginBottom: 10,
    },

    resultName: {
      fontSize: 16,
      fontWeight: "800",
      color: COLORS.text,
    },

    resultCat: {
      marginTop: 2,
      fontSize: 14,
      color: COLORS.sub,
    },

    resultNote: {
      marginTop: 6,
      fontSize: 13,
      color: COLORS.sub,
    },
  });
}
