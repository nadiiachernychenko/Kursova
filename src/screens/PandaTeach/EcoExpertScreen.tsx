import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useEduProfile } from "../../lib/useEduProfile";

export default function EcoExpertScreen() {
  const { expertUnlocked } = useEduProfile();

  if (!expertUnlocked) {
    return (
      <View style={styles.center}>
        <Text>🔒 Купіть доступ у магазині</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Еко-експерт</Text>
      <Text>Тут буде складний контент.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 20, fontWeight: "800", marginBottom: 10 },
});