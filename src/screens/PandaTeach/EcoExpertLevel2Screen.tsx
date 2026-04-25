import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Image,
  ScrollView,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { getExpertLessons, type ExpertLesson } from "../../lib/eduApi";
import { useEduProfile } from "../../lib/useEduProfile";
import { useAppTheme } from "../../lib/theme";

const LEAVES = require("../../../assets/leaves-texture.png");

const FONTS = {
  title: "Nunito_800ExtraBold",
  title2: "Nunito_700Bold",
  body: "Manrope_600SemiBold",
  strong: "Manrope_700Bold",
} as const;

export default function EcoExpertLevel2Screen() {
  const navigation = useNavigation<any>();
  const { refresh, expertLevel } = useEduProfile();
  const { isDark } = useAppTheme();

  const COLORS = {
    bgTop: isDark ? "#112C21" : "#E6F6EC",
    bgBottom: isDark ? "#091811" : "#F5FBF7",
    veil: isDark ? "rgba(0,0,0,0.16)" : "rgba(255,255,255,0.2)",
    card: isDark ? "rgba(16, 35, 27, 0.96)" : "rgba(255,255,255,0.96)",
    cardSoft: isDark ? "#173327" : "#F0F7F2",
    line: isDark ? "rgba(146, 211, 170, 0.14)" : "rgba(44, 108, 75, 0.12)",
    text: isDark ? "#F3FFF7" : "#173626",
    sub: isDark ? "#B6D2C0" : "#607766",
    accent: "#2FA36B",
    accentDeep: "#237E53",
    accentSoft: isDark ? "rgba(47,163,107,0.16)" : "#E4F5EB",
    accentSoft2: isDark ? "rgba(47,163,107,0.12)" : "#EEF8F2",
    wrongSoft: isDark ? "rgba(224,109,109,0.13)" : "#FFF2F2",
    rightSoft: isDark ? "rgba(47,163,107,0.16)" : "#EAF8F0",
    shadow: "#000000",
  };

  const [items, setItems] = useState<ExpertLesson[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const aliveRef = useRef(true);
  const inFlightRef = useRef(false);

  const unlocked = (expertLevel ?? 0) >= 2;

  const load = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    try {
      setLoading(true);
      setMsg(null);

      const data = await getExpertLessons(2);

      if (!aliveRef.current) return;

      setItems(data);
    } catch (e: any) {
      if (!aliveRef.current) return;
      setMsg(e?.message ?? "Не вдалося завантажити уроки");
    } finally {
      if (aliveRef.current) setLoading(false);
      inFlightRef.current = false;
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      aliveRef.current = true;
      refresh();
      load();

      return () => {
        aliveRef.current = false;
      };
    }, [load, refresh])
  );

  const doneCount = useMemo(() => items.filter((x) => x.is_done).length, [items]);
  const totalCount = items.length;
  const progress = totalCount > 0 ? doneCount / totalCount : 0;
  const allDone = totalCount > 0 && doneCount === totalCount;

  if (!unlocked) {
    return (
      <View style={styles.root}>
        <LinearGradient
          colors={[COLORS.bgTop, COLORS.bgBottom]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.bg}
        />
        <Image source={LEAVES} style={[styles.texture, { opacity: isDark ? 0.05 : 0.07 }]} resizeMode="cover" />
        <View style={[styles.veil, { backgroundColor: COLORS.veil }]} />

        <View style={styles.lockedWrap}>
          <View
            style={[
              styles.lockedCard,
              {
                backgroundColor: COLORS.card,
                borderColor: COLORS.line,
                shadowColor: COLORS.shadow,
              },
            ]}
          >
            <Text style={styles.lockedEmoji}>📚</Text>
            <Text style={[styles.lockedTitle, { color: COLORS.text }]}>Еко-курс • Level 2</Text>
            <Text style={[styles.lockedSub, { color: COLORS.sub }]}>
              Цей розділ відкривається після переходу на другий рівень.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[COLORS.bgTop, COLORS.bgBottom]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.bg}
      />
      <Image source={LEAVES} style={[styles.texture, { opacity: isDark ? 0.05 : 0.07 }]} resizeMode="cover" />
      <View style={[styles.veil, { backgroundColor: COLORS.veil }]} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={isDark ? ["#18392A", "#11271D"] : ["#DCEFE3", "#EEF8F1"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.hero,
            {
              borderColor: COLORS.line,
              shadowColor: COLORS.shadow,
            },
          ]}
        >
          <View style={styles.heroTop}>
            <View style={[styles.badge, { backgroundColor: COLORS.accentSoft, borderColor: COLORS.line }]}>
              <Text style={[styles.badgeText, { color: COLORS.accentDeep }]}>Eco Expert</Text>
            </View>

            <View style={[styles.levelPill, { borderColor: COLORS.line }]}>
              <Text style={[styles.levelPillText, { color: COLORS.text }]}>Level 2</Text>
            </View>
          </View>

<Text style={[styles.heroTitle, { color: COLORS.text }]}>Еко-читанка📚</Text>    
      <Text style={[styles.heroSub, { color: COLORS.sub }]}>
            Обирай тему, уважно читай та відповідай на питання в кінці.
          </Text>

          <View style={[styles.progressCard, { backgroundColor: COLORS.accentSoft2, borderColor: COLORS.line }]}>
            <View style={styles.progressTop}>
              <Text style={[styles.progressLabel, { color: COLORS.text }]}>Прогрес</Text>
              <Text style={[styles.progressValue, { color: COLORS.accentDeep }]}>
                {doneCount} / {totalCount || 0}
              </Text>
            </View>

            <View style={[styles.progressTrack, { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.75)" }]}>
              <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: COLORS.accent }]} />
            </View>
          </View>
        </LinearGradient>

        {msg ? (
          <View style={[styles.infoBox, { backgroundColor: COLORS.wrongSoft, borderColor: COLORS.line }]}>
            <Text style={[styles.infoText, { color: COLORS.text }]}>{msg}</Text>
          </View>
        ) : null}

        {allDone ? (
          <View
            style={[
              styles.finishCard,
              {
                backgroundColor: COLORS.rightSoft,
                borderColor: COLORS.line,
              },
            ]}
          >
            <Text style={styles.finishEmoji}>🎉</Text>
            <Text style={[styles.finishTitle, { color: COLORS.text }]}>Рівень 2 завершено</Text>
            <Text style={[styles.finishSub, { color: COLORS.sub }]}>
              Юхуу! Ти завершив еко-курс. Переходимо до Центру PRO-можливостей?
            </Text>

            <Pressable
              style={({ pressed }) => [
                styles.finishBtn,
                {
                  backgroundColor: COLORS.accent,
                  borderColor: COLORS.accent,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
              onPress={() => navigation.navigate("PandaShop")}
            >
              <Text style={styles.finishBtnText}>Центр PRO-можливостей →</Text>
            </Pressable>
          </View>
        ) : null}

        {items.map((lesson, index) => (
          <Pressable
            key={lesson.id}
            onPress={() => navigation.navigate("EcoExpertLevel2Lesson", { lessonId: lesson.id })}
            style={({ pressed }) => [
              styles.card,
              {
                backgroundColor: COLORS.card,
                borderColor: COLORS.line,
                shadowColor: COLORS.shadow,
                opacity: pressed ? 0.94 : 1,
              },
            ]}
          >
            <View style={styles.cardLeft}>
              <View style={[styles.lessonNum, { backgroundColor: COLORS.accentSoft, borderColor: COLORS.line }]}>
                <Text style={[styles.lessonNumText, { color: COLORS.accentDeep }]}>{index + 1}</Text>
              </View>

              <View style={styles.cardTextWrap}>
  <Text style={[styles.lessonTitle, { color: COLORS.text }]}>
    {lesson.title} {lesson.is_done ? "✅" : ""}
  </Text>
</View>
            </View>

            <Text style={[styles.arrow, { color: COLORS.accentDeep }]}>→</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "transparent" },
  bg: { ...StyleSheet.absoluteFillObject },
  texture: { ...StyleSheet.absoluteFillObject, transform: [{ scale: 1.12 }] },
  veil: { ...StyleSheet.absoluteFillObject },

  content: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 18,
    gap: 10,
  },

  hero: {
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
    gap: 8,
  },

  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  badge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  badgeText: {
    fontFamily: FONTS.strong,
    fontSize: 11,
  },

  levelPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(255,255,255,0.22)",
  },

  levelPillText: {
    fontFamily: FONTS.strong,
    fontSize: 11,
  },

  heroTitle: {
    fontFamily: FONTS.title,
    fontSize: 20,
    lineHeight: 24,
  },

  heroSub: {
    fontFamily: FONTS.body,
    fontSize: 13,
    lineHeight: 18,
  },

  progressCard: {
    marginTop: 2,
    borderWidth: 1,
    borderRadius: 16,
    padding: 10,
    gap: 8,
  },

  progressTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  progressLabel: {
    fontFamily: FONTS.strong,
    fontSize: 13,
  },

  progressValue: {
    fontFamily: FONTS.strong,
    fontSize: 13,
  },

  progressTrack: {
    height: 8,
    borderRadius: 999,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: 999,
  },

  infoBox: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
  },

  infoText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    lineHeight: 20,
  },

  finishCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    gap: 8,
    alignItems: "center",
  },

  finishEmoji: {
    fontSize: 22,
  },

  finishTitle: {
    fontFamily: FONTS.title2,
    fontSize: 18,
    textAlign: "center",
  },

  finishSub: {
    fontFamily: FONTS.body,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },

  finishBtn: {
    marginTop: 4,
    minHeight: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },

  finishBtnText: {
    color: "#FFFFFF",
    fontFamily: FONTS.strong,
    fontSize: 13,
  },

card: {
  borderWidth: 1,
  borderRadius: 22,
  paddingVertical: 14,
  paddingHorizontal: 14,
  minHeight: 82,
  shadowOpacity: 0.07,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 8 },
  elevation: 2,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
},

  cardLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  lessonNum: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  lessonNumText: {
    fontFamily: FONTS.strong,
    fontSize: 14,
  },

  cardTextWrap: {
    flex: 1,
  },

lessonTitle: {
  fontFamily: FONTS.title2,
  fontSize: 17,
  lineHeight: 23,
},

 arrow: {
  fontFamily: FONTS.title2,
  fontSize: 20,
},

  lockedWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  lockedCard: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    alignItems: "center",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
    gap: 8,
  },

  lockedEmoji: {
    fontSize: 28,
  },

  lockedTitle: {
    fontFamily: FONTS.title2,
    fontSize: 20,
    textAlign: "center",
  },

  lockedSub: {
    fontFamily: FONTS.body,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
});