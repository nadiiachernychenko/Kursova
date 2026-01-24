import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppTheme } from "../../lib/theme";
import { useT } from "../../lib/i18n";

export function EcoLevelStubScreen() {
  const { colors } = useAppTheme();
  const t = useT();

  // пока мок, позже подключим реальные балы/streak
  const points = 124;
  const streak = 6;
  const levelName = "Еко-панда";

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <View style={styles.container}>
        <Text style={[styles.h1, { color: colors.textOnDark }]}>{t("ecoLevel")}</Text>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.big, { color: colors.textOnDark }]}>{levelName}</Text>
          <Text style={[styles.muted, { color: colors.muted }]}>{points} балів</Text>

          <View style={{ height: 12 }} />

          <Text style={[styles.muted, { color: colors.muted }]}>Streak</Text>
          <Text style={[styles.big, { color: colors.textOnDark }]}>{streak} днів 🔥</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: 16 },
  h1: { fontSize: 22, fontWeight: "900" },
  card: { marginTop: 12, borderRadius: 16, padding: 14, borderWidth: 1 },
  big: { fontSize: 18, fontWeight: "900" },
  muted: { marginTop: 4, fontSize: 13, fontWeight: "700" },
});
