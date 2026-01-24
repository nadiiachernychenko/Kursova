import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ListItem } from "../../components/ListItem";
import { SupportSheet } from "../../components/SupportSheet";

import { useSettings } from "../../context/SettingsContext";
import { enableDailyReminder, disableDailyReminder } from "../../lib/notifications";
import { useT } from "../../lib/i18n";
import { useAppTheme } from "../../lib/theme";
import FAQScreen from "../support/FAQScreen";

import { supabase } from "../../lib/supabase";

export default function MoreScreen() {
  const nav = useNavigation<any>();
  const t = useT();
  const { colors } = useAppTheme();

  const { theme, lang, remindersEnabled, setRemindersEnabled } = useSettings();
  const [supportOpen, setSupportOpen] = useState(false);

  const [profileName, setProfileName] = useState<string>("Панда");

  useEffect(() => {
    (async () => {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;

      if (!user) return;

      // пробуем взять имя из profiles
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.first_name?.trim()) {
        setProfileName(profile.first_name.trim());
        return;
      }

      // fallback — часть email
      if (user.email) {
        setProfileName(user.email.split("@")[0]);
        return;
      }

      // финальный fallback
      setProfileName("Панда");
    })();
  }, []);

  const mockUser = useMemo(
    () => ({
      name: profileName,
      levelName: "Еко-панда",
      points: 124,
      streak: 6,
      pandaLine: "Ти молодець сьогодні! 🌱",
    }),
    [profileName]
  );

  // ⚠️ лучше вынести в env/config позже, но ок пока так
  const supportEmail = "nadac1784@gmail.com";
  const hotlinePhone = "+380637556233";

 const toggleReminders = async () => {
  if (!remindersEnabled) {
    const r = await enableDailyReminder();

    // 🔥 в dev включаем UI даже если система не дала
    setRemindersEnabled(true);
  } else {
    await disableDailyReminder();
    setRemindersEnabled(false);
  }
};



  const logout = async () => {
    await supabase.auth.signOut();
  };

  const go = (routeName: string) => {
    try {
      nav.navigate(routeName);
    } catch {}
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* TOP BLOCK */}
        <View style={styles.topRow}>
          <Pressable
            style={[styles.topCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => go("Profile")}
          >
            <Text style={[styles.topTitle, { color: colors.textOnDark }]}>{t("profile")}</Text>
            <Text style={[styles.topSub, { color: colors.muted }]} numberOfLines={1}>
              🐼 {mockUser.name}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.topCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => go("EcoLevel")}
          >
            <Text style={[styles.topTitle, { color: colors.textOnDark }]}>{t("ecoLevel")}</Text>
            <Text style={[styles.topSub, { color: colors.muted }]} numberOfLines={1}>
              {mockUser.levelName} • {mockUser.points} балів
            </Text>
          </Pressable>
        </View>

        <Text style={[styles.pandaLine, { color: colors.textOnDark }]}>{mockUser.pandaLine}</Text>

        {/* USER */}
        <Text style={[styles.section, { color: colors.muted }]}>{t("userSection")}</Text>

        <ListItem
          icon="leaf"
          title={t("goodDeeds")}
          subtitle={t("goodDeedsSub")}
          onPress={() => go("GoodDeedsHistory")}
        />

        {/* SETTINGS */}
        <Text style={[styles.section, { color: colors.muted }]}>{t("settings")}</Text>

        <ListItem
          icon="color-palette"
          title={t("theme")}
          rightText={themeLabel(theme, t)}
          onPress={() => go("ThemePicker")}
        />

        <ListItem
          icon="notifications"
          title={t("reminders")}
          subtitle={remindersEnabled ? t("enabled") : t("disabled")}
          onPress={toggleReminders}
        />

        <ListItem
          icon="language"
          title={t("language")}
          rightText={lang === "ua" ? "Українська" : "English"}
          onPress={() => go("LanguagePicker")}
        />

        {/* SUPPORT */}
        <Text style={[styles.section, { color: colors.muted }]}>{t("support")}</Text>

        <ListItem
          icon="help-circle"
          title={t("contact")}
          subtitle={t("contactSub")}
          onPress={() => setSupportOpen(true)}
        />

        {/* LOGOUT */}
        <View style={{ height: 10 }} />
        <ListItem icon="log-out" title={t("logout")} danger onPress={logout} />

        <Text style={[styles.version, { color: colors.muted }]}>v 1.0.0</Text>
      </ScrollView>

      <SupportSheet
        visible={supportOpen}
        onClose={() => setSupportOpen(false)}
        onOpenFaq={() => {
          setSupportOpen(false);
          go("FAQ");
        }}
        onOpenFeedback={() => {
          setSupportOpen(false);
          go("Feedback");
        }}
        supportEmail={supportEmail}
        hotlinePhone={hotlinePhone}
      />
    </SafeAreaView>
  );
}

function themeLabel(theme: string, t: (k: any) => string) {
  if (theme === "light") return t("light");
  if (theme === "dark") return t("dark");
  return t("system");
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: 16, paddingBottom: 26 },

  topRow: { flexDirection: "row", gap: 12 },
  topCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  topTitle: { fontWeight: "800", fontSize: 15 },
  topSub: { marginTop: 6, fontSize: 12 },

  pandaLine: { marginTop: 10, marginBottom: 14, fontWeight: "600" },

  section: { fontSize: 12, fontWeight: "800", marginTop: 14, marginBottom: 8 },
  version: { textAlign: "center", marginTop: 16 },
});
