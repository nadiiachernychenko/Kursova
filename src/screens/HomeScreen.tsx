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
import { BlurView } from "expo-blur";

import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useAppTheme } from "../lib/theme";
import { LinearGradient } from "expo-linear-gradient";
import { ensureAuth } from "../lib/auth";
import { supabase } from "../lib/supabase";
import { kyivDayKey, uploadProof, upsertEcoDay } from "../lib/ecoStats";
import type { HomeStackParamList } from "../navigation/HomeStack";

type Tip = { title: string; text: string; emoji: string };
type PandaLine = { title: string; sub: string };
const FONTS = {
  title: "Nunito_800ExtraBold",
  title2: "Nunito_700Bold",
  body: "Manrope_600SemiBold",
  strong: "Manrope_700Bold",
} as const;

const TIPS: Tip[] = [
  { emoji: "♻️", title: "Сортуй по-розумному", text: "Спочатку промий упаковку — так вона точно піде в переробку." },
  { emoji: "🧴", title: "Пластик без сюрпризів", text: "Кришечки та етикетки часто з іншого пластику — знімай, якщо можеш." },
  { emoji: "📦", title: "Картон любить сухість", text: "Мокрий картон — гірше переробляється. Зберігай сухим." },
  { emoji: "🌿", title: "Еко-дія дня", text: "Заміни один пакет на шопер — це простий win." },
  { emoji: "🚰", title: "Вода теж ресурс", text: "Закривай кран під час чистки зубів — дрібниця, а економія велика." },
  { emoji: "🧠", title: "Мінімалізм = екологія", text: "Купуй менше, але якісніше — це найсильніша еко-звичка." },
];
const LEAVES = require("../../assets/leaves-texture.png");
const PANDA_LINES: PandaLine[] = [
  { title: "Ку-ку! Ти молодчина", sub: "Дякую, що дбаєш про довкілля" },
  { title: "Еко-герой дня", sub: "Маленькі кроки = великий вплив" },
  { title: "Псс… ти топ", sub: "Сьогодні зроби 1 еко-дію — і готово" },
];

const SMALL_STEPS = [
  { key: "plastic", title: "Зсортувати пластик", sub: "Відклади пластик окремо та промий 1 упаковку" },
  { key: "energy", title: "Зекономити електроенергію", sub: "Вимкни світло/зарядки, коли не потрібно" },
  { key: "bag", title: "Взяти багаторазову торбу", sub: "Поклади шопер біля виходу, щоб не забути" },
  { key: "batteries", title: "Здати батарейки", sub: "Збери старі батарейки та знайди пункт прийому" },
  { key: "glass", title: "Здати скло", sub: "Відклади скляну тару окремо" },
  { key: "paper", title: "Зібрати макулатуру", sub: "Збери непотрібний папір для переробки" },
  { key: "metal", title: "Відсортувати метал", sub: "Бляшанки теж можна переробити" },
  { key: "no_bag", title: "Відмовитися від пакета", sub: "Скажи «без пакета», якщо він не потрібен" },
  { key: "own_cup", title: "Використати свою чашку", sub: "Візьми термочашку замість одноразової" },
  { key: "turn_off_water", title: "Закрити кран", sub: "Не залишай воду текти даремно" },
  { key: "eco_transport", title: "Обрати еко-транспорт", sub: "Пройдися пішки або скористайся велосипедом" },
  { key: "second_life", title: "Дати речам друге життя", sub: "Передай непотрібні речі тим, кому вони потрібні" },
  { key: "plant_tree", title: "Посадити рослину", sub: "Навіть маленький вазон має значення" },
  { key: "food_waste", title: "Не викидати їжу", sub: "Спробуй використати залишки в новій страві" },
  { key: "local_food", title: "Обрати локальні продукти", sub: "Місцеве = менше транспортування" },
  { key: "eco_cleaning", title: "Еко-прибирання", sub: "Використай менше хімії або натуральні засоби" },
  { key: "unplug", title: "Вимкнути зарядки", sub: "Не залишай техніку в розетці без потреби" },
  { key: "light_off", title: "Вимкнути світло", sub: "Виходячи з кімнати, вимкни освітлення" },
  { key: "reusable_container", title: "Використати свій контейнер", sub: "Візьми свою тару для покупки їжі" },
  { key: "sort_home", title: "Навести порядок у сортуванні", sub: "Перевір, чи правильно розкладені відходи" },
  { key: "eco_info", title: "Дізнатися нове про екологію", sub: "Прочитай одну статтю про довкілля" },
  { key: "repair", title: "Полагодити замість викинути", sub: "Спробуй відремонтувати річ" },
  { key: "cloth_bag", title: "Взяти тканинну торбу", sub: "Носи шопер із собою" },
  { key: "minimal_packaging", title: "Обрати мінімум упаковки", sub: "Купуй продукти без зайвого пластику" },
  { key: "separate_caps", title: "Зняти кришечки", sub: "Відокремлюй кришки від пляшок" },
  { key: "eco_friend", title: "Поділитися еко-порадою", sub: "Розкажи другові про сортування" },
  { key: "dry_waste", title: "Промити упаковку", sub: "Перед сортуванням очисти її від залишків" },
  { key: "energy_save", title: "Економний режим", sub: "Увімкни енергозберігаючий режим на техніці" },
  { key: "buy_less", title: "Купити менше", sub: "Відмовся від імпульсивної покупки" },
  { key: "eco_market", title: "Сходити на еко-ринок", sub: "Підтримай екологічні ініціативи" },
  { key: "collect_plastic", title: "Зібрати пластик на прогулянці", sub: "Підбери сміття в парку або дворі" },
  { key: "water_bottle", title: "Взяти свою пляшку", sub: "Не купуй одноразову воду" },
] as const;
type SmallStep = (typeof SMALL_STEPS)[number];
const STORAGE_KEYS = {
  tipDay: "home_tip_day",
  tipIndex: "home_tip_index",
  stepDoneDay: "home_step_done_day",
  stepProofPhoto: "home_step_proof_photo",
  stepTitle: "home_step_title",
  stepKey: "home_step_key",
  stepNote: "home_step_note",
  stepBag: "home_step_bag",
  stepShown: "home_step_shown",
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
function shuffle<T>(arr: T[]) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = a[i];
    a[i] = a[j];
    a[j] = t;
  }
  return a;
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
screen: { flex: 1, backgroundColor: "transparent" },
root: { flex: 1, backgroundColor: "transparent" },

    content: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 18 },
heroTexture: {
  ...StyleSheet.absoluteFillObject,
  position: "absolute",
  zIndex: 2,
},
heroGradient: {
  ...StyleSheet.absoluteFillObject,
  position: "absolute",
  zIndex: 1,
},
heroContent: {
  zIndex: 3,
},
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
badgeText: { color: COLORS.accent, fontSize: 12, fontFamily: FONTS.strong },
    softDot: { width: 10, height: 10, borderRadius: 999, backgroundColor: COLORS.teal, opacity: 0.55 },

greeting: { fontSize: 14, color: COLORS.text, opacity: 0.85, fontFamily: FONTS.strong },
heroTitle: { marginTop: 6, fontSize: 20, color: COLORS.text, fontFamily: FONTS.title },
heroSub: { marginTop: 8, fontSize: 13, color: COLORS.sub, lineHeight: 18, fontFamily: FONTS.body },

    heroCtaRow: { flexDirection: "row", gap: 10, marginTop: 14 },
    primaryBtn: {
      flex: 1,
      backgroundColor: COLORS.accentSoft,
      borderWidth: 1,
borderColor: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.06)",
      borderRadius: 14,
      paddingVertical: 12,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 14,
    },
primaryBtnText: { color: COLORS.accent, fontSize: 13, fontFamily: FONTS.strong },

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
secondaryBtnText: { color: COLORS.text, fontSize: 13, fontFamily: "Manrope_700Bold" },

    sectionHeader: {
      marginTop: 16,
      marginBottom: 10,
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
    },
sectionTitle: { fontSize: 14, color: COLORS.text, fontFamily: "Nunito_800ExtraBold" },
sectionHint: { fontSize: 12, color: COLORS.sub, fontFamily: FONTS.body },

    stepCard: {
  borderRadius: 24,
  backgroundColor: isDark ? "rgba(21,24,27,0.72)" : "rgba(255,255,255,0.82)",
  padding: 16,
  marginTop: 2,
},
stepTitle: { fontSize: 14, color: COLORS.text, fontFamily: "Nunito_800ExtraBold" },
stepSub: { marginTop: 6, fontSize: 12, color: COLORS.sub, lineHeight: 16, fontFamily: "Manrope_600SemiBold" },
    stepGrid: { marginTop: 12, gap: 10 },
   stepOption: {
  backgroundColor: isDark ? "rgba(47,111,78,0.18)" : "rgba(47,111,78,0.10)",
  borderRadius: 18,
  padding: 14,
},
stepOptionTitle: { fontSize: 13, color: COLORS.accent, fontFamily: FONTS.strong },
stepOptionSub: { marginTop: 6, fontSize: 12, color: COLORS.sub, lineHeight: 16, fontFamily: FONTS.body },
    stepToast: { marginTop: 10, fontSize: 12, fontWeight: "900", color: COLORS.accent, textAlign: "center" },

card: {
  borderRadius: 24,
  backgroundColor: isDark ? "rgba(21,24,27,0.72)" : "rgba(255,255,255,0.82)",
  overflow: "hidden",
},
    cardTop: { flexDirection: "row", gap: 10, padding: 14 },
    cardEmoji: { fontSize: 20 },
cardTitle: { fontSize: 14, color: COLORS.text, fontFamily: "Nunito_700Bold" },
cardText: { marginTop: 6, fontSize: 13, color: COLORS.sub, lineHeight: 18, fontFamily: "Manrope_600SemiBold" },
    cardFooter: { paddingHorizontal: 14, paddingBottom: 14 },
    pill: { alignSelf: "flex-start", backgroundColor: COLORS.accentSoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
pillText: { color: COLORS.accent, fontSize: 12, fontFamily: FONTS.strong },

modalBackdrop: {
  flex: 1,
  backgroundColor: isDark ? "rgba(0,0,0,0.72)" : "rgba(0,0,0,0.35)",
  padding: 14,
  justifyContent: "center",
},
modalCard: {
  backgroundColor: isDark ? "#14171A" : "#FFFFFF", 
  borderRadius: 22,
  borderWidth: 1,
  borderColor: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)",
  padding: 14,
  ...shadow,
},
modalTitle: { fontSize: 16, color: COLORS.text, marginBottom: 8, fontFamily: FONTS.title },
modalText: { fontSize: 13, color: isDark ? "rgba(242,243,244,0.82)" : "rgba(17,18,20,0.72)", lineHeight: 18, fontFamily: FONTS.body },
    modalClose: { alignSelf: "flex-end", marginTop: 12, borderWidth: 1, borderColor: COLORS.line, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: COLORS.card },
modalCloseText: { fontSize: 12, color: COLORS.text, fontFamily: FONTS.strong },

    stepModalRow: { marginTop: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
    stepConfirmBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 16,
      backgroundColor: COLORS.accent,
      alignItems: "center",
      justifyContent: "center",
    },
stepConfirmBtnText: { color: "#fff", fontSize: 12, fontFamily: FONTS.strong },
    stepNoteInput: {
  borderWidth: 1,
  borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)",
  backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.03)",
  borderRadius: 16,
  padding: 12,
  minHeight: 44,
  fontSize: 13,
  color: COLORS.text,
  lineHeight: 18,
  fontFamily: FONTS.body,
},


    smallBtn: {
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 14,
      borderWidth: 1,
borderColor: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.06)",
      backgroundColor: COLORS.accentSoft,
      alignItems: "center",
      justifyContent: "center",
    },
smallBtnText: { color: COLORS.accent, fontSize: 12, fontFamily: FONTS.strong },

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
proofXText: { color: COLORS.card, fontSize: 12, fontFamily: FONTS.strong },
customStep: {
  marginTop: 10,
  borderWidth: 1,
borderColor: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.06)",
backgroundColor: isDark ? "rgba(21,24,27,0.58)" : "rgba(255,255,255,0.72)",
  borderRadius: 18,
  padding: 12,
},
tipLine: {
  height: 3,
  backgroundColor: isDark ? "rgba(47,111,78,0.55)" : "rgba(47,111,78,0.35)",
},
toastPill: {
  marginTop: 12,
  alignSelf: "center",
  paddingHorizontal: 14,
  paddingVertical: 8,
  borderRadius: 999,
  backgroundColor: isDark ? "rgba(47,111,78,0.22)" : "rgba(47,111,78,0.14)",
},
toastPillText: {
  fontSize: 12,
  fontWeight: "900",
  color: COLORS.accent,
  fontFamily: FONTS.strong 
},
customStepTitle: { fontSize: 13, color: COLORS.text , fontFamily: FONTS.strong},
customStepSub: { marginTop: 6, fontSize: 12, color: COLORS.sub, lineHeight: 16 , fontFamily: FONTS.body},
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
pandaText: { fontSize: 12, color: COLORS.text, fontFamily: FONTS.strong },
pandaTextSub: { marginTop: 3, fontSize: 11, color: COLORS.sub, fontFamily: FONTS.body },
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
const [stepMode, setStepMode] = useState<"preset" | "custom">("preset");
const [customTitle, setCustomTitle] = useState("");
  const [stepOpen, setStepOpen] = useState(false);
const [stepKey, setStepKey] = useState<(typeof SMALL_STEPS)[number]["key"]>(SMALL_STEPS[0].key);const [stepTitle, setStepTitle] = useState<string>(SMALL_STEPS[0].title);  const [stepNote, setStepNote] = useState("");
  const [stepDone, setStepDone] = useState(false);
  const [stepProofUri, setStepProofUri] = useState<string | null>(null);
  const stepProofUriRef = useRef<string | null>(null);
  const [stepToast, setStepToast] = useState(false);
  const toastAnim = useRef(new Animated.Value(0)).current;
const [shownSteps, setShownSteps] = useState<SmallStep[]>([]);
  useEffect(() => {
    (async () => {
      try {
        await ensureAuth();
       const picked = await pickNextSteps(SMALL_STEPS, 3);
setShownSteps(picked);
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
async function getUserId() {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? "anon";
}

async function pickNextSteps(all: readonly SmallStep[], count: number): Promise<SmallStep[]> {  
  const uid = await getUserId();
  const bagKey = `${STORAGE_KEYS.stepBag}:${uid}`;
  const shownKey = `${STORAGE_KEYS.stepShown}:${uid}`;

  const rawBag = await AsyncStorage.getItem(bagKey);
  let bag: number[] = rawBag ? JSON.parse(rawBag) : [];

  if (!Array.isArray(bag) || bag.length < count) {
    bag = shuffle(all.map((_: any, i: number) => i));
  }

  const pickedIdx = bag.slice(0, count);
  const rest = bag.slice(count);

  await AsyncStorage.setItem(bagKey, JSON.stringify(rest));
  await AsyncStorage.setItem(shownKey, JSON.stringify(pickedIdx));

  return pickedIdx.map((i) => all[i]);
}
  async function clearStepPhoto() {
    setStepProofUri(null);
    stepProofUriRef.current = null;
    await AsyncStorage.removeItem(STORAGE_KEYS.stepProofPhoto);
  }

async function openStep(s: SmallStep) {
  setStepMode("preset");
  setCustomTitle("");
  setStepNote("");
  setStepKey(s.key);
  setStepTitle(s.title);

  setStepProofUri(null);
  stepProofUriRef.current = null;

  await AsyncStorage.multiRemove([
    STORAGE_KEYS.stepNote,
    STORAGE_KEYS.stepProofPhoto,
  ]);

  await AsyncStorage.setItem(STORAGE_KEYS.stepKey, s.key);
  await AsyncStorage.setItem(STORAGE_KEYS.stepTitle, s.title);

  setStepOpen(true);
}

const closeStepModal = async () => {
  setStepOpen(false);

  setStepNote("");
  setCustomTitle("");
  setStepProofUri(null);
  stepProofUriRef.current = null;

  await AsyncStorage.multiRemove([
    STORAGE_KEYS.stepNote,
    STORAGE_KEYS.stepProofPhoto,
  ]);
};


async function openCustomStep() {
  setStepMode("custom");
  setCustomTitle("");
  setStepNote("");
  setStepProofUri(null);
  stepProofUriRef.current = null;

  await AsyncStorage.multiRemove([
    STORAGE_KEYS.stepNote,
    STORAGE_KEYS.stepProofPhoto,
  ]);

  setStepKey(SMALL_STEPS[0].key);
  setStepTitle("Свій еко-крок");
  setStepOpen(true);
}


 async function confirmSmallStep() {
  await ensureAuth();

  const day = kyivDayKey();
  const tKey = todayKey();
const finalTitle = stepMode === "custom" ? customTitle.trim() : stepTitle;
if (!finalTitle.length) return;
  let path: string | null = null;
  const latestUri = stepProofUriRef.current || stepProofUri;

  if (latestUri) {
    try {
      path = await uploadProof("eco", latestUri, day);
    } catch (e) {
      path = null;
    }
  }

  try {
    await upsertEcoDay({
      day,
      eco_done: true,
      eco_proof_url: path,
      challenge_done: true,
challenge_text: `${finalTitle}${stepNote.trim() ? ` — ${stepNote.trim()}` : ""}`,    
  challenge_proof_url: path,
    });
  } catch (e) {}

  setStepDone(true);
  await AsyncStorage.setItem(STORAGE_KEYS.stepDoneDay, tKey);
await AsyncStorage.setItem(STORAGE_KEYS.stepTitle, finalTitle);
  await AsyncStorage.setItem(STORAGE_KEYS.stepKey, stepKey);
  await AsyncStorage.setItem(STORAGE_KEYS.stepNote, stepNote);

await closeStepModal();
 setStepToast(true);
toastAnim.setValue(0);
Animated.timing(toastAnim, { toValue: 1, duration: 220, useNativeDriver: true }).start();

setTimeout(() => {
  Animated.timing(toastAnim, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => {
    setStepToast(false);
  });
}, 900);
}

return (
  <View style={styles.root}>
    <LinearGradient
      colors={isDark ? ["#14241B", "#111315"] : ["#F6F9F6", "#FFFFFF"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={StyleSheet.absoluteFill}
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


    <PandaToast styles={styles} />

      <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
    onPress={() => navigation.navigate("Map" as never)}
    style={[styles.heroInner, styles.heroContent]}
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
{stepDone ? <Text style={styles.sectionHint}>Зараховано</Text> : null}    
   </View>

        <View style={styles.stepCard}>
          <Text style={styles.stepTitle}>Давай зробимо маленький крок разом</Text>
          <Text style={styles.stepSub}>Обери один варіант — і збережи в історії (можна з фото)</Text>

          <View style={styles.stepGrid}>
{shownSteps.map((s) => (
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

<Pressable
  onPress={openCustomStep}
  style={({ pressed }) => [
    styles.customStep,
    { opacity: pressed ? 0.85 : 1 },
  ]}
>
  <Text style={styles.customStepTitle}>Або додай свій супер-еко-крок ✍️</Text>
  <Text style={styles.customStepSub}>Опиши дію, додай фото або коментар — і збережемо в історії</Text>
</Pressable>
{stepToast && (
  <Animated.View
    style={[
      styles.toastPill,
      {
        opacity: toastAnim,
        transform: [{ scale: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }],
      },
    ]}
  >
    <Text style={styles.toastPillText}>Зараховано ✅</Text>
  </Animated.View>
)}     
   </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Порада дня</Text>
        </View>

<Animated.View style={[styles.card, { transform: cardScale.transform }]}>
  <Pressable onPressIn={cardScale.onPressIn} onPressOut={cardScale.onPressOut}>
     <View style={styles.tipLine} />
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

      <Modal visible={stepOpen} transparent animationType="fade" onRequestClose={() => closeStepModal()}>
         <BlurView intensity={30} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
        <Pressable style={styles.modalBackdrop} onPress={() => closeStepModal()}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
<Text style={styles.modalTitle}>
  {stepMode === "custom" ? (customTitle.trim() || "Свій еко-крок") : stepTitle}
</Text>
            <Text style={styles.modalText}>Додай фото або короткий коментар — і ми збережемо це в історії.</Text>
{stepMode === "custom" && (
  <View style={{ marginTop: 12 }}>
    <TextInput
      value={customTitle}
      onChangeText={setCustomTitle}
      placeholder="Наприклад: Здав батарейки / Відмовився від стаканчика"
      placeholderTextColor={PAL.placeholder}
      style={styles.stepNoteInput}
    />
  </View>
)}
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

            <Pressable style={styles.modalClose} onPress={() => closeStepModal()}>
              <Text style={styles.modalCloseText}>Закрити</Text>
            </Pressable>
            
          </Pressable>
          
        </Pressable>
        
      </Modal>
    </View>
  );
}