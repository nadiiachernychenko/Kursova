import React, { useCallback } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useEduProfile } from "../../lib/useEduProfile";

export default function EcoExpertQuizzesScreen() {
  const { refresh, expertUnlocked } = useEduProfile();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  if (!expertUnlocked) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>🔒 Поглиблені тести</Text>
        <Text style={styles.sub}>Доступно лише для Eco-експерта.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.h1}>🧠 Поглиблені тести</Text>
      <Text style={styles.sub}>Тут буде “важкий режим” з бонусними балами та складними питаннями.</Text>

      <Pressable
        style={({ pressed }) => [styles.item, pressed && { opacity: 0.9 }]}
        onPress={() => Alert.alert("Скоро", "Підключимо твої “міфи/факти/країни/технології” у форматі експерт-квізів.")}
      >
        <Text style={styles.itemTitle}>🔥 Експерт-квіз: країни та технології</Text>
        <Text style={styles.itemSub}>20 питань • високий рівень</Text>
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.item, pressed && { opacity: 0.9 }]}
        onPress={() => Alert.alert("Скоро", "Додамо рейтинг/серію перемог/медалі.")}
      >
        <Text style={styles.itemTitle}>🏆 Серії та досягнення</Text>
        <Text style={styles.itemSub}>Нагороди за регулярність</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  title: { fontSize: 18, fontWeight: "900" },
  h1: { fontSize: 20, fontWeight: "900" },
  sub: { opacity: 0.7, lineHeight: 18 },
  item: { borderWidth: 1, borderRadius: 16, padding: 14, gap: 4 },
  itemTitle: { fontWeight: "900" },
  itemSub: { opacity: 0.7 },
});