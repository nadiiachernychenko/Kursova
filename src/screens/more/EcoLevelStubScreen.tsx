import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppTheme } from "../../lib/theme";
import { useT } from "../../lib/i18n";
import { supabase } from "../../lib/supabase";

type MyEcoLevelRow = {
  user_id: string;
  days_in_app: number;
  total_points: number;
  eco_level: number;
};

function levelTitleKey(level: number) {
  if (level <= 1) return "ecoLevelTitleStarter";
  if (level <= 3) return "ecoLevelTitleExplorer";
  if (level <= 6) return "ecoLevelTitleBuilder";
  if (level <= 9) return "ecoLevelTitleAdvocate";
  return "ecoLevelTitleHero";
}

export function EcoLevelStubScreen() {
  const { colors } = useAppTheme();
  const t = useT();

  const [loading, setLoading] = useState(true);
  const [row, setRow] = useState<MyEcoLevelRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setError(null);

      const { data: authData, error: authErr } = await supabase.auth.getUser();
      const user = authData?.user;

      if (!alive) return;

      if (authErr) {
        setError(authErr.message);
        setLoading(false);
        return;
      }
      if (!user) {
        setError("No user");
        setLoading(false);
        return;
      }

      const { data, error: qErr } = await supabase
        .from("my_eco_level")
        .select("user_id, days_in_app, total_points, eco_level")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!alive) return;

      if (qErr) {
        setError(qErr.message);
        setRow(null);
        setLoading(false);
        return;
      }

      setRow((data as MyEcoLevelRow) ?? null);
      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, []);

  const level = row?.eco_level ?? 1;
  const points = row?.total_points ?? 0;
  const days = row?.days_in_app ?? 0;

  const title = useMemo(() => t(levelTitleKey(level)), [level, t]);

  const ecoSubtitle = useMemo(() => {
    if (loading) return t("ecoLevelLoadingLine");
    if (error) return t("ecoLevelErrorLine");
    if (points === 0) return t("ecoLevelZeroLine");
    if (points < 100) return t("ecoLevelUnder100Line");
    return t("ecoLevelNiceLine");
  }, [loading, error, points, t]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <View style={styles.container}>
        <Text style={[styles.h1, { color: colors.textOnDark }]}>{t("ecoLevel")}</Text>

        <View style={[styles.hero, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {loading ? (
            <ActivityIndicator />
          ) : error ? (
            <>
              <Text style={[styles.errorTitle, { color: colors.textOnDark }]}>{t("ecoLevelErrorTitle")}</Text>
              <Text style={[styles.errorText, { color: colors.muted }]}>{error}</Text>
            </>
          ) : (
            <>
              <Text style={[styles.levelLabel, { color: colors.muted }]}>{t("ecoLevelLevelLabel")}</Text>
              <Text style={[styles.levelNumber, { color: colors.textOnDark }]}>{level}</Text>
              <Text style={[styles.levelTitle, { color: colors.textOnDark }]}>{title}</Text>
              <Text style={[styles.subline, { color: colors.muted }]}>{ecoSubtitle}</Text>
            </>
          )}
        </View>

        <View style={styles.grid}>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statLabel, { color: colors.muted }]}>{t("ecoLevelTotalPoints")}</Text>
            <Text style={[styles.statValue, { color: colors.textOnDark }]}>{loading ? "—" : points}</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statLabel, { color: colors.muted }]}>{t("ecoLevelDaysInApp")}</Text>
            <Text style={[styles.statValue, { color: colors.textOnDark }]}>{loading ? "—" : days}</Text>
          </View>
        </View>

        <Pressable
          onPress={() => setHelpOpen(true)}
          style={[styles.helpBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
        >
          <Text style={[styles.helpText, { color: colors.textOnDark }]}>{t("ecoLevelHowBtn")}</Text>
          <Text style={[styles.helpSub, { color: colors.muted }]}>{t("ecoLevelHowSub")}</Text>
        </Pressable>
      </View>

      <Modal visible={helpOpen} transparent animationType="fade" onRequestClose={() => setHelpOpen(false)}>
        <View style={styles.modalWrap}>
          <Pressable style={[styles.backdrop, { backgroundColor: "rgba(0,0,0,0.35)" }]} onPress={() => setHelpOpen(false)} />

          <View style={[styles.sheet, { backgroundColor: colors.bg, borderColor: colors.border }]}>
            <View style={styles.sheetTop}>
              <Text style={[styles.sheetTitle, { color: colors.textOnDark }]}>{t("ecoLevelHowTitle")}</Text>
              <Pressable onPress={() => setHelpOpen(false)} style={[styles.xBtn, { borderColor: colors.border }]}>
                <Text style={[styles.xText, { color: colors.textOnDark }]}>✕</Text>
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.sheetContent} showsVerticalScrollIndicator={false}>
              <Text style={[styles.sheetLead, { color: colors.muted }]}>{t("ecoLevelHowLead")}</Text>

              <View style={styles.block}>
                <Text style={[styles.sheetH, { color: colors.textOnDark }]}>{t("ecoLevelHowPointsTitle")}</Text>

                <View style={styles.row}>
                  <Text style={[styles.emoji, { color: colors.textOnDark }]}>🌱</Text>
                  <Text style={[styles.sheetText, { color: colors.muted }]}>{t("ecoLevelRuleEcoDay")}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={[styles.emoji, { color: colors.textOnDark }]}>⚡</Text>
                  <Text style={[styles.sheetText, { color: colors.muted }]}>{t("ecoLevelRuleChallenge")}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={[styles.emoji, { color: colors.textOnDark }]}>📸</Text>
                  <Text style={[styles.sheetText, { color: colors.muted }]}>{t("ecoLevelRuleEcoProof")}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={[styles.emoji, { color: colors.textOnDark }]}>🧾</Text>
                  <Text style={[styles.sheetText, { color: colors.muted }]}>{t("ecoLevelRuleChallengeProof")}</Text>
                </View>

                <Text style={[styles.tip, { color: colors.muted }]}>{t("ecoLevelTipPoints")}</Text>
              </View>

              <View style={styles.block}>
                <Text style={[styles.sheetH, { color: colors.textOnDark }]}>{t("ecoLevelHowLevelTitle")}</Text>
                <Text style={[styles.sheetText, { color: colors.muted }]}>{t("ecoLevelRuleLevel100")}</Text>

                <View style={styles.exampleBox}>
                  <Text style={[styles.exampleText, { color: colors.textOnDark }]}>{t("ecoLevelExamples")}</Text>
                </View>
              </View>

              <View style={styles.block}>
                <Text style={[styles.sheetH, { color: colors.textOnDark }]}>{t("ecoLevelHowDaysTitle")}</Text>
                <Text style={[styles.sheetText, { color: colors.muted }]}>{t("ecoLevelRuleDaysInApp")}</Text>
              </View>

              <Pressable
                onPress={() => setHelpOpen(false)}
                style={[styles.closeBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <Text style={[styles.closeText, { color: colors.textOnDark }]}>{t("ecoLevelGotIt")}</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: 16 },
  h1: { fontSize: 22, fontWeight: "900" },

  hero: {
    marginTop: 12,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    alignItems: "center",
  },
  levelLabel: { fontSize: 12, fontWeight: "900", letterSpacing: 1 },
  levelNumber: { fontSize: 48, fontWeight: "900", lineHeight: 52, marginTop: 4 },
  levelTitle: { fontSize: 16, fontWeight: "900", marginTop: 4 },
  subline: { marginTop: 6, fontSize: 13, fontWeight: "700", textAlign: "center", lineHeight: 18 },

  grid: { flexDirection: "row", gap: 12, marginTop: 12 },
  statCard: { flex: 1, borderRadius: 16, padding: 14, borderWidth: 1 },
  statLabel: { fontSize: 12, fontWeight: "900", letterSpacing: 0.6 },
  statValue: { marginTop: 8, fontSize: 20, fontWeight: "900" },

  helpBtn: { marginTop: 12, borderRadius: 16, padding: 14, borderWidth: 1 },
  helpText: { fontSize: 15, fontWeight: "900" },
  helpSub: { marginTop: 6, fontSize: 12, fontWeight: "700", lineHeight: 16 },

  modalWrap: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject },

  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    maxHeight: "78%",
    overflow: "hidden",
  },
  sheetTop: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sheetTitle: { fontSize: 18, fontWeight: "900" },
  xBtn: { width: 34, height: 34, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  xText: { fontSize: 14, fontWeight: "900" },

  sheetContent: { paddingHorizontal: 16, paddingBottom: 16 },
  sheetLead: { fontSize: 13, fontWeight: "700", lineHeight: 18 },

  block: { marginTop: 14 },
  sheetH: { fontSize: 14, fontWeight: "900" },
  sheetText: { marginTop: 8, fontSize: 13, fontWeight: "700", lineHeight: 18 },

  row: { flexDirection: "row", gap: 10, marginTop: 10, alignItems: "flex-start" },
  emoji: { fontSize: 16, fontWeight: "900", marginTop: 1 },

  tip: { marginTop: 10, fontSize: 12, fontWeight: "800", lineHeight: 16 },

  exampleBox: { marginTop: 10, borderRadius: 14, padding: 12, backgroundColor: "rgba(0,0,0,0.06)" },
  exampleText: { fontSize: 13, fontWeight: "800", lineHeight: 18 },

  closeBtn: { marginTop: 16, borderRadius: 14, paddingVertical: 12, alignItems: "center", borderWidth: 1 },
  closeText: { fontSize: 14, fontWeight: "900" },

  errorTitle: { fontSize: 16, fontWeight: "900" },
  errorText: { marginTop: 6, fontSize: 13, fontWeight: "700", textAlign: "center" },
});
