// src/screens/HomeScreen.tsx
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
type Challenge = { title: string; text: string; seconds: number };

const TIPS: Tip[] = [
  { emoji: "♻️", title: "Сортуй по-розумному", text: "Спочатку промий упаковку — так вона точно піде в переробку." },
  { emoji: "🧴", title: "Пластик без сюрпризів", text: "Кришечки та етикетки часто з іншого пластику — знімай, якщо можеш." },
  { emoji: "📦", title: "Картон любить сухість", text: "Мокрий картон — гірше переробляється. Зберігай сухим." },
  { emoji: "🌿", title: "Еко-дія дня", text: "Заміни один пакет на шопер — це простий win." },
  { emoji: "🚰", title: "Вода теж ресурс", text: "Закривай кран під час чистки зубів — дрібниця, а економія велика." },
  { emoji: "🧠", title: "Мінімалізм = екологія", text: "Купуй менше, але якісніше — це найсильніша еко-звичка." },
];

const CHALLENGES: Challenge[] = [
  { title: "30 секунд", text: "Знайди вдома 1 річ для переробки і поклади окремо (потім здаси).", seconds: 30 },
  { title: "1 хвилина", text: "Перевір 3 упаковки: чи є маркування пластику (1/2/5) або папір/скло.", seconds: 60 },
  { title: "45 секунд", text: "Заміни сьогодні 1 одноразову річ на багаторазову (пляшка/шопер/контейнер).", seconds: 45 },
  { title: "30 секунд", text: "Викинь сміття правильно: папір окремо, пластик окремо (що можеш — швидко).", seconds: 30 },
];

const QUICK_ACTIONS: Challenge[] = [
  { title: "30 секунд", text: "Збери всі кришечки від пляшок, які знайдеш, в одну коробочку/пакет.", seconds: 30 },
  { title: "45 секунд", text: "Знайди вдома батарейку/лампочку і відклади для спецзбору.", seconds: 45 },
  { title: "1 хвилина", text: "Перевір 3 упаковки: чи є маркування (1/2/5) або папір/скло.", seconds: 60 },
  { title: "90 секунд", text: "Постав шопер/пляшку біля виходу, щоб не забути завтра.", seconds: 90 },
  { title: "2 хвилини", text: "Швидко відсортуй те, що під рукою: папір/пластик/скло — по різних купках.", seconds: 120 },
];

const PANDA_LINES: PandaLine[] = [
  { title: "Ку-ку! Ти молодчина", sub: "Дякую, що дбаєш про довкілля" },
  { title: "Еко-герой дня", sub: "Маленькі кроки = великий вплив" },
  { title: "Псс… ти топ", sub: "Сьогодні зроби 1 еко-дію — і готово" },
];

const STORAGE_KEYS = {
  streak: "home_streak",
  doneDay: "home_done_day",
  proofPhoto: "home_proof_photo",
  tipDay: "home_tip_day",
  tipIndex: "home_tip_index",
  chDay: "home_ch_day",
  chIndex: "home_ch_index",
  chDoneDay: "home_ch_done_day",
  chProofPhoto: "home_ch_proof_photo",
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

// ✅ единый безопасный picker без deprecated MediaTypeOptions/MediaType
async function pickImageUri(): Promise<string | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (perm.status !== "granted") return null;

  const res = await ImagePicker.launchImageLibraryAsync({
    // самый совместимый способ (как ты уже делала)
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

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const greeting = useMemo(() => getGreeting(), []);
  const { colors, isDark } = useAppTheme() as any;

  const PAL = useMemo(() => makePal(colors, !!isDark), [colors, isDark]);
  const styles = useMemo(() => createStyles(PAL, !!isDark), [PAL, isDark]);

  // ✅ refs внутри компонента
  const proofUriRef = useRef<string | null>(null);
  const chProofUriRef = useRef<string | null>(null);

  // eco progress
  const [streak, setStreak] = useState(0);
  const [doneToday, setDoneToday] = useState(false);
  const [proofUri, setProofUri] = useState<string | null>(null);

  // ✅ “Юхууууу” тільки після натискання “Готово”
  const [ecoYuhu, setEcoYuhu] = useState(false);

  // tip of the day
  const [tipIndex, setTipIndex] = useState(0);

  // challenge
  const [chIndex, setChIndex] = useState(0);
  useMemo(() => CHALLENGES[chIndex], [chIndex]); // как было

  const suggestedQuick = useMemo(() => {
    const idx = hashToInt(`quick:${todayKey()}`) % QUICK_ACTIONS.length;
    return QUICK_ACTIONS[idx];
  }, []);

  const [customText, setCustomText] = useState("");

  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [selectedSeconds, setSelectedSeconds] = useState<number>(suggestedQuick.seconds);

  const [chDone, setChDone] = useState(false);
  const [chProofUri, setChProofUri] = useState<string | null>(null);

  const [chToast, setChToast] = useState(false);

  const [timerLeft, setTimerLeft] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);

  const wowScale = useRef(new Animated.Value(0.9)).current;
  const wowOpacity = useRef(new Animated.Value(0)).current;
  const [wowVisible, setWowVisible] = useState(false);

  const [soonOpen, setSoonOpen] = useState(false);

  const heroScale = usePressScale(0.992);
  const cardScale = usePressScale(0.988);

  useEffect(() => {
    (async () => {
      try {
        await ensureAuth();
      } catch (e) {
        console.log("ensureAuth failed", e);
      }

      const tKey = todayKey();
      const yKey = yesterdayKey();

      const savedStreak = await AsyncStorage.getItem(STORAGE_KEYS.streak);
      const savedDoneDay = await AsyncStorage.getItem(STORAGE_KEYS.doneDay);
      const savedProof = await AsyncStorage.getItem(STORAGE_KEYS.proofPhoto);

      const s = savedStreak ? parseInt(savedStreak, 10) : 0;
      setStreak(Number.isFinite(s) ? s : 0);
      setDoneToday(savedDoneDay === tKey);
      setProofUri(savedProof && savedDoneDay === tKey ? savedProof : null);
      proofUriRef.current = savedProof && savedDoneDay === tKey ? savedProof : null;

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

      const savedChDay = await AsyncStorage.getItem(STORAGE_KEYS.chDay);
      const savedChIndex = await AsyncStorage.getItem(STORAGE_KEYS.chIndex);

      if (savedChDay === tKey && savedChIndex != null) {
        const idx = parseInt(savedChIndex, 10) || 0;
        setChIndex(idx);
      } else {
        const yChDay = await AsyncStorage.getItem(STORAGE_KEYS.chDay);
        const yChIndex = await AsyncStorage.getItem(STORAGE_KEYS.chIndex);
        const yesterdayCh = yChDay === yKey && yChIndex != null ? parseInt(yChIndex, 10) : null;

        let idx = hashToInt(`ch:${tKey}`) % CHALLENGES.length;
        if (yesterdayCh != null && idx === yesterdayCh) idx = (idx + 1) % CHALLENGES.length;

        setChIndex(idx);
        await AsyncStorage.setItem(STORAGE_KEYS.chDay, tKey);
        await AsyncStorage.setItem(STORAGE_KEYS.chIndex, String(idx));
      }

      const savedChDoneDay = await AsyncStorage.getItem(STORAGE_KEYS.chDoneDay);
      setChDone(savedChDoneDay === tKey);

      const savedChProof = await AsyncStorage.getItem(STORAGE_KEYS.chProofPhoto);
      const chUri = savedChProof && savedChDoneDay === tKey ? savedChProof : null;
      setChProofUri(chUri);
      chProofUriRef.current = chUri;
    })();
  }, []);

  useEffect(() => {
    if (!timerRunning) return;
    if (timerLeft <= 0) {
      setTimerRunning(false);
      return;
    }
    const id = setInterval(() => setTimerLeft((x) => x - 1), 1000);
    return () => clearInterval(id);
  }, [timerRunning, timerLeft]);

  const tip = TIPS[tipIndex];

  const progress = useMemo(() => {
    return doneToday ? 1 : 0.55;
  }, [doneToday]);

  function formatTime(sec: number) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  async function pickProofPhoto() {
    const uri = await pickImageUri();
    if (!uri) return;

    proofUriRef.current = uri;
    setProofUri(uri);
    await AsyncStorage.setItem(STORAGE_KEYS.proofPhoto, uri);
  }

  async function confirmEcoDay() {
    await ensureAuth();

    const day = kyivDayKey();
    if (doneToday) return;

    const nextStreak = streak + 1;
    setStreak(nextStreak);
    setDoneToday(true);

    await AsyncStorage.setItem(STORAGE_KEYS.streak, String(nextStreak));
    await AsyncStorage.setItem(STORAGE_KEYS.doneDay, todayKey());

    const latestUri = proofUriRef.current || proofUri;

    let ecoUrl: string | null = null;
    if (latestUri) {
      try {
        console.log("📷 ECO local uri:", latestUri);
        ecoUrl = await uploadProof("eco", latestUri, day);
        console.log("✅ ECO uploaded url:", ecoUrl);
      } catch (e) {
        console.log("❌ ECO uploadProof failed", e);
        ecoUrl = null;
      }
    }

    try {
      const saved = await upsertEcoDay({
        day,
        eco_done: true,
        eco_proof_url: ecoUrl,
      });
      console.log("✅ ECO upsert saved row:", { day: saved.day, eco_proof_url: saved.eco_proof_url });
    } catch (e) {
      console.log("❌ upsertEcoDay eco failed", e);
    }
  }

  async function clearProof() {
    setProofUri(null);
    proofUriRef.current = null;
    await AsyncStorage.removeItem(STORAGE_KEYS.proofPhoto);
  }

  async function onEcoActionPress() {
    if (!doneToday) {
      await confirmEcoDay();
      return;
    }
    setEcoYuhu(true);
    setTimeout(() => setEcoYuhu(false), 1400);
  }

  const plannedText = useMemo(() => {
    const t = customText.trim();
    if (t.length > 0) return t;
    return suggestedQuick.text;
  }, [customText, suggestedQuick.text]);

  const plannedTitle = "Міні-челендж";

  function startOrResumeChallenge() {
    if (!timerRunning && timerLeft > 0) {
      setTimerRunning(true);
      return;
    }
    if (!timerRunning && timerLeft <= 0) {
      setTimerLeft(selectedSeconds);
      setWowVisible(true);
      setTimerRunning(true);
    }
  }

  function stopChallenge() {
    setTimerRunning(false);
  }

  function resetChallengeTimer() {
    setTimerRunning(false);
    setTimerLeft(0);
    setWowVisible(false);
  }

  function showWow() {
    setWowVisible(true);
    wowScale.setValue(0.92);
    wowOpacity.setValue(0);
    Animated.sequence([
      Animated.parallel([
        Animated.timing(wowOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.spring(wowScale, { toValue: 1, speed: 18, bounciness: 10, useNativeDriver: true }),
      ]),
      Animated.delay(1200),
      Animated.timing(wowOpacity, { toValue: 0, duration: 240, useNativeDriver: true }),
    ]).start(() => setWowVisible(false));
  }

  useEffect(() => {
    if (timerRunning) return;
    if (timerLeft === 0 && wowVisible) showWow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerLeft, timerRunning]);

  function onChallengeButtonPress() {
    if (timerRunning) stopChallenge();
    else startOrResumeChallenge();
  }

  async function pickChallengePhoto() {
    const uri = await pickImageUri();
    if (!uri) return;

    chProofUriRef.current = uri;
    setChProofUri(uri);
    await AsyncStorage.setItem(STORAGE_KEYS.chProofPhoto, uri);
  }

  async function clearChallengePhoto() {
    setChProofUri(null);
    chProofUriRef.current = null;
    await AsyncStorage.removeItem(STORAGE_KEYS.chProofPhoto);
  }

  async function onChallengeConfirmPress() {
    await ensureAuth();

    if (!chDone) {
      setChDone(true);

      const day = kyivDayKey();
      const latestUri = chProofUriRef.current || chProofUri;

      let chUrl: string | null = null;
      if (latestUri) {
        try {
          console.log("📷 CH local uri:", latestUri);
          chUrl = await uploadProof("challenge", latestUri, day);
          console.log("✅ CH uploaded url:", chUrl);
        } catch (e) {
          console.log("❌ challenge uploadProof failed", e);
          chUrl = null;
        }
      }

      try {
        const saved = await upsertEcoDay({
          day,
          challenge_done: true,
          challenge_seconds: selectedSeconds,
          challenge_text: customText.trim().length ? customText.trim() : suggestedQuick.text,
          challenge_proof_url: chUrl,
        });
        console.log("✅ CH upsert saved row:", { day: saved.day, challenge_proof_url: saved.challenge_proof_url });
      } catch (e) {
        console.log("❌ upsertEcoDay challenge failed", e);
      }

      await AsyncStorage.setItem(STORAGE_KEYS.chDoneDay, todayKey());
      if (latestUri) await AsyncStorage.setItem(STORAGE_KEYS.chProofPhoto, latestUri);
      else await AsyncStorage.removeItem(STORAGE_KEYS.chProofPhoto);

      return;
    }

    setChToast(true);
    setTimeout(() => setChToast(false), 1200);
  }

  const tipPillText = "Ти розумничка! Тільки вперед 💚";

  return (
    <View style={styles.root}>
      <PandaToast styles={styles} />

      <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* HERO */}
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
            <Text style={styles.heroSub}>
              Карта пунктів, підказки з сортування та маленькі челенджі — щоб робити добро легко.
            </Text>

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

        {/* ECO PROGRESS */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Еко-прогрес</Text>
          <Pressable
            onPress={() => navigation.navigate("Statistics")}
            style={({ pressed }) => [styles.linkBtn, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Text style={styles.linkText}>Статистика</Text>
          </Pressable>
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressTop}>
            <View style={styles.progressLeft}>
              <Text style={styles.progressTitle}>Серія днів</Text>
              <Text style={styles.progressValue}>{streak} 🔥</Text>
            </View>

            <View style={styles.progressRight}>
              <Text style={styles.progressTitle}>Сьогодні</Text>
              <Text style={styles.progressValue}>{doneToday ? "✅" : "⏳"}</Text>
            </View>
          </View>

          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
          </View>

          {/* фото */}
          <View style={styles.proofRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.proofTitle}>Фото (за бажанням)</Text>
              <Text style={styles.proofSub}>Додай фото “еко-дії” — збережеться в статистиці.</Text>
            </View>

            {proofUri ? (
              <View style={styles.proofThumbWrap}>
                <Image source={{ uri: proofUri }} style={styles.proofThumb} />
                <Pressable onPress={clearProof} style={({ pressed }) => [styles.proofX, { opacity: pressed ? 0.7 : 1 }]}>
                  <Text style={styles.proofXText}>✖</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable onPress={pickProofPhoto} style={({ pressed }) => [styles.smallBtn, { opacity: pressed ? 0.75 : 1 }]}>
                <Text style={styles.smallBtnText}>Додати фото</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.progressRow}>
            <Text style={styles.progressHint}>
              {ecoYuhu ? "Юхууууу! ✅" : doneToday ? "День зараховано." : "Підтверди 1 еко-дію — і день зараховано"}
            </Text>

            <Pressable onPress={onEcoActionPress} style={({ pressed }) => [styles.smallBtn, { opacity: pressed ? 0.75 : 1 }]}>
              <Text style={styles.smallBtnText}>{doneToday ? "Готово" : "Підтвердити"}</Text>
            </Pressable>
          </View>
        </View>

        {/* TIP */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Порада дня</Text>
          <Text style={styles.sectionHint}>{""}</Text>
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

        {/* MINI CHALLENGE */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Міні-челендж</Text>
          <Text style={styles.sectionHint}>до 2 хв</Text>
        </View>

        <View style={styles.challenge}>
          {wowVisible && (
            <Animated.View style={[styles.wow, { opacity: wowOpacity, transform: [{ scale: wowScale }] }]}>
              <Text style={styles.wowText}>🐼 ВАУ! ✅</Text>
            </Animated.View>
          )}

          <View style={styles.challengeLeft}>
            <Text style={styles.challengeTitle}>
              {plannedTitle} {chDone ? "✅" : ""}
            </Text>

            <Text style={styles.challengeText}>{plannedText}</Text>

            <View style={styles.customBox}>
              <TextInput
                value={customText}
                onChangeText={(t) => {
                  setCustomText(t);
                  resetChallengeTimer();
                }}
                placeholder="Або напиши свій варіант…"
                placeholderTextColor={PAL.placeholder}
                style={styles.customInput}
                multiline
              />
            </View>

            <View style={styles.timerRow}>
              <View style={styles.timerChip}>
                <Text style={styles.timerChipText}>
                  {timerRunning ? `⏳ ${formatTime(timerLeft)}` : timerLeft > 0 ? `⏸ ${formatTime(timerLeft)}` : `⏱ ${selectedSeconds}s`}
                </Text>
              </View>

              <Pressable onPress={() => setTimePickerOpen(true)} style={({ pressed }) => [styles.timeBtn, { opacity: pressed ? 0.75 : 1 }]}>
                <Text style={styles.timeBtnText}>Обрати час</Text>
              </Pressable>

              <Pressable
                onPress={onChallengeButtonPress}
                style={({ pressed }) => [timerRunning ? styles.challengeBtnAlt : styles.challengeBtn, { opacity: pressed ? 0.75 : 1 }]}
              >
                <Text style={timerRunning ? styles.challengeBtnAltText : styles.challengeBtnText}>
                  {timerRunning ? "Стоп" : timerLeft > 0 ? "Продовжити" : "Старт"}
                </Text>
              </Pressable>
            </View>

            <View style={styles.challengeFooterRow}>
              <Pressable onPress={() => navigation.navigate("Map" as never)} style={({ pressed }) => [styles.linkBtn, { opacity: pressed ? 0.6 : 1 }]}>
                <Text style={styles.linkText}>Відкрити карту</Text>
              </Pressable>

              {chProofUri ? (
                <View style={styles.proofThumbWrap}>
                  <Image source={{ uri: chProofUri }} style={styles.proofThumb} />
                  <Pressable onPress={clearChallengePhoto} style={({ pressed }) => [styles.proofX, { opacity: pressed ? 0.7 : 1 }]}>
                    <Text style={styles.proofXText}>✖</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable onPress={pickChallengePhoto} style={({ pressed }) => [styles.smallBtn, { opacity: pressed ? 0.75 : 1 }]}>
                  <Text style={styles.smallBtnText}>Фото</Text>
                </Pressable>
              )}

              <Pressable
                onPress={onChallengeConfirmPress}
                hitSlop={10}
                style={({ pressed }) => [styles.smallBtn, chDone && styles.smallBtnDisabled, { opacity: pressed ? 0.75 : 1 }]}
              >
                <Text style={[styles.smallBtnText, chDone && styles.smallBtnTextDisabled]}>
                  {chDone ? "Підтверджено" : "Підтвердити"}
                </Text>
              </Pressable>
            </View>

            {chToast && <Text style={styles.chToastText}>Зараховано ✅</Text>}
          </View>
        </View>

        <View style={{ height: 18 }} />
      </ScrollView>

      {/* TIME PICKER MODAL */}
      <Modal visible={timePickerOpen} transparent animationType="fade" onRequestClose={() => setTimePickerOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setTimePickerOpen(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>Обрати час</Text>
            <Text style={styles.modalText}>Вибери тривалість — підходить і для варіанту програми, і для твого.</Text>

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 12 }}>
              {[30, 45, 60, 90, 120].map((s) => {
                const active = selectedSeconds === s;
                return (
                  <Pressable
                    key={s}
                    onPress={() => {
                      setSelectedSeconds(s);
                      resetChallengeTimer();
                      setTimePickerOpen(false);
                    }}
                    style={({ pressed }) => [styles.timeOption, active && styles.timeOptionActive, { opacity: pressed ? 0.8 : 1 }]}
                  >
                    <Text style={[styles.timeOptionText, active && styles.timeOptionTextActive]}>
                      {s < 60 ? `${s}s` : `${Math.round(s / 60)} хв`}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable style={styles.modalClose} onPress={() => setTimePickerOpen(false)}>
              <Text style={styles.modalCloseText}>Закрити</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* SOON MODAL */}
      <Modal visible={soonOpen} transparent animationType="fade" onRequestClose={() => setSoonOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setSoonOpen(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>Скоро буде 🐼</Text>
            <Text style={styles.modalText}>
              Тут додамо:{"\n"}• Сканер упаковок (штрих-код){"\n"}• Нагороди та бейджі{"\n"}• Статистику сортування{"\n"}• Нагадування “еко-дія дня”
            </Text>

            <Pressable style={styles.modalClose} onPress={() => setSoonOpen(false)}>
              <Text style={styles.modalCloseText}>Ок</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
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

function createStyles(COLORS: Pal, isDark: boolean) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: COLORS.bg },
    screen: { flex: 1, backgroundColor: COLORS.bg },
    content: { paddingHorizontal: 14, paddingTop: 14 },

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
    heroSub: { marginTop: 8, fontSize: 13, color: COLORS.sub, lineHeight: 18 },

    heroCtaRow: { flexDirection: "row", gap: 10, marginTop: 14 },
   primaryBtn: {
  backgroundColor: COLORS.card,
  borderWidth: 1,
  borderColor: COLORS.line,
  borderRadius: 14,
  paddingVertical: 12,
  alignItems: "center",
  justifyContent: "center",
  paddingHorizontal: 14,
},
primaryBtnText: { color: COLORS.text, fontWeight: "900", fontSize: 13 },


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

    linkBtn: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: COLORS.line,
      backgroundColor: COLORS.card,
    },
    linkText: { fontSize: 12, fontWeight: "900", color: COLORS.text },

    progressCard: {
      borderRadius: 22,
      borderWidth: 1,
      borderColor: COLORS.line,
      backgroundColor: COLORS.card,
      padding: 14,
      ...shadow,
    },
    progressTop: { flexDirection: "row", gap: 12 },
    progressLeft: { flex: 1 },
    progressRight: { width: 88, alignItems: "flex-end" },
    progressTitle: { fontSize: 12, fontWeight: "900", color: COLORS.sub },
    progressValue: { marginTop: 6, fontSize: 18, fontWeight: "900", color: COLORS.text },

    progressBar: {
      marginTop: 12,
      height: 10,
      borderRadius: 999,
      backgroundColor: isDark ? "rgba(242,243,244,0.10)" : "rgba(17,18,20,0.06)",
      overflow: "hidden",
    },
    progressFill: { height: "100%", borderRadius: 999, backgroundColor: COLORS.accent },

    proofRow: { marginTop: 12, flexDirection: "row", alignItems: "center", gap: 10 },
    proofTitle: { fontSize: 12, fontWeight: "900", color: COLORS.text },
    proofSub: { marginTop: 4, fontSize: 12, fontWeight: "800", color: COLORS.sub, lineHeight: 16 },

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

    progressRow: { marginTop: 10, flexDirection: "row", alignItems: "center", gap: 10 },
    progressHint: { flex: 1, fontSize: 12, color: COLORS.sub, fontWeight: "800", lineHeight: 16 },

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
    smallBtnDisabled: { backgroundColor: isDark ? "rgba(242,243,244,0.10)" : "rgba(17,18,20,0.06)", borderColor: isDark ? "rgba(242,243,244,0.18)" : "rgba(17,18,20,0.10)" },
    smallBtnText: { color: COLORS.accent, fontWeight: "900", fontSize: 12 },
    smallBtnTextDisabled: { color: isDark ? "rgba(242,243,244,0.55)" : "rgba(17,18,20,0.55)" },

    card: { borderRadius: 22, borderWidth: 1, borderColor: COLORS.line, backgroundColor: COLORS.card, ...shadow },
    cardTop: { flexDirection: "row", gap: 10, padding: 14 },
    cardEmoji: { fontSize: 20 },
    cardTitle: { fontSize: 14, fontWeight: "900", color: COLORS.text },
    cardText: { marginTop: 6, fontSize: 13, color: COLORS.sub, lineHeight: 18 },
    cardFooter: { paddingHorizontal: 14, paddingBottom: 14 },
    pill: { alignSelf: "flex-start", backgroundColor: COLORS.accentSoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
    pillText: { color: COLORS.accent, fontWeight: "900", fontSize: 12 },

    challenge: {
      borderRadius: 22,
      borderWidth: 1,
      borderColor: COLORS.line,
      backgroundColor: COLORS.card,
      padding: 14,
      ...shadow,
      overflow: "hidden",
    },
    challengeLeft: { flex: 1 },
    challengeTitle: { fontSize: 13, fontWeight: "900", color: COLORS.text },
    challengeText: { marginTop: 6, fontSize: 13, color: COLORS.sub, lineHeight: 18 },

    wow: {
      position: "absolute",
      top: 10,
      right: 10,
      zIndex: 10,
      backgroundColor: COLORS.card,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: COLORS.line,
      ...shadow,
    },
    wowText: { fontWeight: "900", color: COLORS.text },

    customBox: {
      marginTop: 10,
      borderWidth: 1,
      borderColor: COLORS.line,
      backgroundColor: isDark ? "rgba(242,243,244,0.06)" : "rgba(17,18,20,0.02)",
      borderRadius: 16,
      padding: 10,
    },
    customInput: { minHeight: 44, fontSize: 13, fontWeight: "800", color: COLORS.text, lineHeight: 18 },

    timerRow: { marginTop: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
    timerChip: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: COLORS.line, backgroundColor: COLORS.card },
    timerChipText: { fontSize: 12, fontWeight: "900", color: COLORS.text },

    timeBtn: {
      backgroundColor: COLORS.card,
      borderWidth: 1,
      borderColor: COLORS.line,
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    timeBtnText: { color: COLORS.text, fontWeight: "900", fontSize: 12 },

    challengeBtn: {
  backgroundColor: COLORS.card,
  borderWidth: 1,
  borderColor: COLORS.line,
  borderRadius: 14,
  paddingHorizontal: 14,
  paddingVertical: 10,
  alignItems: "center",
  justifyContent: "center",
  minWidth: 110,
},
challengeBtnText: { color: COLORS.text, fontWeight: "900", fontSize: 12 },


    challengeBtnAlt: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.line, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, alignItems: "center", justifyContent: "center", minWidth: 110 },
    challengeBtnAltText: { color: COLORS.text, fontWeight: "900", fontSize: 12 },

    challengeFooterRow: { marginTop: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },

    chToastText: { marginTop: 8, fontSize: 12, fontWeight: "900", color: COLORS.accent, opacity: 0.95 },

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

    modalBackdrop: { flex: 1, backgroundColor: isDark ? "rgba(0,0,0,0.65)" : "rgba(0,0,0,0.25)", padding: 14, justifyContent: "center" },
    modalCard: { backgroundColor: COLORS.card, borderRadius: 22, borderWidth: 1, borderColor: COLORS.line, padding: 14, ...shadow },
    modalTitle: { fontSize: 16, fontWeight: "900", color: COLORS.text, marginBottom: 8 },
    modalText: { fontSize: 13, color: COLORS.sub, lineHeight: 18, fontWeight: "700" },
    modalClose: { alignSelf: "flex-end", marginTop: 12, borderWidth: 1, borderColor: COLORS.line, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: COLORS.card },
    modalCloseText: { fontSize: 12, fontWeight: "900", color: COLORS.text },

    timeOption: { borderWidth: 1, borderColor: COLORS.line, backgroundColor: COLORS.card, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10 },
    timeOptionActive: { backgroundColor: COLORS.accentSoft, borderColor: isDark ? "rgba(47,111,78,0.28)" : "rgba(47,111,78,0.20)" },
    timeOptionText: { fontSize: 12, fontWeight: "900", color: COLORS.text },
    timeOptionTextActive: { color: COLORS.accent },
  });
}
