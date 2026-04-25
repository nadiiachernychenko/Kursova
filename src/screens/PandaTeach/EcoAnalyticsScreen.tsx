import React, { useCallback } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useEduProfile } from "../../lib/useEduProfile";

export default function EcoAnalyticsScreen() {
  const { refresh, expertUnlocked, points } = useEduProfile();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  if (!expertUnlocked) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>🔒 Еко-аналітика</Text>
        <Text style={styles.sub}>Доступно лише для Eco-експерта.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.h1}>📊 Еко-аналітика</Text>
      <Text style={styles.sub}>Поки базова версія. Далі підключимо реальні метрики.</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Поточні бали</Text>
        <Text style={styles.big}>{points}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Найближчим часом додамо</Text>
        <Text style={styles.sub2}>• графік активності</Text>
        <Text style={styles.sub2}>• streak (серія днів)</Text>
        <Text style={styles.sub2}>• “топ-категорії” сортування</Text>
        <Text style={styles.sub2}>• бонуси за “експерт-квізи”</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  title: { fontSize: 18, fontWeight: "900" },
  h1: { fontSize: 20, fontWeight: "900" },
  sub: { opacity: 0.7, lineHeight: 18 },
  card: { borderWidth: 1, borderRadius: 16, padding: 14, gap: 8 },
  cardTitle: { fontWeight: "900" },
  big: { fontSize: 32, fontWeight: "900" },
  sub2: { opacity: 0.75, lineHeight: 18 },
});