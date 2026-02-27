import React, { useCallback, useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, Alert } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useEduProfile } from "../../lib/useEduProfile";
import { earnEduPoints } from "../../lib/eduApi";
import { useAppTheme } from "../../lib/theme";
import AppTopBar from "../../components/AppTopBar";

type Nav = any;

export default function PandaTeachHomeScreen() {
  const navigation = useNavigation<Nav>();
  const { points, loading, errorText, refresh } = useEduProfile();
  const [toast, setToast] = useState<string | null>(null);

  const { colors, isDark } = useAppTheme() as any;
  const styles = useMemo(() => createStyles(colors, !!isDark), [colors, isDark]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const chips = useMemo(
    () => [{ text: `⭐ Бали: ${loading ? "…" : points}` }, { text: "🔥 Серія: скоро" }],
    [loading, points]
  );

  const testPlusOne = async () => {
    try {
      const res: any = await earnEduPoints("facts", 1);
      await refresh();
      if (res?.ok === false) setToast(res?.reason ?? "На сьогодні ліміт 🐼");
      else setToast(`+${res?.added ?? 1} бал ✨`);
    } catch (e: any) {
      Alert.alert("Помилка", e?.message ?? "Щось пішло не так");
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Топбар как на главной/сортуванні: только ☰, без заголовка */}
      <AppTopBar showTitle={false} />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          {/* Оставляем только один заголовок внутри экрана */}
          <Text style={styles.title}>🐼 Панда вчить</Text>
          <Text style={styles.subtitle}>Грай 2 хвилини — і прокачуй еко-знання</Text>

          <View style={styles.chipsRow}>
            {chips.map((c, idx) => (
              <View key={idx} style={styles.chip}>
                <Text style={styles.chipText}>{c.text}</Text>
              </View>
            ))}
          </View>

          {errorText ? (
            <Pressable onPress={refresh} style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {errorText} (натисни, щоб оновити)</Text>
            </Pressable>
          ) : null}

          {toast ? (
            <View style={styles.toast}>
              <Text style={styles.toastText}>{toast}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.grid}>
          <Card
            title="🌿 Еко-факти"
            desc="Швидкі факти — і бонусні бали"
            onPress={() => navigation.navigate("EcoFacts")}
            styles={styles}
          />
          <Card
            title="🧠 Міф чи правда?"
            desc="Вгадай правильно — отримай більше"
            onPress={() => navigation.navigate("MyTruth")}
            styles={styles}
          />
          <Card
            title="❓ Панда питає"
            desc="Короткі питання з варіантами"
            onPress={() => navigation.navigate("PandaAsks")}
            styles={styles}
          />
          <Card
            title="🗑️ Сортування"
            desc="Що куди викидати?"
            onPress={() => navigation.navigate("Sorting")}
            styles={styles}
          />
        </View>

        <View style={styles.row}>
          <Pressable onPress={() => navigation.navigate("PandaShop")} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>🛍️ Магазин панди</Text>
          </Pressable>

          <Pressable onPress={testPlusOne} style={styles.secondaryBtn}>
            <Text style={styles.secondaryBtnText}>🧪 Тест: +1 бал</Text>
          </Pressable>
        </View>

        <Text style={styles.note}>Якщо бали не ростуть — значить спрацював денний ліміт (сервер).</Text>
      </ScrollView>
    </View>
  );
}

function Card({
  title,
  desc,
  onPress,
  styles,
}: {
  title: string;
  desc: string;
  onPress: () => void;
  styles: any;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardDesc}>{desc}</Text>
      <Text style={styles.cardHint}>Тицни →</Text>
    </Pressable>
  );
}

function createStyles(colors: any, isDark: boolean) {
  const bg = colors?.background ?? (isDark ? "#0E0F11" : "#fff");
  const card = colors?.card ?? (isDark ? "#15171A" : "white");
  const text = colors?.text ?? (isDark ? "#F2F3F4" : "#111214");
  const border = colors?.border ?? (isDark ? "rgba(242,243,244,0.10)" : "rgba(0,0,0,0.10)");
  const heroBg = isDark ? "rgba(47,111,78,0.14)" : "rgba(248,251,249,1)";

  return StyleSheet.create({
    container: { padding: 16, paddingTop: 8, paddingBottom: 32, gap: 14, backgroundColor: bg },

    hero: {
      padding: 16,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: border,
      backgroundColor: heroBg,
      gap: 10,
    },

    title: { fontSize: 26, fontWeight: "900", color: text },
    subtitle: { fontSize: 13, opacity: 0.75, fontWeight: "700", color: text },

    chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 },
    chip: {
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: border,
      backgroundColor: card,
    },
    chipText: { fontSize: 12, fontWeight: "800", opacity: 0.85, color: text },

    errorBox: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: isDark ? "rgba(242,243,244,0.14)" : "rgba(0,0,0,0.12)",
      backgroundColor: card,
    },
    errorText: { fontSize: 12, opacity: 0.8, fontWeight: "800", color: text },

    toast: {
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: border,
      backgroundColor: card,
    },
    toastText: { fontSize: 12, fontWeight: "900", opacity: 0.85, color: text },

    grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "space-between" },
    card: {
      width: "48%",
      padding: 14,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: border,
      backgroundColor: card,
      gap: 6,
    },
    cardTitle: { fontSize: 14, fontWeight: "900", color: text },
    cardDesc: { fontSize: 12, opacity: 0.78, fontWeight: "700", lineHeight: 16, color: text },
    cardHint: { fontSize: 12, fontWeight: "900", opacity: 0.45, marginTop: 2, color: text },

    row: { gap: 10, marginTop: 2 },

    primaryBtn: {
      paddingVertical: 12,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: border,
      backgroundColor: card,
      alignItems: "center",
    },
    primaryBtnText: { fontWeight: "900", fontSize: 13, color: text },

    secondaryBtn: {
      paddingVertical: 12,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: border,
      backgroundColor: card,
      alignItems: "center",
      opacity: 0.9,
    },
    secondaryBtnText: { fontWeight: "900", fontSize: 13, opacity: 0.9, color: text },

    note: { fontSize: 12, opacity: 0.65, lineHeight: 18, paddingHorizontal: 2, color: text },
  });
}