import React, { useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  Animated,
  Image,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import AppTopBar from "../components/AppTopBar";
import { useAppTheme } from "../lib/theme";
import type { SortStackParamList } from "../navigation/SortStack";
import { CATEGORIES, type WasteCategoryId } from "../data/sorting";

type R = RouteProp<SortStackParamList, "Category">;

const LEAVES = require("../../assets/leaves-texture.png");

const FONTS = {
  title: "Nunito_800ExtraBold",
  title2: "Nunito_700Bold",
  body: "Manrope_600SemiBold",
  strong: "Manrope_700Bold",
} as const;

type Pal = {
  bg: string;
  card: string;
  text: string;
  sub: string;
  line: string;
  accent: string;
  accentSoft: string;
  teal: string;
  placeholder: string;
  danger: string;
  dangerSoft: string;
};

function makePal(colors: any, isDark: boolean): Pal {
  const accent = "#2F6F4E";
  const teal = "#2C7A7B";
  const bg = colors?.background ?? (isDark ? "#0E0F11" : "#F6F7F4");
  const card = colors?.card ?? (isDark ? "#15171A" : "#FFFFFF");
  const text = colors?.text ?? (isDark ? "#F2F3F4" : "#111214");
const border = isDark ? "rgba(47,111,78,0.28)" : "rgba(47,111,78,0.16)";
  return {
    bg,
    card,
    text,
    sub: isDark ? "rgba(242,243,244,0.72)" : "rgba(17,18,20,0.68)",
    line: border,
    accent,
    accentSoft: isDark ? "rgba(47,111,78,0.22)" : "#E7F2EC",
    teal,
    placeholder: isDark ? "rgba(242,243,244,0.40)" : "rgba(17,18,20,0.38)",
    danger: "#B91C1C",
    dangerSoft: isDark ? "rgba(185,28,28,0.22)" : "rgba(185,28,28,0.10)",
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

function usePressScale(to = 0.985) {
  const v = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(v, { toValue: to, useNativeDriver: true, speed: 28, bounciness: 0 }).start();
  };
  const onPressOut = () => {
    Animated.spring(v, { toValue: 1, useNativeDriver: true, speed: 28, bounciness: 6 }).start();
  };

  return { transform: [{ scale: v }], onPressIn, onPressOut };
}

function createStyles(C: Pal, isDark: boolean) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: "transparent" },
    bg: { ...StyleSheet.absoluteFillObject },
    texture: { ...StyleSheet.absoluteFillObject, opacity: isDark ? 0.06 : 0.08, transform: [{ scale: 1.15 }] },
    veil: { ...StyleSheet.absoluteFillObject, backgroundColor: isDark ? "rgba(0,0,0,0.10)" : "rgba(255,255,255,0.18)" },

    content: { paddingHorizontal: 14, paddingTop: 22, paddingBottom: 22 },

    hero: {
      borderRadius: 22,
      borderWidth: 1,
      borderColor: C.line,
      backgroundColor: C.card,
      overflow: "hidden",
    },
    heroInner: { padding: 14 },

    heroTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
    badge: { backgroundColor: C.accentSoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
    badgeText: { color: C.accent, fontSize: 12, fontFamily: FONTS.strong },
softDot: { 
  width: 10,
  height: 10,
  borderRadius: 999,
  backgroundColor: C.accent, 
},
    heroTitle: { marginTop: 2, fontSize: 20, color: C.text, fontFamily: FONTS.title },
    heroSub: { marginTop: 8, fontSize: 13, color: C.sub, lineHeight: 18, fontFamily: FONTS.body },

    pill: {
      marginTop: 12,
      alignSelf: "flex-start",
      backgroundColor: C.accentSoft,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.06)",
    },
    pillText: { color: C.accent, fontSize: 12, fontFamily: FONTS.strong },

    card: {
      marginTop: 12,
      borderRadius: 22,
backgroundColor: isDark
  ? "rgba(20,36,27,0.9)"
  : "#FFFFFF",
        borderWidth: 1,
      borderColor: C.line,
      overflow: "hidden",
      padding: 14,
    },
    cardTitle: { fontSize: 14, color: C.text, fontFamily: FONTS.title2 },
    divider: {
      marginTop: 10,
      marginBottom: 10,
      height: 1,
      backgroundColor: C.line,
      opacity: 1,
    },

    row: { flexDirection: "row", gap: 10, alignItems: "flex-start", marginBottom: 10 },
    dot: {
      width: 7,
      height: 7,
      borderRadius: 99,
      backgroundColor: C.accent, 
      marginTop: 6,
      opacity: 1, 
    },
    rowText: { flex: 1, fontSize: 13, color: C.sub, lineHeight: 18, fontFamily: FONTS.body },

    dangerCard: {
      marginTop: 12,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: isDark ? "rgba(185,28,28,0.35)" : "rgba(185,28,28,0.25)",
      backgroundColor: C.dangerSoft,
      overflow: "hidden",
      padding: 14,
    },
    dangerTitle: { color: isDark ? "rgba(255,255,255,0.92)" : "#7F1D1D", fontFamily: FONTS.title2, fontSize: 14 },
    dangerText: { marginTop: 6, color: isDark ? "rgba(255,255,255,0.80)" : "rgba(127,29,29,0.82)", fontFamily: FONTS.body, fontSize: 13, lineHeight: 18 },
  });
}

function ListBlock({
  title,
  items,
  styles,
}: {
  title: string;
  items: string[];
  styles: any;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <View style={styles.divider} />
      <View>
        {items.map((t, idx) => (
          <View key={`${title}:${idx}`} style={styles.row}>
            <View style={styles.dot} />
            <Text style={styles.rowText}>{t}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function CategoryScreen() {
  const route = useRoute<R>();
  const { colors, isDark } = useAppTheme() as any;

  const PAL = useMemo(() => makePal(colors, !!isDark), [colors, isDark]);
  const styles = useMemo(() => createStyles(PAL, !!isDark), [PAL, isDark]);

  const heroScale = usePressScale(0.992);

  const id = (route.params?.id ?? "paper") as WasteCategoryId;
  const cat = CATEGORIES.find((c) => c.id === id);

  if (!cat) {
    return (
      <View style={styles.root}>
        <LinearGradient
          colors={isDark ? ["#14241B", "#111315"] : ["#F6F9F6", "#FFFFFF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.bg}
        />
        <Image source={LEAVES} resizeMode="cover" style={styles.texture} />
        <View pointerEvents="none" style={styles.veil} />
<AppTopBar />
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.dangerCard}>
            <Text style={styles.dangerTitle}>Категорію не знайдено</Text>
            <Text style={styles.dangerText}>Перевір, чи правильний id у навігації.</Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  const isHazard = cat.id === "hazard";

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={isDark ? ["#14241B", "#111315"] : ["#F6F9F6", "#FFFFFF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.bg}
      />
      <Image source={LEAVES} resizeMode="cover" style={styles.texture} />
      <View pointerEvents="none" style={styles.veil} />
<AppTopBar />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.hero, { transform: heroScale.transform }]}>
          <LinearGradient
            colors={isDark ? ["#14241B", "#111315"] : ["#F6F9F6", "#FFFFFF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Pressable onPressIn={heroScale.onPressIn} onPressOut={heroScale.onPressOut} style={styles.heroInner}>
            <View style={styles.heroTopRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>EcoLife • Деталі</Text>
              </View>
              <View style={styles.softDot} />
            </View>

            <Text style={styles.heroTitle}>{cat.title}</Text>
            <Text style={styles.heroSub}>
              Коротко і практично: що можна / не можна та як підготувати для сортування.
            </Text>

            <View style={styles.pill}>
              <Text style={styles.pillText}>Контейнер: {cat.colorHint}</Text>
            </View>
          </Pressable>
        </Animated.View>

        {isHazard && (
          <View style={styles.dangerCard}>
            <Text style={styles.dangerTitle}>Важливо</Text>
            <Text style={styles.dangerText}>
              Небезпечні відходи не кидають у загальне сміття. Збирай окремо і здавай у спецпункти.
            </Text>
          </View>
        )}

        <ListBlock title="Можна" items={cat.can} styles={styles} />
        <ListBlock title="Не можна" items={cat.cannot} styles={styles} />
        <ListBlock title="Поради" items={cat.tips} styles={styles} />

        <View style={{ height: 12 }} />
      </ScrollView>
    </View>
  );
}