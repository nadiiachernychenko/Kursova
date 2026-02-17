import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  ScrollView,
  Platform,
  Modal,
  Image,
  TextInput,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useAppTheme } from "../lib/theme";
import { ensureAuth } from "../lib/auth";
import { kyivDayKey, uploadProof, upsertEcoDay } from "../lib/ecoStats";
import type { HomeStackParamList } from "../navigation/HomeStack";

type Tip = { title: string; text: string; emoji: string };
type PandaLine = { title: string; sub: string };

const TIPS: Tip[] = [
  { emoji: "♻️", title: "Сортуй по-розумному", text: "Спочатку промий упаковку — так вона точно піде в переробку." },
  { emoji: "🧴", title: "Пластик без сюрпризів", text: "Кришечки та етикетки часто з іншого пластику — знімай, якщо можеш." },
  { emoji: "📦", title: "Картон любить сухість", text: "Мокрий картон — гірше переробляється. Зберігай сухим." },
  { emoji: "🌿", title: "Еко-дія дня", text: "Заміни один пакет на шопер — це простий win." },
  { emoji: "🚰", title: "Вода теж ресурс", text: "Закривай кран під час чистки зубів — дрібниця, а економія велика." },
  { emoji: "🧠", title: "Мінімалізм = екологія", text: "Купуй менше, але якісніше — це найсильніша еко-звичка." },
];

const PANDA_LINES: PandaLine[] = [
  { title: "Ку-ку! Ти молодчина", sub: "Дякую, що дбаєш про довкілля" },
  { title: "Еко-герой дня", sub: "Маленькі кроки = великий вплив" },
  { title: "Псс… ти топ", sub: "Сьогодні зроби 1 еко-дію — і готово" },
];

const SMALL_STEPS = [
  { key: "plastic", title: "Зсортувати пластик", sub: "Відклади пластик окремо та промий 1 упаковку" },
  { key: "energy", title: "Зекономити електроенергію", sub: "Вимкни світло/зарядки, коли не потрібно" },
  { key: "bag", title: "Взяти багаторазову торбу", sub: "Поклади шопер біля виходу, щоб не забути" },
] as const;

const STORAGE_KEYS = {
  tipDay: "home_tip_day",
  tipIndex: "home_tip_index",
  stepDoneDay: "home_step_done_day",
  stepProofPhoto: "home_step_proof_photo",
  stepTitle: "home_step_title",
  stepKey: "home_step_key",
  stepNote: "home_step_note",
};

function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function yesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function hashToInt(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0);
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Доброго ранку";
  if (h < 18) return "Добрий день";
  return "Добрий вечір";
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

async function pickImageUri(): Promise<string | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (perm.status !== "granted") return null;

  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"] as any,
    quality: 0.9,
    allowsEditing: false,
  });

  if (res.canceled) return null;
  return res.assets?.[0]?.uri ?? null;
}

function PandaToast({ styles }: { styles: any }) {
  const x = useRef(new Animated.Value(84)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const line = useMemo(() => {
    const seed = hashToInt(todayKey());
    return PANDA_LINES[seed % PANDA_LINES.length];
  }, []);

  useEffect(() => {
    Animated.sequence([
      Animated.delay(700),
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 320, useNativeDriver: true }),
        Animated.timing(x, { toValue: 0, duration: 620, useNativeDriver: true }),
      ]),
      Animated.delay(6000),
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 650, useNativeDriver: true }),
        Animated.timing(x, { toValue: 84, duration: 900, useNativeDriver: true }),
      ]),
    ]).start();
  }, [x, opacity]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.pandaWrap,
        {
          opacity,
          transform: [{ translateX: x }],
        },
      ]}
    >
      <Text style={styles.pandaEmoji}>🐼</Text>
      <View style={styles.pandaBubble}>
        <Text style={styles.pandaText}>{line.title}</Text>
        <Text style={styles.pandaTextSub}>{line.sub}</Text>
      </View>
    </Animated.View>
  );
}

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
    root: { flex: 1, backgroundColor: COLORS.bg },
    screen: { flex: 1, backgroundColor: COLORS.bg },
    content: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 18 },

    hero: {
      borderRadius: 22,
      borderWidth: 1,
      borderColor: COLORS.line,
      backgroundColor: COLORS.card,
      ...shadow,
      overflow: "hidden",
    },
    heroInner: { padding: 14 },
    heroTopRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10,
    },
    badge: {
      backgroundColor: COLORS.accentSoft,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    badgeText: { color: COLORS.accent, fontWeight: "900", fontSize: 12 },
    softDot: { width: 10, height: 10, borderRadius: 999, backgroundColor: COLORS.teal, opacity: 0.55 },

    greeting: { fontSize: 14, fontWeight: "900", color: COLORS.text, opacity: 0.85 },
    heroTitle: { marginTop: 6, fontSize: 20, fontWeight: "900", color: COLORS.text },
    heroSub: { marginTop: 8, fontSize: 13, color: COLORS.sub, lineHeight: 18, fontWeight: "700" },

    heroCtaRow: { flexDirection: "row", gap: 10, marginTop: 14 },
    primaryBtn: {
      flex: 1,
      backgroundColor: COLORS.accentSoft,
      borderWidth: 1,
      borderColor: isDark ? "rgba(47,111,78,0.28)" : "rgba(47,111,78,0.20)",
      borderRadius: 14,
      paddingVertical: 12,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 14,
    },
    primaryBtnText: { color: COLORS.accent, fontWeight: "900", fontSize: 13 },

    secondaryBtn: {
      backgroundColor: COLORS.card,
      borderWidth: 1,
      borderColor: COLORS.line,
      borderRadius: 14,
      paddingVertical: 12,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 14,
    },
    secondaryBtnText: { color: COLORS.text, fontWeight: "900", fontSize: 13 },

    sectionHeader: {
      marginTop: 16,
      marginBottom: 10,
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
    },
    sectionTitle: { fontSize: 14, fontWeight: "900", color: COLORS.text },
    sectionHint: { fontSize: 12, color: COLORS.sub, fontWeight: "800" },

    stepCard: {
      borderRadius: 22,
      borderWidth: 1,
      borderColor: COLORS.line,
      backgroundColor: COLORS.card,
      padding: 14,
      ...shadow,
    },
    stepTitle: { fontSize: 14, fontWeight: "900", color: COLORS.text },
    stepSub: { marginTop: 6, fontSize: 12, fontWeight: "800", color: COLORS.sub, lineHeight: 16 },
    stepGrid: { marginTop: 12, gap: 10 },
    stepOption: {
      borderWidth: 1,
      borderColor: isDark ? "rgba(47,111,78,0.22)" : "rgba(47,111,78,0.16)",
      backgroundColor: COLORS.accentSoft,
      borderRadius: 18,
      padding: 12,
    },
    stepOptionTitle: { fontSize: 13, fontWeight: "900", color: COLORS.accent },
    stepOptionSub: { marginTop: 6, fontSize: 12, fontWeight: "800", color: COLORS.sub, lineHeight: 16 },
    stepToast: { marginTop: 10, fontSize: 12, fontWeight: "900", color: COLORS.accent, textAlign: "center" },

    card: { borderRadius: 22, borderWidth: 1, borderColor: COLORS.line, backgroundColor: COLORS.card, ...shadow },
    cardTop: { flexDirection: "row", gap: 10, padding: 14 },
    cardEmoji: { fontSize: 20 },
    cardTitle: { fontSize: 14, fontWeight: "900", color: COLORS.text },
    cardText: { marginTop: 6, fontSize: 13, color: COLORS.sub, lineHeight: 18, fontWeight: "700" },
    cardFooter: { paddingHorizontal: 14, paddingBottom: 14 },
    pill: { alignSelf: "flex-start", backgroundColor: COLORS.accentSoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
    pillText: { color: COLORS.accent, fontWeight: "900", fontSize: 12 },

    modalBackdrop: { flex: 1, backgroundColor: isDark ? "rgba(0,0,0,0.65)" : "rgba(0,0,0,0.25)", padding: 14, justifyContent: "center" },
    modalCard: { backgroundColor: COLORS.card, borderRadius: 22, borderWidth: 1, borderColor: COLORS.line, padding: 14, ...shadow },
    modalTitle: { fontSize: 16, fontWeight: "900", color: COLORS.text, marginBottom: 8 },
    modalText: { fontSize: 13, color: COLORS.sub, lineHeight: 18, fontWeight: "700" },
    modalClose: { alignSelf: "flex-end", marginTop: 12, borderWidth: 1, borderColor: COLORS.line, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: COLORS.card },
    modalCloseText: { fontSize: 12, fontWeight: "900", color: COLORS.text },

    stepModalRow: { marginTop: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
    stepConfirmBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 16,
      backgroundColor: COLORS.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    stepConfirmBtnText: { color: "#fff", fontWeight: "900", fontSize: 12 },
    stepNoteInput: {
      borderWidth: 1,
      borderColor: COLORS.line,
      backgroundColor: isDark ? "rgba(242,243,244,0.06)" : "rgba(17,18,20,0.02)",
      borderRadius: 16,
      padding: 10,
      minHeight: 44,
      fontSize: 13,
      fontWeight: "800",
      color: COLORS.text,
      lineHeight: 18,
    },

    smallBtn: {
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: isDark ? "rgba(47,111,78,0.28)" : "rgba(47,111,78,0.20)",
      backgroundColor: COLORS.accentSoft,
      alignItems: "center",
      justifyContent: "center",
    },
    smallBtnText: { color: COLORS.accent, fontWeight: "900", fontSize: 12 },

    proofThumbWrap: { position: "relative" },
    proofThumb: {
      width: 54,
      height: 54,
      borderRadius: 14,
      backgroundColor: isDark ? "rgba(242,243,244,0.10)" : "rgba(0,0,0,0.06)",
    },
    proofX: {
      position: "absolute",
      right: -6,
      top: -6,
      width: 22,
      height: 22,
      borderRadius: 999,
      backgroundColor: COLORS.text,
      alignItems: "center",
      justifyContent: "center",
    },
    proofXText: { color: COLORS.card, fontWeight: "900", fontSize: 12 },

    pandaWrap: { position: "absolute", right: -6, top: 78, zIndex: 999, alignItems: "flex-end" },
    pandaEmoji: { fontSize: 56 },
    pandaBubble: {
      marginTop: -6,
      marginRight: 10,
      borderWidth: 1,
      borderColor: COLORS.line,
      backgroundColor: COLORS.card,
      borderRadius: 14,
      paddingHorizontal: 10,
      paddingVertical: 8,
      maxWidth: 240,
      ...shadow,
    },
    pandaText: { fontSize: 12, fontWeight: "900", color: COLORS.text },
    pandaTextSub: { marginTop: 3, fontSize: 11, fontWeight: "800", color: COLORS.sub },
  });
}

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const greeting = useMemo(() => getGreeting(), []);
  const { colors, isDark } = useAppTheme() as any;

  const PAL = useMemo(() => makePal(colors, !!isDark), [colors, isDark]);
  const styles = useMemo(() => createStyles(PAL, !!isDark), [PAL, isDark]);

  const heroScale = usePressScale(0.992);
  const cardScale = usePressScale(0.988);

  const [tipIndex, setTipIndex] = useState(0);

  const [stepOpen, setStepOpen] = useState(false);
const [stepKey, setStepKey] = useState<(typeof SMALL_STEPS)[number]["key"]>(SMALL_STEPS[0].key);const [stepTitle, setStepTitle] = useState<string>(SMALL_STEPS[0].title);  const [stepNote, setStepNote] = useState("");
  const [stepDone, setStepDone] = useState(false);
  const [stepProofUri, setStepProofUri] = useState<string | null>(null);
  const stepProofUriRef = useRef<string | null>(null);
  const [stepToast, setStepToast] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        await ensureAuth();
      } catch (e) {}

      const tKey = todayKey();
      const yKey = yesterdayKey();

      const savedTipDay = await AsyncStorage.getItem(STORAGE_KEYS.tipDay);
      const savedTipIndex = await AsyncStorage.getItem(STORAGE_KEYS.tipIndex);

      if (savedTipDay === tKey && savedTipIndex != null) {
        setTipIndex(parseInt(savedTipIndex, 10) || 0);
      } else {
        const yTipDay = await AsyncStorage.getItem(STORAGE_KEYS.tipDay);
        const yTipIndex = await AsyncStorage.getItem(STORAGE_KEYS.tipIndex);
        const yesterdayTip = yTipDay === yKey && yTipIndex != null ? parseInt(yTipIndex, 10) : null;

        let idx = hashToInt(`tip:${tKey}`) % TIPS.length;
        if (yesterdayTip != null && idx === yesterdayTip) idx = (idx + 1) % TIPS.length;

        setTipIndex(idx);
        await AsyncStorage.setItem(STORAGE_KEYS.tipDay, tKey);
        await AsyncStorage.setItem(STORAGE_KEYS.tipIndex, String(idx));
      }

      const savedStepDoneDay = await AsyncStorage.getItem(STORAGE_KEYS.stepDoneDay);
      setStepDone(savedStepDoneDay === tKey);

      const savedStepProof = await AsyncStorage.getItem(STORAGE_KEYS.stepProofPhoto);
      const stepUri = savedStepProof && savedStepDoneDay === tKey ? savedStepProof : null;
      setStepProofUri(stepUri);
      stepProofUriRef.current = stepUri;

      const savedStepTitle = await AsyncStorage.getItem(STORAGE_KEYS.stepTitle);
      if (savedStepTitle) setStepTitle(savedStepTitle);

      const savedStepKey = await AsyncStorage.getItem(STORAGE_KEYS.stepKey);
      if (savedStepKey) setStepKey(savedStepKey as any);

      const savedStepNote = await AsyncStorage.getItem(STORAGE_KEYS.stepNote);
      if (savedStepNote) setStepNote(savedStepNote);
    })();
  }, []);

  const tip = TIPS[tipIndex];
  const tipPillText = "Ти розумничка! Тільки вперед 💚";

  async function pickStepPhoto() {
    const uri = await pickImageUri();
    if (!uri) return;
    stepProofUriRef.current = uri;
    setStepProofUri(uri);
    await AsyncStorage.setItem(STORAGE_KEYS.stepProofPhoto, uri);
  }

  async function clearStepPhoto() {
    setStepProofUri(null);
    stepProofUriRef.current = null;
    await AsyncStorage.removeItem(STORAGE_KEYS.stepProofPhoto);
  }

  async function openStep(s: (typeof SMALL_STEPS)[number]) {
    setStepKey(s.key);
    setStepTitle(s.title);
    await AsyncStorage.setItem(STORAGE_KEYS.stepKey, s.key);
    await AsyncStorage.setItem(STORAGE_KEYS.stepTitle, s.title);
    setStepOpen(true);
  }

  async function confirmSmallStep() {
    await ensureAuth();

    const day = kyivDayKey();
    const tKey = todayKey();

    let url: string | null = null;
    const latestUri = stepProofUriRef.current || stepProofUri;

    if (latestUri) {
      try {
        url = await uploadProof("eco", latestUri, day);
      } catch (e) {
        url = null;
      }
    }

    try {
      await upsertEcoDay({
        day,
        eco_done: true,
        eco_proof_url: url,
        challenge_done: true,
        challenge_text: `${stepTitle}${stepNote.trim() ? ` — ${stepNote.trim()}` : ""}`,
        challenge_proof_url: url,
      });
    } catch (e) {}

    setStepDone(true);
    await AsyncStorage.setItem(STORAGE_KEYS.stepDoneDay, tKey);
    await AsyncStorage.setItem(STORAGE_KEYS.stepTitle, stepTitle);
    await AsyncStorage.setItem(STORAGE_KEYS.stepKey, stepKey);
    await AsyncStorage.setItem(STORAGE_KEYS.stepNote, stepNote);

    setStepOpen(false);
    setStepToast(true);
    setTimeout(() => setStepToast(false), 1200);
  }

  return (
    <View style={styles.root}>
      <PandaToast styles={styles} />

      <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.hero, { transform: heroScale.transform }]}>
          <Pressable
            onPressIn={heroScale.onPressIn}
            onPressOut={heroScale.onPressOut}
            onPress={() => navigation.navigate("Map" as never)}
            style={styles.heroInner}
          >
            <View style={styles.heroTopRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>EcoLife</Text>
              </View>
              <View style={styles.softDot} />
            </View>

            <Text style={styles.greeting}>{greeting} ✨</Text>
            <Text style={styles.heroTitle}>Еко-звички без напрягу</Text>
            <Text style={styles.heroSub}>Карта пунктів і короткі підказки — щоб робити добро легко.</Text>

            <View style={styles.heroCtaRow}>
              <View style={styles.primaryBtn}>
                <Text style={styles.primaryBtnText}>Відкрити карту</Text>
              </View>

              <Pressable
                onPress={() => navigation.navigate("Sort" as never)}
                style={({ pressed }) => [styles.secondaryBtn, { opacity: pressed ? 0.7 : 1 }]}
              >
                <Text style={styles.secondaryBtnText}>Як сортувати</Text>
              </Pressable>
            </View>
          </Pressable>
        </Animated.View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Маленький крок сьогодні</Text>
          <Text style={styles.sectionHint}>{stepDone ? "✅ зараховано" : ""}</Text>
        </View>

        <View style={styles.stepCard}>
          <Text style={styles.stepTitle}>Давай зробимо маленький крок разом</Text>
          <Text style={styles.stepSub}>Обери один варіант — і збережи в історії (можна з фото)</Text>

          <View style={styles.stepGrid}>
            {SMALL_STEPS.map((s) => (
              <Pressable
                key={s.key}
                onPress={() => openStep(s)}
                style={({ pressed }) => [styles.stepOption, { opacity: pressed ? 0.8 : 1 }]}
              >
                <Text style={styles.stepOptionTitle}>{s.title}</Text>
                <Text style={styles.stepOptionSub}>{s.sub}</Text>
              </Pressable>
            ))}
          </View>

          {stepToast && <Text style={styles.stepToast}>Зараховано ✅</Text>}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Порада дня</Text>
          <Text style={styles.sectionHint}></Text>
        </View>

        <Animated.View style={[styles.card, { transform: cardScale.transform }]}>
          <Pressable onPressIn={cardScale.onPressIn} onPressOut={cardScale.onPressOut}>
            <View style={styles.cardTop}>
              <Text style={styles.cardEmoji}>{tip.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{tip.title}</Text>
                <Text style={styles.cardText}>{tip.text}</Text>
              </View>
            </View>

            <View style={styles.cardFooter}>
              <View style={styles.pill}>
                <Text style={styles.pillText}>{tipPillText}</Text>
              </View>
            </View>
          </Pressable>
        </Animated.View>

        <View style={{ height: 18 }} />
      </ScrollView>

      <Modal visible={stepOpen} transparent animationType="fade" onRequestClose={() => setStepOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setStepOpen(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>{stepTitle}</Text>
            <Text style={styles.modalText}>Додай фото або короткий коментар — і ми збережемо це в історії.</Text>

            <View style={{ marginTop: 12 }}>
              <TextInput
                value={stepNote}
                onChangeText={async (t) => {
                  setStepNote(t);
                  await AsyncStorage.setItem(STORAGE_KEYS.stepNote, t);
                }}
                placeholder="Коментар (опційно)"
                placeholderTextColor={PAL.placeholder}
                style={styles.stepNoteInput}
                multiline
              />
            </View>

            <View style={styles.stepModalRow}>
              {stepProofUri ? (
                <View style={styles.proofThumbWrap}>
                  <Image source={{ uri: stepProofUri }} style={styles.proofThumb} />
                  <Pressable onPress={clearStepPhoto} style={({ pressed }) => [styles.proofX, { opacity: pressed ? 0.7 : 1 }]}>
                    <Text style={styles.proofXText}>✖</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable onPress={pickStepPhoto} style={({ pressed }) => [styles.smallBtn, { opacity: pressed ? 0.75 : 1 }]}>
                  <Text style={styles.smallBtnText}>Додати фото</Text>
                </Pressable>
              )}

              <Pressable onPress={confirmSmallStep} style={({ pressed }) => [styles.stepConfirmBtn, { opacity: pressed ? 0.75 : 1 }]}>
                <Text style={styles.stepConfirmBtnText}>Зарахувати</Text>
              </Pressable>
            </View>

            <Pressable style={styles.modalClose} onPress={() => setStepOpen(false)}>
              <Text style={styles.modalCloseText}>Закрити</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}