import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  FlatList,
  Keyboard,
  Platform,
  Animated,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { useAppTheme } from "../lib/theme";
import type { SortStackParamList } from "../navigation/SortStack";
import type { WasteCategoryId } from "../data/sorting";
import { addToSortHistory, clearSortHistory, loadSortHistory, SortHistoryItem } from "../lib/sortHistory";
import { resolveLocalSorting } from "../lib/sortLocalResolve";
type Nav = NativeStackNavigationProp<SortStackParamList, "SortMain">;

type QuickItem = {
  title: string;
  id: WasteCategoryId;
  keywords: string[];
};

const QUICK: QuickItem[] = [
  { title: "Папір", id: "paper" as WasteCategoryId, keywords: ["папір", "картон", "коробка", "газета", "лист", "зошит"] },
  { title: "Пластик", id: "plastic" as WasteCategoryId, keywords: ["пластик", "пляшка", "пет", "pet", "pp", "hdpe", "пакет", "контейнер", "кришка"] },
  { title: "Скло", id: "glass" as WasteCategoryId, keywords: ["скло", "банка", "пляшка скло", "скляна"] },
  { title: "Метал", id: "metal" as WasteCategoryId, keywords: ["метал", "алюміній", "жерсть", "бляшанка", "консерва"] },
  { title: "Органіка", id: "organic" as WasteCategoryId, keywords: ["органіка", "харчові", "очистки", "кава", "чай", "шкірка"] },
  { title: "Небезпечні", id: "hazard" as WasteCategoryId, keywords: ["батарей", "лампа", "ртуть", "акумулятор", "ліки", "аерозоль", "фарба", "хімія"] },
];

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
};

function norm(s: string) {
  return s.trim().toLowerCase();
}

function scoreMatch(query: string, text: string) {
  const q = norm(query);
  const t = norm(text);
  if (!q) return 0;
  if (t === q) return 100;
  if (t.startsWith(q)) return 60;
  if (t.includes(q)) return 30;
  return 0;
}

function guessCategory(query: string): QuickItem | null {
  const q = norm(query);
  if (!q) return null;
  let best: { item: QuickItem; score: number } | null = null;
  for (const item of QUICK) {
    let s = scoreMatch(q, item.title);
    for (const k of item.keywords) s = Math.max(s, scoreMatch(q, k));
    if (!best || s > best.score) best = { item, score: s };
  }
  if (!best) return null;
  if (best.score >= 60) return best.item;
  return null;
}

function hashToInt(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0);
}

function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

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

function makePal(colors: any, isDark: boolean): Pal {
  const accent = "#2F6F4E";
  const teal = "#2C7A7B";
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
    teal,
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

function createStyles(COLORS: Pal, isDark: boolean) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: "transparent" },
    bg: { ...StyleSheet.absoluteFillObject },
    texture: { ...StyleSheet.absoluteFillObject, opacity: isDark ? 0.06 : 0.08, transform: [{ scale: 1.15 }] },
    veil: { ...StyleSheet.absoluteFillObject, backgroundColor: isDark ? "rgba(0,0,0,0.10)" : "rgba(255,255,255,0.18)" },

    listContent: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 18 },
    hero: {
      borderRadius: 22,
      borderWidth: 1,
      borderColor: COLORS.line,
      backgroundColor: COLORS.card,
      overflow: "hidden",
      ...shadow,
    },
    heroInner: { padding: 14 },
    heroTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
    badge: { backgroundColor: COLORS.accentSoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
    badgeText: { color: COLORS.accent, fontSize: 12, fontFamily: FONTS.strong },
    softDot: { width: 10, height: 10, borderRadius: 999, backgroundColor: COLORS.teal, opacity: 0.55 },
    heroTitle: { marginTop: 2, fontSize: 20, color: COLORS.text, fontFamily: FONTS.title },
    heroSub: { marginTop: 8, fontSize: 13, color: COLORS.sub, lineHeight: 18, fontFamily: FONTS.body },

    searchWrap: {
      marginTop: 12,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.06)",
      backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.03)",
      padding: 12,
    },
    inputLabel: { fontSize: 12, color: COLORS.sub, fontFamily: FONTS.body, marginBottom: 8 },
    inputRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    input: {
      flex: 1,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)",
      backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.72)",
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 12,
      fontSize: 13,
      color: COLORS.text,
      fontFamily: FONTS.body,
    },
    goBtn: {
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: 16,
      backgroundColor: COLORS.accent,
      alignItems: "center",
      justifyContent: "center",
      minWidth: 92,
    },
    goTxt: { color: "#fff", fontSize: 12, fontFamily: FONTS.strong },

    actions: { flexDirection: "row", gap: 10, marginTop: 12 },
    actionBtn: {
      flex: 1,
      borderRadius: 18,
      padding: 14,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.06)",
      backgroundColor: COLORS.accentSoft,
    },
    actionTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    actionTitle: { color: COLORS.accent, fontSize: 13, fontFamily: FONTS.strong },
    actionEmoji: { fontSize: 16, opacity: 0.9 },
    actionSub: { color: COLORS.sub, marginTop: 6, fontSize: 12, lineHeight: 16, fontFamily: FONTS.body },

    sectionHeader: {
      marginTop: 14,
      marginBottom: 10,
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
    },
    sectionTitle: { fontSize: 14, color: COLORS.text, fontFamily: FONTS.title },
    clear: { color: COLORS.accent, fontFamily: FONTS.strong, fontSize: 12 },

    row: {
      borderRadius: 22,
backgroundColor: isDark
  ? "rgba(20,36,27,0.9)"
  : "#FFFFFF",
        borderWidth: 1,
      borderColor: COLORS.line,
      overflow: "hidden",
      ...shadow,
      marginBottom: 10,
    },
    rowInner: { padding: 14 },
    rowTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
    rowTitle: { flex: 1, fontSize: 14, color: COLORS.text, fontFamily: FONTS.title2 },
    rowMeta: { fontSize: 11, color: COLORS.sub, fontFamily: FONTS.body },
    rowPill: { marginTop: 10, alignSelf: "flex-start", backgroundColor: COLORS.accentSoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
    rowPillText: { color: COLORS.accent, fontSize: 12, fontFamily: FONTS.strong },

    empty: {
      borderRadius: 22,
      borderWidth: 1,
      borderColor: COLORS.line,
      backgroundColor: isDark ? "rgba(21,24,27,0.58)" : "rgba(255,255,255,0.72)",
      padding: 16,
      alignItems: "center",
    },
    emptyTitle: { color: COLORS.text, fontFamily: FONTS.title2, fontSize: 14 },
    emptyText: { color: COLORS.sub, fontFamily: FONTS.body, fontSize: 12, marginTop: 6, textAlign: "center", lineHeight: 16 },

pandaWrap: { position: "absolute", right: -6, top: 92, zIndex: 999, alignItems: "flex-end" },    pandaEmoji: { fontSize: 56 },
    pandaBubble: {
  marginTop: -6,
  marginRight: 10,
  borderWidth: 2,
borderColor: isDark
  ? "rgba(47,111,78,0.5)"
  : "rgba(47,111,78,0.35)",
backgroundColor: isDark
  ? "rgba(21,24,27,0.75)"
  : "rgba(255,255,255,0.75)",
    borderRadius: 16,
  paddingHorizontal: 12,
  paddingVertical: 10,
  maxWidth: 240,
  ...shadow,
},
    pandaText: { fontSize: 12, color: COLORS.text, fontFamily: FONTS.strong },
    pandaTextSub: { marginTop: 3, fontSize: 11, color: COLORS.sub, fontFamily: FONTS.body },
  });
}

function PandaToast({ styles }: { styles: any }) {
  const x = useRef(new Animated.Value(84)).current;
  const bubbleOpacity = useRef(new Animated.Value(0)).current;

  const line = useMemo(() => {
    const lines = [
      { title: "Підкажу за секунду", sub: "Введи матеріал або предмет" },
      { title: "Якщо не впевнена — питай", sub: "AI допоможе з підказкою" },
      { title: "Сканер теж працює", sub: "Штрихкод → швидка порада" },
    ];
    const seed = hashToInt(todayKey());
    return lines[seed % lines.length];
  }, []);

  useEffect(() => {
    x.setValue(84);
    bubbleOpacity.setValue(0);

    const anim = Animated.sequence([
      Animated.delay(650),
      Animated.parallel([
        Animated.timing(bubbleOpacity, { toValue: 1, duration: 260, useNativeDriver: true }),
        Animated.timing(x, { toValue: 0, duration: 520, useNativeDriver: true }),
      ]),
      Animated.delay(5200),
      Animated.parallel([
        Animated.timing(bubbleOpacity, { toValue: 0, duration: 240, useNativeDriver: true }),
        Animated.timing(x, { toValue: 84, duration: 620, useNativeDriver: true }),
      ]),
    ]);

    anim.start();
    return () => {
      x.stopAnimation();
      bubbleOpacity.stopAnimation();
    };
  }, [x, bubbleOpacity]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.pandaWrap,
        {
          transform: [{ translateX: x }],
        },
      ]}
    >
      <Text style={styles.pandaEmoji}>🐼</Text>

      <Animated.View style={[styles.pandaBubble, { opacity: bubbleOpacity }]}>
        <Text style={styles.pandaText}>{line.title}</Text>
        <Text style={styles.pandaTextSub}>{line.sub}</Text>
      </Animated.View>
    </Animated.View>
  );
}

type Suggestion = { type: "cat" | "hist" | "ai"; title: string; id?: WasteCategoryId; q?: string };

export default function SortScreen() {
  const nav = useNavigation<Nav>();
  const { colors, isDark } = useAppTheme() as any;

  const PAL = useMemo(() => makePal(colors, !!isDark), [colors, isDark]);
  const styles = useMemo(() => createStyles(PAL, !!isDark), [PAL, isDark]);

  const heroScale = usePressScale(0.992);

  const [q, setQ] = useState("");
  const [history, setHistory] = useState<SortHistoryItem[]>([]);

  useEffect(() => {
    loadSortHistory().then(setHistory);
  }, []);

  const suggestions = useMemo(() => {
    const query = q.trim();
    const list: Suggestion[] = [];

    if (query.length > 0) {
      const cat = guessCategory(query);
      if (cat) list.push({ type: "cat", title: `Відкрити: ${cat.title}`, id: cat.id });

      const catMatches = QUICK
        .map((x) => ({ x, s: Math.max(scoreMatch(query, x.title), ...x.keywords.map((k) => scoreMatch(query, k))) }))
        .filter((z) => z.s > 0)
        .sort((a, b) => b.s - a.s)
        .slice(0, 5)
        .map((z) => ({ type: "cat" as const, title: z.x.title, id: z.x.id }));

      for (const m of catMatches) {
        if (!list.some((y) => y.type === "cat" && y.id === m.id)) list.push(m);
      }

      const histMatches = history
        .map((h) => ({ h, s: scoreMatch(query, h.q) }))
        .filter((z) => z.s > 0)
        .sort((a, b) => b.s - a.s)
        .slice(0, 6)
        .map((z) => ({ type: "hist" as const, title: z.h.q, q: z.h.q }));

      for (const m of histMatches) list.push(m);

      const hasAnyUseful = list.some((x) => x.type === "cat" || x.type === "hist");
      if (!hasAnyUseful) list.push({ type: "ai", title: `Запитай AI: ${query}`, q: query });
    } else {
      const top = history.slice(0, 8).map((h) => ({ type: "hist" as const, title: h.q, q: h.q }));
      for (const t of top) list.push(t);
    }

    return list.slice(0, 12);
  }, [q, history]);

 const submit = async (text?: string) => {
  const query = (text ?? q).trim();
  if (!query) return;
  Keyboard.dismiss();

  await addToSortHistory(query);
  setHistory(await loadSortHistory());

  const local = resolveLocalSorting(query);

  if (local.kind === "hit" && local.confidence >= 0.8) {
    nav.navigate("Category", { id: local.categoryId, title: local.title });
    return;
  }

  nav.navigate("Assistant", { initialQuery: query });
};

  const openSuggestion = (s: Suggestion) => {
    if (s.type === "cat" && s.id) {
      const item = QUICK.find((x) => x.id === s.id);
      nav.navigate("Category", { id: s.id, title: item?.title ?? "Деталі" });
      return;
    }
    if (s.type === "ai") {
      nav.navigate("Assistant", { initialQuery: s.q ?? q.trim() });
      return;
    }
    submit(s.q ?? s.title);
  };

  const wipeHistory = async () => {
    await clearSortHistory();
    setHistory([]);
  };

  const header = (
    <View>
      <Animated.View style={[styles.hero, { transform: heroScale.transform }]}>
        <LinearGradient
          colors={isDark ? ["#14241B", "#111315"] : ["#F6F9F6", "#FFFFFF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Pressable
          onPressIn={heroScale.onPressIn}
          onPressOut={heroScale.onPressOut}
          onPress={() => Keyboard.dismiss()}
          style={styles.heroInner}
        >
          <View style={styles.heroTopRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>EcoLife • Sort</Text>
            </View>
            <View style={styles.softDot} />
          </View>

          <Text style={styles.heroTitle}>Як утилізувати?</Text>
          <Text style={styles.heroSub}>Напиши матеріал або предмет — покажемо, куди це викидати. Якщо не знайдемо — запропонуємо AI.</Text>

          <View style={styles.searchWrap}>
            <Text style={styles.inputLabel}>Пошук за матеріалом/предметом</Text>
            <View style={styles.inputRow}>
              <TextInput
                value={q}
                onChangeText={setQ}
                placeholder="Напр.: скло, батарейки"
                placeholderTextColor={PAL.placeholder}
                style={styles.input}
                returnKeyType="search"
                onSubmitEditing={() => submit()}
              />
              <Pressable style={({ pressed }) => [styles.goBtn, { opacity: pressed ? 0.85 : 1 }]} onPress={() => submit()}>
                <Text style={styles.goTxt}>Знайти</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.actions}>
            <Pressable style={({ pressed }) => [styles.actionBtn, { opacity: pressed ? 0.85 : 1 }]} onPress={() => nav.navigate("Scan")}>
              <View style={styles.actionTitleRow}>
                <Text style={styles.actionTitle}>Скануй</Text>
                <Text style={styles.actionEmoji}>📷</Text>
              </View>
              <Text style={styles.actionSub}>Штрихкод → підказка</Text>
            </Pressable>

            <Pressable style={({ pressed }) => [styles.actionBtn, { opacity: pressed ? 0.85 : 1 }]} onPress={() => nav.navigate("Assistant")}>
              <View style={styles.actionTitleRow}>
                <Text style={styles.actionTitle}>Запитай</Text>
                <Text style={styles.actionEmoji}>🧠</Text>
              </View>
              <Text style={styles.actionSub}>Відповідь від AI</Text>
            </Pressable>
          </View>
        </Pressable>
      </Animated.View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{q.trim() ? "Підказки" : "Історія"}</Text>
        <Pressable onPress={wipeHistory} hitSlop={10} style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}>
          <Text style={styles.clear}>Очистити</Text>
        </Pressable>
      </View>
    </View>
  );

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

      <PandaToast styles={styles} />

      <FlatList
        data={suggestions}
        keyExtractor={(item, idx) => `${item.type}:${item.title}:${idx}`}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={header}
        renderItem={({ item }) => (
          <Pressable style={({ pressed }) => [styles.row, { opacity: pressed ? 0.9 : 1 }]} onPress={() => openSuggestion(item)}>
            <View style={styles.rowInner}>
              <View style={styles.rowTop}>
                <Text style={styles.rowTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.rowMeta}>{item.type === "cat" ? "Категорія" : item.type === "ai" ? "AI" : "Запит"}</Text>
              </View>

              <View style={styles.rowPill}>
                <Text style={styles.rowPillText}>
                  {item.type === "cat" ? "Відкрити інструкцію" : item.type === "ai" ? "Написати AI" : "Повторити пошук"}
                </Text>
              </View>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Поки що порожньо</Text>
            <Text style={styles.emptyText}>Введи матеріал/предмет або скористайся сканером — і тут з’являться підказки.</Text>
          </View>
        }
      />
    </View>
  );
}