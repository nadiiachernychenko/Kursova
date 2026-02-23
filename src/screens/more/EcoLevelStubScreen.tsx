import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useAppTheme } from "../../lib/theme";
import { useT } from "../../lib/i18n";
import { supabase } from "../../lib/supabase";
import { ActivityIndicator, Image, Platform, Pressable, StyleSheet, Text, View, ScrollView } from "react-native";
type MyEcoLevelRow = {
  user_id: string;
  days_in_app: number;
  total_points: number;
  eco_level: number;
};

const FONTS = {
  title: "Nunito_800ExtraBold",
  title2: "Nunito_700Bold",
  body: "Manrope_600SemiBold",
  strong: "Manrope_700Bold",
} as const;

const LEAVES = require("../../../assets/leaves-texture.png");

type Pal = {
  bg: string;
  card: string;
  text: string;
  sub: string;
  line: string;
  accent: string;
  accentSoft: string;
  placeholder: string;
};

function makePal(colors: any, isDark: boolean): Pal {
  const accent = "#2F6F4E";
  const bg = colors?.background ?? (isDark ? "#0E0F11" : "#F6F7F4");
  const card = colors?.card ?? (isDark ? "#15171A" : "#FFFFFF");
  const text = colors?.text ?? (isDark ? "#F2F3F4" : "#111214");
  const border = colors?.border ?? (isDark ? "rgba(242,243,244,0.10)" : "rgba(17,18,20,0.08)");

  return {
    bg,
    card,
    text,
    sub: isDark ? "rgba(242,243,244,0.72)" : "rgba(17,18,20,0.68)",
    line: border,
    accent,
    accentSoft: isDark ? "rgba(47,111,78,0.22)" : "#E7F2EC",
    placeholder: isDark ? "rgba(242,243,244,0.40)" : "rgba(17,18,20,0.38)",
  };
}

const shadow = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  android: { elevation: 5 },
  default: {},
});

function levelTitleKey(level: number) {
  if (level <= 1) return "ecoLevelTitleStarter";
  if (level <= 3) return "ecoLevelTitleExplorer";
  if (level <= 6) return "ecoLevelTitleBuilder";
  if (level <= 9) return "ecoLevelTitleAdvocate";
  return "ecoLevelTitleHero";
}

function createStyles(C: Pal, isDark: boolean) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: "transparent" },
    root: { flex: 1, backgroundColor: "transparent" },
content: { flex: 1, paddingHorizontal: 14, paddingTop: 14, paddingBottom: 18 },
    h1: { fontSize: 22, color: C.text, fontFamily: FONTS.title },

    hero: {
      marginTop: 12,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: C.line,
      backgroundColor: C.card,
      overflow: "hidden",
      ...shadow,
    },
    heroInner: { padding: 14 },

    heroTopRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10,
    },
    badge: {
      backgroundColor: C.accentSoft,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    badgeText: { color: C.accent, fontSize: 12, fontFamily: FONTS.strong },
    softDot: { width: 10, height: 10, borderRadius: 999, backgroundColor: C.accent, opacity: 0.35 },

    levelRow: { flexDirection: "row", alignItems: "flex-end", gap: 12 },
    levelBig: { fontSize: 56, lineHeight: 60, color: C.text, fontFamily: FONTS.title, letterSpacing: -0.5 },
    levelMeta: { flex: 1, paddingBottom: 8 },
    levelLabel: { fontSize: 12, color: C.sub, fontFamily: FONTS.strong, letterSpacing: 0.7, textTransform: "uppercase" },
    levelTitle: { marginTop: 4, fontSize: 16, color: C.text, fontFamily: FONTS.title2 },

    divider: { marginTop: 14, height: StyleSheet.hairlineWidth, backgroundColor: C.line, opacity: 0.9 },

    scaleHead: { marginTop: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
    scaleTitle: { fontSize: 14, color: C.text, fontFamily: FONTS.title2 },
    scaleNumbers: { fontSize: 13, color: C.sub, fontFamily: FONTS.strong },

    track: { marginTop: 12, height: 10, borderRadius: 999, overflow: "hidden", backgroundColor: isDark ? "rgba(242,243,244,0.12)" : "rgba(17,18,20,0.08)" },
    fill: { height: "100%", borderRadius: 999, backgroundColor: C.accent },

    scaleFoot: { marginTop: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    footText: { fontSize: 11, color: C.sub, fontFamily: FONTS.strong },

    list: { marginTop: 14 },
    row: { paddingVertical: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    rowLabel: { fontSize: 13, color: C.sub, fontFamily: FONTS.body },
    rowValue: { fontSize: 13, color: C.text, fontFamily: FONTS.strong },
    rowDivider: { height: StyleSheet.hairlineWidth, backgroundColor: C.line, opacity: 0.9 },

    center: { marginTop: 18, alignItems: "center", gap: 10 },
    errorTitle: { fontSize: 16, color: C.text, fontFamily: FONTS.title2 },
    errorText: { fontSize: 13, color: C.sub, fontFamily: FONTS.body, lineHeight: 18, textAlign: "center" },

    retryBtn: {
      marginTop: 10,
      alignSelf: "center",
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.06)",
      backgroundColor: C.accentSoft,
    },
    retryText: { fontSize: 12, color: C.accent, fontFamily: FONTS.strong },
  });
}

export function EcoLevelStubScreen() {
  const { colors, isDark } = useAppTheme() as any;
  const t = useT();

  const PAL = useMemo(() => makePal(colors, !!isDark), [colors, isDark]);
  const styles = useMemo(() => createStyles(PAL, !!isDark), [PAL, isDark]);

  const [loading, setLoading] = useState(true);
  const [row, setRow] = useState<MyEcoLevelRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  const aliveRef = useRef(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data: authData, error: authErr } = await supabase.auth.getUser();
    const user = authData?.user;

    if (!aliveRef.current) return;

    if (authErr) {
      setError("Не вдалося отримати користувача.");
      setRow(null);
      setLoading(false);
      return;
    }

    if (!user) {
      setError("Потрібна авторизація, щоб показати еко-рівень.");
      setRow(null);
      setLoading(false);
      return;
    }

    const { data, error: qErr } = await supabase
      .from("my_eco_level")
      .select("user_id, days_in_app, total_points, eco_level")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!aliveRef.current) return;

    if (qErr) {
      setError("Не вдалося завантажити дані. Перевір інтернет і спробуй ще раз.");
      setRow(null);
      setLoading(false);
      return;
    }

    setRow((data as MyEcoLevelRow) ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    aliveRef.current = true;
    load();
    return () => {
      aliveRef.current = false;
    };
  }, [load]);

  const points = row?.total_points ?? 0;
  const days = row?.days_in_app ?? 0;

  const STEP = 100;

  const computedLevel = Math.max(1, Math.floor(points / STEP) + 1);
  const shownLevel = row?.eco_level ?? computedLevel;

  const nextTarget = Math.max(STEP, Math.ceil((points + 1) / STEP) * STEP);
  const prevTarget = nextTarget - STEP;

  const inRange = points - prevTarget;
  const progress = Math.max(0, Math.min(1, inRange / STEP));
  const left = Math.max(0, nextTarget - points);

  const title = useMemo(() => t(levelTitleKey(shownLevel)), [shownLevel, t]);

 return (
  <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={isDark ? ["#14241B", "#111315"] : ["#F6F9F6", "#FFFFFF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <Image
        source={LEAVES}
        resizeMode="cover"
        style={[
          StyleSheet.absoluteFillObject,
          { opacity: isDark ? 0.06 : 0.08, transform: [{ scale: 1.15 }] },
        ]}
      />

      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          { backgroundColor: isDark ? "rgba(0,0,0,0.10)" : "rgba(255,255,255,0.18)" },
        ]}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 14, paddingTop: 14, paddingBottom: 18 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.h1}>{t("ecoLevel")}</Text>

        <View style={styles.hero}>
          <LinearGradient
            colors={isDark ? ["#14241B", "#111315"] : ["#F6F9F6", "#FFFFFF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />

          <View style={styles.heroInner}>
            <View style={styles.heroTopRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>EcoLife</Text>
              </View>
              <View style={styles.softDot} />
            </View>

            {loading ? (
              <View style={styles.center}>
                <ActivityIndicator />
              </View>
            ) : error ? (
              <View style={styles.center}>
                <Text style={styles.errorTitle}>Помилка</Text>
                <Text style={styles.errorText}>{error}</Text>
                <Pressable onPress={load} style={({ pressed }) => [styles.retryBtn, { opacity: pressed ? 0.8 : 1 }]}>
                  <Text style={styles.retryText}>Спробувати ще раз</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <View style={styles.levelRow}>
                  <Text style={styles.levelBig}>{shownLevel}</Text>
                  <View style={styles.levelMeta}>
                    <Text style={styles.levelLabel}>{t("ecoLevelLevelLabel")}</Text>
                    <Text style={styles.levelTitle} numberOfLines={1}>
                      {title}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.scaleHead}>
                  <Text style={styles.scaleTitle}>Прогрес до наступного рівня</Text>
                  <Text style={styles.scaleNumbers}>
                    {points} / {nextTarget}
                  </Text>
                </View>

                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${progress * 100}%` }]} />
                </View>

                <View style={styles.scaleFoot}>
                  <Text style={styles.footText}>{prevTarget}</Text>
                  <Text style={styles.footText}>{left === 0 ? "Рівень оновлено" : `Ще ${left} балів`}</Text>
                  <Text style={styles.footText}>{nextTarget}</Text>
                </View>

                <View style={styles.list}>
                  <View style={styles.rowDivider} />

                  <View style={styles.row}>
                    <Text style={styles.rowLabel}>Днів разом</Text>
                    <Text style={styles.rowValue}>{days}</Text>
                  </View>

                  <View style={styles.rowDivider} />

                  <View style={styles.row}>
                    <Text style={styles.rowLabel}>Усього балів</Text>
                    <Text style={styles.rowValue}>{points}</Text>
                  </View>

                  <View style={styles.rowDivider} />
                </View>
              </>
            )}
          </View>
        </View>

        <View style={{ flex: 1 }} />
      </ScrollView>
    </View>
  </SafeAreaView>
);
}

export default EcoLevelStubScreen;