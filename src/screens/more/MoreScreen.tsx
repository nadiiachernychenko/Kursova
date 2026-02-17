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
import { supabase } from "../../lib/supabase";

type MyEcoLevelRow = {
  user_id: string;
  days_in_app: number;
  total_points: number;
  eco_level: number;
};

export default function MoreScreen() {
  const nav = useNavigation<any>();
  const t = useT();
  const { colors } = useAppTheme();

  const { theme, lang, remindersEnabled, setRemindersEnabled } = useSettings();
  const [supportOpen, setSupportOpen] = useState(false);

  const [profileName, setProfileName] = useState<string>("Панда");
  const [ecoRow, setEcoRow] = useState<MyEcoLevelRow | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name")
        .eq("id", user.id)
        .maybeSingle();

      if (!alive) return;

      if (profile?.first_name?.trim()) setProfileName(profile.first_name.trim());
      else if (user.email) setProfileName(user.email.split("@")[0]);
      else setProfileName("Панда");
    })();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;

    (async () => {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (!user) return;

      const { data, error } = await supabase
        .from("my_eco_level")
        .select("user_id, days_in_app, total_points, eco_level")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!alive) return;

      if (error) {
        setEcoRow(null);
        return;
      }

      setEcoRow((data as MyEcoLevelRow) ?? null);
    })();

    return () => {
      alive = false;
    };
  }, []);

  const topEcoSubtitle = useMemo(() => {
    const lvl = ecoRow?.eco_level ?? 1;
    const pts = ecoRow?.total_points ?? 0;
    return `Level ${lvl} • ${pts} балів`;
  }, [ecoRow?.eco_level, ecoRow?.total_points]);

  const pandaLine = useMemo(() => {
    const pts = ecoRow?.total_points ?? 0;
    if (pts >= 200) return "Сильний темп. Продовжуй 🌿";
    if (pts >= 100) return "Клас! Ти вже вийшла на Level 2 🌱";
    return "Маленькі кроки = великий результат 🌱";
  }, [ecoRow?.total_points]);

  const supportEmail = "nadac1784@gmail.com";
  const hotlinePhone = "+380637556233";

  const toggleReminders = async () => {
    if (!remindersEnabled) {
      await enableDailyReminder();
      setRemindersEnabled(true);
    } else {
      await disableDailyReminder();
      setRemindersEnabled(false);
    }
  };

  const logout = async () => {
    setSupportOpen(false);
    console.log("LOGOUT pressed");
    const r = await supabase.auth.signOut();
    console.log("signOut", r);
  };

  const go = (routeName: string) => {
    try {
      nav.navigate(routeName);
    } catch {}
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.topRow}>
          <Pressable
            style={[styles.topCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => go("Profile")}
          >
            <Text style={[styles.topTitle, { color: colors.textOnDark }]}>{t("profile")}</Text>
            <Text style={[styles.topSub, { color: colors.muted }]} numberOfLines={1}>
              🐼 {profileName}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.topCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => go("EcoLevel")}
          >
            <Text style={[styles.topTitle, { color: colors.textOnDark }]}>{t("ecoLevel")}</Text>
            <Text style={[styles.topSub, { color: colors.muted }]} numberOfLines={1}>
              {topEcoSubtitle}
            </Text>
          </Pressable>
        </View>

        <Text style={[styles.pandaLine, { color: colors.textOnDark }]}>{pandaLine}</Text>

        <Text style={[styles.section, { color: colors.muted }]}>{t("userSection")}</Text>

        <ListItem icon="leaf" title={t("goodDeeds")} subtitle={t("goodDeedsSub")} onPress={() => go("GoodDeedsHistory")} />

        <Text style={[styles.section, { color: colors.muted }]}>{t("settings")}</Text>

        <ListItem icon="color-palette" title={t("theme")} rightText={themeLabel(theme, t)} onPress={() => go("ThemePicker")} />

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

        <Text style={[styles.section, { color: colors.muted }]}>{t("support")}</Text>

        <ListItem icon="help-circle" title={t("contact")} subtitle={t("contactSub")} onPress={() => setSupportOpen(true)} />

        <View style={{ height: 14 }} />

        <Pressable
          onPress={logout}
          style={({ pressed }) => [
            styles.logoutBtn,
            { borderColor: colors.border, backgroundColor: colors.card },
            pressed && { opacity: 0.9 },
          ]}
        >
          <Text style={[styles.logoutText, { color: colors.danger }]}>{t("logout")}</Text>
        </Pressable>

        <Text style={[styles.version, { color: colors.muted }]}>v 1.0.0</Text>

        <View style={{ height: 120 }} />
      </ScrollView>

      {supportOpen && (
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
      )}
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
  container: { padding: 16 },

  topRow: { flexDirection: "row", gap: 12 },
  topCard: { flex: 1, borderRadius: 16, padding: 14, borderWidth: 1 },
  topTitle: { fontWeight: "800", fontSize: 15 },
  topSub: { marginTop: 6, fontSize: 12 },

  pandaLine: { marginTop: 10, marginBottom: 14, fontWeight: "600" },

  section: { fontSize: 12, fontWeight: "800", marginTop: 14, marginBottom: 8 },
  version: { textAlign: "center", marginTop: 16 },

  logoutBtn: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  logoutText: { fontWeight: "900", fontSize: 14 },
});
