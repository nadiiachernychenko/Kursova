import React, { useCallback } from "react";
import { View, Text, Pressable, StyleSheet, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useEduProfile } from "../../lib/useEduProfile";

export default function EcoAssistantProScreen() {
  const { refresh, expertUnlocked } = useEduProfile();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  if (!expertUnlocked) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>🔒 AI-помічник PRO</Text>
        <Text style={styles.sub}>Доступно лише для Eco-експерта.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.h1}>🤖 AI-помічник PRO</Text>
      <Text style={styles.sub}>
        Тут зробимо “професійний режим”: більш детальні відповіді + персональні еко-плани.
      </Text>

      <Pressable
        style={({ pressed }) => [styles.btn, pressed && { opacity: 0.9 }]}
        onPress={() => Alert.alert("PRO-режим", "Скажи: хочеш окремий екран чату чи це буде перемикач в існуючому Eco Assistant?")}
      >
        <Text style={styles.btnText}>Налаштувати PRO-режим</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  title: { fontSize: 18, fontWeight: "900" },
  h1: { fontSize: 20, fontWeight: "900" },
  sub: { opacity: 0.7, lineHeight: 18 },
  btn: { marginTop: 10, borderWidth: 1, borderRadius: 16, padding: 14, alignItems: "center" },
  btnText: { fontWeight: "900" },
});