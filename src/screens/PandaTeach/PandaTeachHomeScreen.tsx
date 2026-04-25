import React, { useCallback, useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, Platform, Image } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useEduProfile } from "../../lib/useEduProfile";
import { useAppTheme } from "../../lib/theme";
import AppTopBar from "../../components/AppTopBar";

type Nav = any;

type Item = {
  key: string;
  title: string;
  desc: string;
  to: string;
  tone: "mint" | "sky" | "sand" | "lilac" | "slate";
};

const LEAVES = require("../../../assets/leaves-texture.png");

export default function PandaTeachHomeScreen() {
  const navigation = useNavigation<Nav>();
  const { points, loading, errorText, refresh } = useEduProfile();
  const [toast] = useState<string | null>(null);

  const { colors, isDark } = useAppTheme() as any;
  const styles = useMemo(() => createStyles(colors, !!isDark), [colors, isDark]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [])
  );

  const games: Item[] = useMemo(
    () => [
      { key: "facts", title: "Еко-факти", desc: "Швидко, цікаво, з бонусами", to: "EcoFacts", tone: "sky" },
      { key: "myth", title: "Міф чи правда", desc: "Вгадай правильно — прокачайся", to: "MyTruth", tone: "sand" },
      { key: "asks", title: "Панда питає", desc: "Питання з варіантами", to: "PandaAsks", tone: "lilac" },
      { key: "sort", title: "Сортування", desc: "Що куди викидати?", to: "Sorting", tone: "slate" },
    ],
    []
  );

  return (
    <View style={styles.root}>
      <LinearGradient style={styles.bg} colors={[styles._bgA, styles._bgB]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      <Image source={LEAVES} style={styles.texture} resizeMode="repeat" />
      <View style={styles.veil} />

      <AppTopBar />

      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <LinearGradient
            colors={isDark ? ["#14241B", "#111315"] : ["#F6F9F6", "#FFFFFF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.heroInner}>
            <View style={styles.heroTopRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>EcoLife • PandaTeach</Text>
              </View>
            </View>

            <Text style={styles.heroTitle}>Панда вчить</Text>
            <Text style={styles.heroSub}>2 хвилини на день — і ти вже краще сортуєш</Text>

            <View style={styles.heroRow}>
              <View style={styles.pointsTicket}>
                <View style={styles.pointsGlowA} />
                <View style={styles.pointsGlowB} />
                <View style={styles.ticketCutL} />
                <View style={styles.ticketCutR} />
                <Text style={styles.pointsValue}>{loading ? "…" : String(points)}</Text>
                <Text style={styles.pointsLabel}>бали</Text>
              </View>

              <Pressable
                onPress={() => navigation.navigate("PandaShop")}
                style={({ pressed }) => [styles.shopPill, { opacity: pressed ? 0.72 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] }]}
              >
                <View style={styles.shopIconWrap}>
                  <Ionicons name="storefront-outline" size={16} color={styles._shopIcon as any} />
                </View>
                <Text style={styles.shopPillText}>Магазин панди</Text>
                <Ionicons name="chevron-forward" size={16} color={styles._shopChevron as any} />
              </Pressable>
            </View>

            {errorText ? (
              <Pressable onPress={refresh} style={({ pressed }) => [styles.errorBox, { opacity: pressed ? 0.9 : 1 }]}>
                <Text style={styles.errorText}>{errorText}</Text>
                <Text style={styles.errorHint}>Натисни, щоб спробувати ще раз</Text>
              </Pressable>
            ) : null}

            {toast ? (
              <View style={styles.toast}>
                <Text style={styles.toastText}>{toast}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Тільки починаєш?</Text>
        </View>

        <Pressable
          onPress={() => navigation.navigate("BeginnerQuestions")}
          style={({ pressed }) => [styles.beginnerRow, { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.995 : 1 }] }]}
        >
          <View style={styles.beginnerBar} />
          <View style={styles.rowMain}>
            <Text style={styles.rowTitle} numberOfLines={1}>
              Новачок: старт
            </Text>
            <Text style={styles.rowDesc} numberOfLines={2}>
              Підкажемо, з чого почати
            </Text>
          </View>
          <Text style={styles.rowArrow}>›</Text>
        </Pressable>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Ігри</Text>
          <Text style={styles.sectionHint}>обери режим</Text>
        </View>

        <View style={styles.list}>
          {games.map((it) => (
            <Pressable
              key={it.key}
              onPress={() => navigation.navigate(it.to)}
              style={({ pressed }) => [styles.row, styles[`row_${it.tone}`], { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.995 : 1 }] }]}
            >
              <View style={[styles.accentBar, styles[`bar_${it.tone}`]]} />
              <View style={styles.rowMain}>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {it.title}
                </Text>
                <Text style={styles.rowDesc} numberOfLines={2}>
                  {it.desc}
                </Text>
              </View>
              <Text style={styles.rowArrow}>›</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function createStyles(colors: any, isDark: boolean) {
  const text = colors?.text ?? (isDark ? "#F2F3F4" : "#111214");
  const sub = isDark ? "rgba(242,243,244,0.70)" : "rgba(17,18,20,0.64)";
  const line = colors?.border ?? (isDark ? "rgba(242,243,244,0.10)" : "rgba(17,18,20,0.08)");

  const tones = {
    mint: isDark ? "rgba(47,111,78,0.20)" : "rgba(231,242,236,0.90)",
    sky: isDark ? "rgba(70,120,200,0.18)" : "rgba(230,241,255,0.92)",
    sand: isDark ? "rgba(190,150,80,0.18)" : "rgba(252,244,232,0.94)",
    lilac: isDark ? "rgba(150,110,210,0.18)" : "rgba(244,236,255,0.94)",
    slate: isDark ? "rgba(120,140,150,0.18)" : "rgba(236,242,244,0.94)",
  } as const;

  const bars = {
    mint: isDark ? "rgba(92,200,140,0.78)" : "rgba(47,111,78,0.62)",
    sky: isDark ? "rgba(120,170,255,0.78)" : "rgba(70,120,200,0.62)",
    sand: isDark ? "rgba(255,210,120,0.78)" : "rgba(190,150,80,0.62)",
    lilac: isDark ? "rgba(200,160,255,0.78)" : "rgba(150,110,210,0.62)",
    slate: isDark ? "rgba(180,200,210,0.78)" : "rgba(120,140,150,0.62)",
  } as const;

  const shadow = Platform.select({
    ios: { shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 18, shadowOffset: { width: 0, height: 10 } },
    android: { elevation: 3 },
    default: {} as any,
  });

  const bgA = isDark ? "#0D0F11" : "#F7FBF8";
  const bgB = isDark ? "#0A0C0F" : "#FFFFFF";

  const heroCut = colors?.card ?? (isDark ? "#15171A" : "#FFFFFF");

  const ticketBg = isDark ? "rgba(16,30,22,0.34)" : "rgba(236,248,242,1)";
  const ticketLine = isDark ? "rgba(92,200,140,0.18)" : "rgba(47,111,78,0.14)";

  const shopBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.55)";
  const shopLine = isDark ? "rgba(255,255,255,0.10)" : "rgba(47,111,78,0.10)";
  const shopIcon = isDark ? "rgba(92,200,140,0.92)" : "rgba(47,111,78,0.78)";
  const shopChevron = isDark ? "rgba(242,243,244,0.60)" : "rgba(17,18,20,0.50)";

  const badgeBg = isDark ? "rgba(47,111,78,0.22)" : "#E7F2EC";
  const badgeText = "#2F6F4E";

  return StyleSheet.create({
    _bgA: bgA as any,
    _bgB: bgB as any,
    _shopIcon: shopIcon as any,
    _shopChevron: shopChevron as any,

    root: { flex: 1, backgroundColor: "transparent" },

    bg: { ...StyleSheet.absoluteFillObject },
    texture: { ...StyleSheet.absoluteFillObject, opacity: isDark ? 0.06 : 0.08, transform: [{ scale: 1.15 }] },
    veil: { ...StyleSheet.absoluteFillObject, backgroundColor: isDark ? "rgba(0,0,0,0.10)" : "rgba(255,255,255,0.18)" },

    listContent: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 18, gap: 14 },

    hero: {
      borderRadius: 22,
      borderWidth: 1,
      borderColor: line,
      backgroundColor: colors?.card ?? (isDark ? "#15171A" : "#FFFFFF"),
      ...shadow,
      overflow: "hidden",
    },
    heroInner: { padding: 14 },
    heroTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
    badge: { backgroundColor: badgeBg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
    badgeText: { color: badgeText, fontSize: 12, fontFamily: "Manrope_700Bold" },

    heroTitle: { marginTop: 2, fontSize: 20, color: text, fontFamily: "Nunito_800ExtraBold" },
    heroSub: { marginTop: 8, fontSize: 13, color: sub, fontFamily: "Manrope_600SemiBold", lineHeight: 18 },

    heroRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 14 },

    pointsTicket: {
      position: "relative",
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 16,
      backgroundColor: ticketBg,
      borderWidth: 1,
      borderColor: ticketLine,
      flexDirection: "row",
      alignItems: "baseline",
      gap: 8,
      minWidth: 120,
      overflow: "hidden",
    },

    pointsGlowA: {
      position: "absolute",
      width: 80,
      height: 80,
      borderRadius: 999,
      left: -18,
      top: -30,
      backgroundColor: isDark ? "rgba(92,200,140,0.12)" : "rgba(47,111,78,0.08)",
    },

    pointsGlowB: {
      position: "absolute",
      width: 90,
      height: 90,
      borderRadius: 999,
      right: -26,
      bottom: -38,
      backgroundColor: isDark ? "rgba(92,200,140,0.10)" : "rgba(70,120,200,0.06)",
    },

    ticketCutL: {
      position: "absolute",
      width: 18,
      height: 18,
      borderRadius: 999,
      left: -9,
      top: 18,
      backgroundColor: heroCut,
      opacity: 1,
    },

    ticketCutR: {
      position: "absolute",
      width: 18,
      height: 18,
      borderRadius: 999,
      right: -9,
      top: 18,
      backgroundColor: heroCut,
      opacity: 1,
    },

    pointsValue: { fontSize: 14, color: text, fontFamily: "Manrope_700Bold" },
    pointsLabel: { fontSize: 12, color: sub, fontFamily: "Manrope_600SemiBold" },

    shopPill: {
      flex: 1,
      minWidth: 0,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 16,
      backgroundColor: shopBg,
      borderWidth: 1,
      borderColor: shopLine,
      overflow: "hidden",
    },

    shopIconWrap: {
      width: 28,
      height: 28,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDark ? "rgba(92,200,140,0.10)" : "rgba(47,111,78,0.08)",
    },

    shopPillText: { flex: 1, minWidth: 0, fontSize: 12, color: text, fontFamily: "Manrope_700Bold", opacity: 0.92 },

    errorBox: {
      borderRadius: 18,
      padding: 12,
      backgroundColor: isDark ? "rgba(255,90,90,0.08)" : "rgba(255,90,90,0.06)",
      gap: 4,
      marginTop: 12,
    },
    errorText: { fontSize: 12, color: text, fontFamily: "Manrope_700Bold" },
    errorHint: { fontSize: 12, color: sub, fontFamily: "Manrope_600SemiBold" },

    toast: {
      borderRadius: 18,
      paddingVertical: 10,
      paddingHorizontal: 12,
      backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.55)",
      marginTop: 12,
    },
    toastText: { fontSize: 12, color: text, fontFamily: "Manrope_700Bold" },

    sectionHeader: { marginTop: 2, flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" },
    sectionTitle: { fontSize: 14, color: text, fontFamily: "Nunito_800ExtraBold" },
    sectionHint: { fontSize: 12, color: sub, fontFamily: "Manrope_600SemiBold" },

    list: { gap: 10 },

    row: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 22,
      paddingVertical: 14,
      paddingHorizontal: 14,
      overflow: "hidden",
      ...shadow,
    },

    beginnerRow: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 22,
      paddingVertical: 16,
      paddingHorizontal: 14,
      backgroundColor: tones.mint,
      ...shadow,
      overflow: "hidden",
    },

    rowMain: { flex: 1, minWidth: 0, paddingLeft: 10 },
    rowTitle: { fontSize: 14, color: text, fontFamily: "Nunito_700Bold" },
    rowDesc: { marginTop: 4, fontSize: 12, color: sub, fontFamily: "Manrope_600SemiBold", lineHeight: 16 },
    rowArrow: { marginLeft: 10, fontSize: 22, color: sub, fontFamily: "Manrope_700Bold" },

    accentBar: { width: 6, height: 40, borderRadius: 999 },
    beginnerBar: { width: 6, height: 44, borderRadius: 999, backgroundColor: bars.mint },

    row_mint: { backgroundColor: tones.mint },
    row_sky: { backgroundColor: tones.sky },
    row_sand: { backgroundColor: tones.sand },
    row_lilac: { backgroundColor: tones.lilac },
    row_slate: { backgroundColor: tones.slate },

    bar_mint: { backgroundColor: bars.mint },
    bar_sky: { backgroundColor: bars.sky },
    bar_sand: { backgroundColor: bars.sand },
    bar_lilac: { backgroundColor: bars.lilac },
    bar_slate: { backgroundColor: bars.slate },
  });
}