import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Keyboard,
  Platform,
  Animated,
  Image,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { SortStackParamList } from "../navigation/SortStack";
import { askEcoAssistant } from "../lib/ecoAssistant";
import { addToSortHistory } from "../lib/sortHistory";
import { LinearGradient } from "expo-linear-gradient";
import { useAppTheme } from "../lib/theme";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { WasteCategoryId } from "../data/sorting";
type R = RouteProp<SortStackParamList, "Assistant">;
type Nav = NativeStackNavigationProp<SortStackParamList, "Assistant">;
function stripMdLike(text: string) {
  return String(text || "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/#{1,6}\s?/g, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .trim();
}

const HINT_CHIPS = [
  "Косметика",
  "Побутова хімія",
  "Їжа/напої",
  "Пластикова упаковка",
  "Скло",
  "Метал",
  "Папір/картон",
  "Електроніка",
  "Батарейки",
  "Інше",
];
const ALLOWED_CATS: WasteCategoryId[] = ["paper", "plastic", "glass", "metal", "organic", "hazard"];

function normalizeCatId(v: any): WasteCategoryId | null {
  const s = typeof v === "string" ? v.trim().toLowerCase() : "";
  return (ALLOWED_CATS as string[]).includes(s) ? (s as WasteCategoryId) : null;
}
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

function PandaToast({ styles }: { styles: any }) {
  const x = useRef(new Animated.Value(84)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const line = useMemo(() => {
    const lines = [
      { title: "Пишеш — я підкажу", sub: "Коротко і по суті" },
      { title: "Штрихкод — теж ок", sub: "Якщо не знайду — уточнимо" },
      { title: "Питай сміливо", sub: "Зробимо підказку точнішою" },
    ];
    const seed = hashToInt(todayKey());
    return lines[seed % lines.length];
  }, []);

  useEffect(() => {
    Animated.sequence([
      Animated.delay(650),
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 320, useNativeDriver: true }),
        Animated.timing(x, { toValue: 0, duration: 620, useNativeDriver: true }),
      ]),
      Animated.delay(5200),
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 650, useNativeDriver: true }),
        Animated.timing(x, { toValue: 84, duration: 900, useNativeDriver: true }),
      ]),
    ]).start();
  }, [x, opacity]);

  return (
    <Animated.View pointerEvents="none" style={[styles.pandaWrap, { opacity, transform: [{ translateX: x }] }]}>
      <Text style={styles.pandaEmoji}>🐼</Text>
      <View style={styles.pandaBubble}>
        <Text style={styles.pandaText}>{line.title}</Text>
        <Text style={styles.pandaTextSub}>{line.sub}</Text>
      </View>
    </Animated.View>
  );
}

function createStyles(COLORS: Pal, isDark: boolean) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: "transparent" },
    bg: { ...StyleSheet.absoluteFillObject },
    texture: { ...StyleSheet.absoluteFillObject, opacity: isDark ? 0.06 : 0.08, transform: [{ scale: 1.15 }] },
    veil: { ...StyleSheet.absoluteFillObject, backgroundColor: isDark ? "rgba(0,0,0,0.10)" : "rgba(255,255,255,0.18)" },

    content: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 18 },

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

    badgeRow: { marginTop: 10, flexDirection: "row" },
    barcodeBadge: {
      backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.03)",
      borderRadius: 999,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)",
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    barcodeTxt: { color: COLORS.text, fontFamily: FONTS.strong, fontSize: 12, opacity: 0.9 },

    box: {
      marginTop: 12,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.06)",
      backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.03)",
      padding: 12,
      gap: 10,
    },
    input: {
      minHeight: 88,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)",
      backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.72)",
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 12,
      fontSize: 13,
      color: COLORS.text,
      lineHeight: 18,
      fontFamily: FONTS.body,
    },

    btn: {
      borderRadius: 16,
      paddingVertical: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: COLORS.accent,
    },
    btnTxt: { color: "#fff", fontSize: 12, fontFamily: FONTS.strong },

    productCard: {
      marginTop: 12,
      borderRadius: 22,
backgroundColor: isDark
  ? "rgba(20,36,27,0.9)"
  : "#FFFFFF",
        borderWidth: 1,
      borderColor: COLORS.line,
      overflow: "hidden",
      ...shadow,
    },
    productTop: { padding: 14, flexDirection: "row", gap: 10, alignItems: "flex-start" },
    productEmoji: { fontSize: 18, opacity: 0.9 },
    productTitle: { color: COLORS.text, fontFamily: FONTS.title2, fontSize: 14 },
    productText: { marginTop: 6, color: COLORS.sub, fontFamily: FONTS.body, fontSize: 13, lineHeight: 18 },
    pill: { marginTop: 10, alignSelf: "flex-start", backgroundColor: COLORS.accentSoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
    pillText: { color: COLORS.accent, fontSize: 12, fontFamily: FONTS.strong },

    card: {
      marginTop: 12,
      borderRadius: 22,
backgroundColor: isDark
  ? "rgba(20,36,27,0.9)"
  : "#FFFFFF",
        borderWidth: 1,
      borderColor: COLORS.line,
      overflow: "hidden",
      ...shadow,
    },
    cardInner: { padding: 14, gap: 8 },
    cardTitle: { color: COLORS.text, fontFamily: FONTS.title2, fontSize: 14 },
    cardText: { color: COLORS.sub, fontFamily: FONTS.body, fontSize: 13, lineHeight: 18 },

    dangerCard: {
      marginTop: 12,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: isDark ? "rgba(185,28,28,0.35)" : "rgba(185,28,28,0.25)",
      backgroundColor: COLORS.dangerSoft,
      overflow: "hidden",
      ...shadow,
    },
    dangerTitle: { color: isDark ? "rgba(255,255,255,0.92)" : "#7F1D1D", fontFamily: FONTS.title2, fontSize: 14 },
    dangerText: { color: isDark ? "rgba(255,255,255,0.80)" : "rgba(127,29,29,0.82)", fontFamily: FONTS.body, fontSize: 13, lineHeight: 18 },

    hintCard: {
      marginTop: 12,
      borderRadius: 22,
      backgroundColor: isDark ? "rgba(21,24,27,0.72)" : "rgba(255,255,255,0.82)",
      borderWidth: 1,
      borderColor: COLORS.line,
      overflow: "hidden",
      ...shadow,
    },
    hintInner: { padding: 14, gap: 10 },
    hintTitle: { color: COLORS.text, fontFamily: FONTS.title2, fontSize: 14 },
    hintSub: { color: COLORS.sub, fontFamily: FONTS.body, fontSize: 13, lineHeight: 18 },

    chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: {
      backgroundColor: COLORS.accentSoft,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.06)",
      paddingVertical: 8,
      paddingHorizontal: 10,
    },
    chipTxt: { color: COLORS.accent, fontFamily: FONTS.strong, fontSize: 12 },

    hintInput: {
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)",
      backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.72)",
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 12,
      fontSize: 13,
      color: COLORS.text,
      lineHeight: 18,
      fontFamily: FONTS.body,
    },

    btn2: {
      borderRadius: 16,
      paddingVertical: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: COLORS.card,
      borderWidth: 1,
      borderColor: COLORS.line,
    },
    btn2Txt: { color: COLORS.text, fontSize: 12, fontFamily: FONTS.strong },

    center: { marginTop: 12, gap: 8, alignItems: "center", paddingVertical: 14 },
    muted: { color: COLORS.sub, fontFamily: FONTS.body },

    pandaWrap: { position: "absolute", right: -6, top: 86, zIndex: 999, alignItems: "flex-end" },
    pandaEmoji: { fontSize: 56 },
   pandaBubble: {
  marginTop: -6,
  marginRight: 10,

  borderWidth: 1,
  borderColor: isDark ? "rgba(47,111,78,0.55)" : "rgba(47,111,78,0.28)",

  backgroundColor: isDark ? "rgba(20,36,27,0.88)" : "rgba(255,255,255,0.92)",

  borderRadius: 14,
  paddingHorizontal: 10,
  paddingVertical: 8,
  maxWidth: 240,
  ...shadow,
},
    pandaText: { fontSize: 12, color: COLORS.text, fontFamily: FONTS.strong },
    pandaTextSub: { marginTop: 3, fontSize: 11, color: COLORS.sub, fontFamily: FONTS.body },
  });
}

export default function SortAssistantScreen() {
  const route = useRoute<R>();
  const nav = useNavigation<Nav>();

  const { colors, isDark } = useAppTheme() as any;

  const PAL = useMemo(() => makePal(colors, !!isDark), [colors, isDark]);
  const styles = useMemo(() => createStyles(PAL, !!isDark), [PAL, isDark]);

  const heroScale = usePressScale(0.992);

  const [q, setQ] = useState(route.params?.initialQuery ?? "");
  const [barcode, setBarcode] = useState<string | undefined>((route.params as any)?.barcode);

  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
const [catId, setCatId] = useState<WasteCategoryId | null>(null);
const [catConf, setCatConf] = useState<number | null>(null);
const [followUp, setFollowUp] = useState<string | null>(null);
  const [resolved, setResolved] = useState<boolean | null>(null);
  const [productLine, setProductLine] = useState<string | null>(null);

  const [hint, setHint] = useState("");
  const [showHintBlock, setShowHintBlock] = useState(false);

  const title = useMemo(() => (barcode ? "Результат сканування" : "Запитай про сортування"), [barcode]);

  useEffect(() => {
    if (route.params?.initialQuery != null) setQ(route.params.initialQuery ?? "");
    const b = (route.params as any)?.barcode;
    if (b) setBarcode(b);
  }, [route.params]);

  const call = async (opts?: { hint?: string }) => {
    const query = q.trim();
    const h = (opts?.hint ?? hint).trim();

    if (!query && !barcode) {
      setErr("Введи запит або відскануй штрихкод.");
      return;
    }

    Keyboard.dismiss();
    setLoading(true);
    setErr(null);

    try {
      if (query) await addToSortHistory(query);

      const res = await askEcoAssistant({
  query: query || undefined,
  barcode: barcode || undefined,
  hint: h || undefined,
  wantStructured: true,
});
setCatId(normalizeCatId((res as any)?.categoryId));
const confRaw = (res as any)?.confidence;
const conf = typeof confRaw === "number" ? confRaw : Number(confRaw);
setCatConf(Number.isFinite(conf) ? conf : null);

setFollowUp((res as any)?.followUp ?? null);
      const prod = res?.product;
      const isResolved = !!res?.resolved;
      setResolved(isResolved);

      if (prod && (prod.title || prod.brand)) {
        const parts = [prod.title, prod.brand].filter(Boolean);
        const src = prod.source ? ` · ${prod.source}` : "";
        setProductLine(`${parts.join(" — ")}${src}`);
      } else if (barcode) {
        setProductLine("Не знайдено у базах за цим штрихкодом.");
      } else {
        setProductLine(null);
      }

      setAnswer(stripMdLike(res?.answer ?? ""));
      setShowHintBlock(!!barcode && !isResolved);
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {
    setAnswer(null);
    setResolved(null);
    setProductLine(null);
    setShowHintBlock(false);
    setCatId(null);
    setCatConf(null);
    setFollowUp(null);
    await call();
  };

  const submitHint = async () => {
    setCatId(null);
setCatConf(null);
setFollowUp(null);
    await call({ hint });
  };

  const pickChip = (v: string) => {
    setHint((prev) => (prev ? `${prev}, ${v}` : v));
  };

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

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.hero, { transform: heroScale.transform }]}>
          <LinearGradient
            colors={isDark ? ["#14241B", "#111315"] : ["#F6F9F6", "#FFFFFF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Pressable onPressIn={heroScale.onPressIn} onPressOut={heroScale.onPressOut} onPress={() => Keyboard.dismiss()} style={styles.heroInner}>
            <View style={styles.heroTopRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>EcoLife • Assistant</Text>
              </View>
              <View style={styles.softDot} />
            </View>

            <Text style={styles.heroTitle}>{title}</Text>
            <Text style={styles.heroSub}>Коротко і практично: куди та як викидати в Україні</Text>

            {!!barcode && (
              <View style={styles.badgeRow}>
                <View style={styles.barcodeBadge}>
                  <Text style={styles.barcodeTxt}>Штрихкод: {barcode}</Text>
                </View>
              </View>
            )}

            <View style={styles.box}>
              <TextInput
                value={q}
                onChangeText={setQ}
                placeholder={barcode ? "Можеш додати питання (необовʼязково)" : "Наприклад: куди викидати батарейки?"}
                placeholderTextColor={PAL.placeholder}
                style={styles.input}
                multiline
              />
              <Pressable style={({ pressed }) => [styles.btn, { opacity: pressed ? 0.85 : 1 }]} onPress={submit} disabled={loading}>
                <Text style={styles.btnTxt}>{loading ? "..." : "Надіслати"}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Animated.View>

        {!!productLine && (
          <View style={styles.productCard}>
            <View style={styles.productTop}>
              <Text style={styles.productEmoji}>🏷️</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.productTitle}>По штрихкоду</Text>
                <Text style={styles.productText}>{productLine}</Text>
                <View style={styles.pill}>
                  <Text style={styles.pillText}>{resolved ? "Знайдено інфо ✅" : "Потрібне уточнення"}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {loading && (
          <View style={styles.center}>
            <ActivityIndicator />
            <Text style={styles.muted}>Думаю…</Text>
          </View>
        )}

        {!!err && (
          <View style={styles.dangerCard}>
            <View style={styles.cardInner}>
              <Text style={styles.dangerTitle}>Помилка</Text>
              <Text style={styles.dangerText}>{err}</Text>
            </View>
          </View>
        )}

        {!!answer && (
          <View style={styles.card}>
            <View style={styles.cardInner}>
              <Text style={styles.cardTitle}>Відповідь</Text>
              <Text style={styles.cardText}>{answer}</Text>
            </View>
          </View>
        )}
{!!followUp && (
  <View style={styles.card}>
    <View style={styles.cardInner}>
      <Text style={styles.cardTitle}>Уточнення</Text>
      <Text style={styles.cardText}>{followUp}</Text>
    </View>
  </View>
)}

{!!catId && (catConf ?? 0) >= 0.75 && (
  <Pressable
    style={({ pressed }) => [styles.btn2, { opacity: pressed ? 0.85 : 1 }]}
onPress={() => nav.navigate("Category", { id: catId, title: "Деталі" })}  >
    <Text style={styles.btn2Txt}>Відкрити категорію</Text>
  </Pressable>
)}
        {showHintBlock && (
          <View style={styles.hintCard}>
            <View style={styles.hintInner}>
              <Text style={styles.hintTitle}>Не знайшла товар по коду</Text>
              <Text style={styles.hintSub}>
                Щоб підказка була точною, уточни: що це за предмет або яка упаковка (наприклад: “крем для рук у тюбику з помпою”, “побутова хімія”, “скляна банка”).
              </Text>

              <View style={styles.chips}>
                {HINT_CHIPS.map((c) => (
                  <Pressable key={c} onPress={() => pickChip(c)} style={({ pressed }) => [styles.chip, { opacity: pressed ? 0.85 : 1 }]}>
                    <Text style={styles.chipTxt}>{c}</Text>
                  </Pressable>
                ))}
                
              </View>

              <TextInput
                value={hint}
                onChangeText={setHint}
                placeholder="Уточнення (можна коротко)"
                placeholderTextColor={PAL.placeholder}
                style={styles.hintInput}
              />

              <Pressable style={({ pressed }) => [styles.btn2, { opacity: pressed ? 0.85 : 1 }]} onPress={submitHint} disabled={loading}>
                <Text style={styles.btn2Txt}>{loading ? "..." : "Надіслати уточнення"}</Text>
              </Pressable>
            </View>
          </View>
        )}

        <View style={{ height: 18 }} />
      </ScrollView>
    </View>
  );
}