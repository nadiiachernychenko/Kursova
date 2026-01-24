import React from "react";
import { StyleSheet, Text, Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSettings, AppLang } from "../../context/SettingsContext";
import { useAppTheme } from "../../lib/theme";
import { useT } from "../../lib/i18n";

export function LanguagePickerScreen() {
  const { lang, setLang } = useSettings();
  const { colors } = useAppTheme();
  const t = useT();

  const Row = ({ value, label }: { value: AppLang; label: string }) => {
    const active = lang === value;
    return (
      <Pressable
        style={[
          styles.row,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
        onPress={() => setLang(value)}
      >
        <Text style={[styles.rowText, { color: colors.textOnDark }]}>{label}</Text>
        <Ionicons
          name={active ? "radio-button-on" : "radio-button-off"}
          size={20}
          color={colors.accent}
        />
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <View style={styles.container}>
        <Text style={[styles.h1, { color: colors.textOnDark }]}>{t("language")}</Text>
        <Text style={[styles.sub, { color: colors.muted }]}>{t("chooseLanguage")}</Text>

        <Row value="ua" label="Українська" />
        <Row value="en" label="English" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: 16 },
  h1: { fontSize: 22, fontWeight: "900" },
  sub: { marginTop: 6, marginBottom: 14 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  rowText: { fontWeight: "800" },
});
