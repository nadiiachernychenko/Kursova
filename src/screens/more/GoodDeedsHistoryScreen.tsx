import React from "react";
import {ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
export function GoodDeedsHistoryScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.h1}>Історія добрих справ</Text>
        <Text style={styles.sub}>Тут буде список усіх еко-дій користувача</Text>

        <View style={styles.card}>
          <Text style={styles.item}>♻️ Сортування пластику — +1</Text>
          <Text style={styles.date}>Сьогодні</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.item}>📸 Фото-доказ — +3</Text>
          <Text style={styles.date}>Вчора</Text>
        </View>

        <Text style={styles.note}>
          Далі підключимо реальні дані з твоїх таблиць (sorting, points і т.д.).
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#07101f" },
  container: { padding: 16, paddingBottom: 24 },
  h1: { color: "#e2e8f0", fontSize: 22, fontWeight: "900" },
  sub: { color: "#94a3b8", marginTop: 6, marginBottom: 14 },
  card: {
    borderRadius: 16,
    padding: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.16)",
    marginBottom: 10,
  },
  item: { color: "#e2e8f0", fontWeight: "800" },
  date: { color: "#94a3b8", marginTop: 6, fontSize: 12 },
  note: { color: "rgba(148,163,184,0.75)", marginTop: 10, lineHeight: 18 },
});
