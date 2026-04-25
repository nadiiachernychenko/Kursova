import React, { useCallback, useEffect, useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  Image,
  
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { PandaTeachStackParamList } from "../../navigation/PandaTeachStack";
import { useEduProfile } from "../../lib/useEduProfile";
import { useAppTheme } from "../../lib/theme";

type Nav = NativeStackNavigationProp<PandaTeachStackParamList>;

const MAX_LEVEL = 3;
const LEAVES = require("../../../assets/leaves-texture.png");

export default function EcoExpertHubScreen() {
  const navigation = useNavigation<Nav>();
  const { refresh, points, expertUnlocked, expertLevel } = useEduProfile();
  const { colors, isDark } = useAppTheme() as any;

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  const lvl = Math.max(0, Number(expertLevel ?? 0));
  const unlocked = !!expertUnlocked || lvl > 0;

  const title = useMemo(() => {
    if (!unlocked) return "Eco-експерт";
    if (lvl >= 3) return "Завершена програма";
    if (lvl >= 2) return "Навчання";
    return "Старт";
  }, [unlocked, lvl]);

  const can = (need: number) => lvl >= need;
const progressWidth = `${Math.max(8, (lvl / MAX_LEVEL) * 100)}%` as `${number}%`;
  const grad = useMemo(
    () =>
      isDark
        ? ["#07110D", "#0B1711", "#0E1D15"]
        : ["#F6FBF8", "#F2FAF5", "#ECF7F0"],
    [isDark]
  );

  const styles = useMemo(
    () => createStyles(colors, !!isDark),
    [colors, isDark]
  );

  if (!unlocked) {
    return (
      <View style={styles.root}>
        <LinearGradient
          style={styles.bg}
          colors={grad as any}
          start={{ x: 0.15, y: 0.05 }}
          end={{ x: 0.9, y: 1 }}
        />

        <Image
          source={LEAVES}
          resizeMode="cover"
          style={[
            StyleSheet.absoluteFillObject,
            {
              opacity: isDark ? 0.06 : 0.08,
              transform: [{ scale: 1.12 }],
            },
          ]}
        />

        <View style={styles.veil} />

        <View style={styles.lockWrap}>
          <View style={styles.lockCard}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>Eco Expert</Text>
            </View>

            <Text style={styles.lockEmoji}>🔒</Text>
            <Text style={styles.lockTitle}>Доступ лише для Eco-експерта</Text>
            <Text style={styles.lockSub}>
              Відкрий рівень 1 у Центрі доступу, щоб почати свій шлях.
            </Text>

            <Pressable
              onPress={() => navigation.navigate("PandaShop")}
              style={({ pressed }) => [
                styles.primaryBtn,
                pressed && { opacity: 0.92 },
              ]}
            >
              <Text style={styles.primaryBtnText}>Відкрити Центр доступу</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <LinearGradient
        style={styles.bg}
        colors={grad as any}
        start={{ x: 0.15, y: 0.05 }}
        end={{ x: 0.9, y: 1 }}
      />

      <Image
        source={LEAVES}
        resizeMode="cover"
        style={[
          StyleSheet.absoluteFillObject,
          {
            opacity: isDark ? 0.06 : 0.08,
            transform: [{ scale: 1.12 }],
          },
        ]}
      />

      <View style={styles.veil} />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={isDark ? ["#18392A", "#11271D"] : ["#DDEFE4", "#EEF8F1"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroTop}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>Eco Expert</Text>
            </View>

            <View style={styles.levelPill}>
              <Text style={styles.levelPillText}>Level {lvl}</Text>
            </View>
          </View>

          <Text style={styles.heroTitle}>🌿 {title}</Text>
          <Text style={styles.heroSub}>
            Тут відкриваються твої поглиблені еко-можливості, уроки та кейси.
          </Text>

          <View style={styles.statusCard}>
            <View style={styles.statusTop}>
              <Text style={styles.statusLabel}>Прогрес програми</Text>
              <Text style={styles.statusValue}>
                {lvl} / {MAX_LEVEL}
              </Text>
            </View>

            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: progressWidth }]} />
            </View>

            <View style={styles.infoRow}>
              <View style={styles.pointsChip}>
                <Text style={styles.pointsChipLabel}>Балів</Text>
                <Text style={styles.pointsChipValue}>⭐ {points}</Text>
              </View>

              <Pressable
                onPress={() => navigation.navigate("PandaShop")}
                style={({ pressed }) => [
                  styles.secondaryBtn,
                  pressed && { opacity: 0.92 },
                ]}
              >
                <Text style={styles.secondaryBtnText}>Центр доступу</Text>
              </Pressable>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Можливості</Text>
          <Text style={styles.sectionSub}>
            Нові блоки відкриваються поступово разом із рівнями.
          </Text>
        </View>

        <FeatureCard
          title="Поглиблені тести"
          sub="Рівень 1: важчі питання, країни, технології та правильне сортування."
          badge="Level 1"
          emoji="🧠"
          ok={can(1)}
          onPress={() => navigation.navigate("EcoExpertLevel1")}
          styles={styles}
        />

        <FeatureCard
          title="Еко-курс / міні-уроки"
          sub="Рівень 2: короткі уроки, більше знань і бонуси за проходження."
          badge="Level 2"
          emoji="📚"
          ok={can(2)}
          onPress={() => navigation.navigate("EcoExpertLevel2")}
          styles={styles}
        />

        <FeatureCard
          title="Еко-кейси"
          sub="Рівень 3: життєві ситуації, фото та складніші еко-рішення."
          badge="Level 3"
          emoji="🌍"
          ok={can(3)}
          onPress={() => navigation.navigate("EcoExpertLevel3")}
          styles={styles}
        />

        {lvl < MAX_LEVEL ? (
          <Pressable
            onPress={() => navigation.navigate("PandaShop")}
            style={({ pressed }) => [
              styles.bottomCta,
              pressed && { opacity: 0.94 },
            ]}
          >
            <Text style={styles.bottomCtaTitle}>
              Відкрити наступний рівень
            </Text>
            <Text style={styles.bottomCtaSub}>
              Перейти до Центру доступу та розблокувати нові можливості
            </Text>
          </Pressable>
        ) : (
          <View style={styles.doneCard}>
            <Text style={styles.doneTitle}>У тебе максимальний рівень ✅</Text>
            <Text style={styles.doneSub}>
              Уся програма Eco Expert уже відкрита.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function FeatureCard({
  title,
  sub,
  badge,
  emoji,
  ok,
  onPress,
  styles,
}: {
  title: string;
  sub: string;
  badge: string;
  emoji: string;
  ok: boolean;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Pressable
      disabled={!ok}
      onPress={onPress}
      style={({ pressed }) => [
        styles.featureCard,
        !ok && styles.featureCardLocked,
        pressed && ok && { opacity: 0.94, transform: [{ scale: 0.995 }] },
      ]}
    >
      <View style={styles.featureTop}>
        <View style={styles.iconWrap}>
          <Text style={styles.iconText}>{emoji}</Text>
        </View>

        <View style={styles.featureBadge}>
          <Text style={styles.featureBadgeText}>{badge}</Text>
        </View>
      </View>

      <Text style={styles.featureTitle}>
        {title} {ok ? "✅" : "🔒"}
      </Text>
      <Text style={styles.featureSub}>{sub}</Text>

      <View style={styles.featureBottom}>
        <Text style={styles.featureState}>
          {ok ? "Доступно зараз" : "Поки що зачинено"}
        </Text>
        <Text style={styles.featureLink}>
          {ok ? "Перейти" : "Відкрий попередній рівень"}
        </Text>
      </View>
    </Pressable>
  );
}

function createStyles(colors: any, isDark: boolean) {
  const line =
    colors?.line ??
    (isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)");

  const card =
    colors?.card ??
    (isDark ? "rgba(20,26,24,0.78)" : "rgba(255,255,255,0.78)");

  const text =
    colors?.text ??
    (isDark ? "#F2F6F4" : "#0E1512");

  const muted =
    colors?.muted ??
    (isDark ? "rgba(242,246,244,0.72)" : "rgba(14,21,18,0.68)");

  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: "transparent",
    },

    bg: {
      ...StyleSheet.absoluteFillObject,
    },

    veil: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: isDark
        ? "rgba(0,0,0,0.10)"
        : "rgba(255,255,255,0.18)",
    },

    container: {
      paddingHorizontal: 14,
      paddingTop: 12,
      paddingBottom: 24,
      gap: 12,
    },

    hero: {
      borderRadius: 24,
      borderWidth: 1,
      borderColor: line,
      paddingHorizontal: 14,
      paddingVertical: 14,
      gap: 10,
      shadowColor: "#000",
      shadowOpacity: 0.06,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 8 },
      elevation: 2,
    },

    heroTop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },

    heroBadge: {
      borderWidth: 1,
      borderColor: line,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 6,
      backgroundColor: isDark
        ? "rgba(255,255,255,0.06)"
        : "rgba(255,255,255,0.52)",
    },

    heroBadgeText: {
      fontSize: 11,
      fontFamily: "Manrope_700Bold",
      color: "#2E7D55",
    },

    levelPill: {
      borderWidth: 1,
      borderColor: line,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 6,
      backgroundColor: isDark
        ? "rgba(255,255,255,0.08)"
        : "rgba(255,255,255,0.68)",
    },

    levelPillText: {
      fontSize: 11,
      fontFamily: "Manrope_700Bold",
      color: text,
    },

    heroTitle: {
      fontSize: 24,
      lineHeight: 28,
      fontFamily: "Nunito_800ExtraBold",
      color: text,
    },

    heroSub: {
      fontSize: 14,
      lineHeight: 21,
      fontFamily: "Manrope_500Medium",
      color: muted,
    },

    statusCard: {
      marginTop: 2,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: line,
      backgroundColor: isDark
        ? "rgba(255,255,255,0.05)"
        : "rgba(255,255,255,0.62)",
      padding: 12,
      gap: 10,
    },

    statusTop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },

    statusLabel: {
      fontSize: 13,
      fontFamily: "Manrope_600SemiBold",
      color: muted,
    },

    statusValue: {
      fontSize: 14,
      fontFamily: "Nunito_800ExtraBold",
      color: text,
    },

    progressTrack: {
      height: 10,
      borderRadius: 999,
      backgroundColor: isDark
        ? "rgba(255,255,255,0.08)"
        : "rgba(46,125,85,0.10)",
      overflow: "hidden",
    },

    progressFill: {
      height: "100%",
      borderRadius: 999,
      backgroundColor: "#2E7D55",
    },

    infoRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },

    pointsChip: {
      flex: 1,
      borderWidth: 1,
      borderColor: line,
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: isDark
        ? "rgba(255,255,255,0.04)"
        : "rgba(255,255,255,0.65)",
    },

    pointsChipLabel: {
      fontSize: 11,
      fontFamily: "Manrope_600SemiBold",
      color: muted,
      marginBottom: 3,
    },

    pointsChipValue: {
      fontSize: 15,
      fontFamily: "Nunito_800ExtraBold",
      color: text,
    },

    secondaryBtn: {
      minWidth: 132,
      height: 46,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: line,
      backgroundColor: isDark
        ? "rgba(46,125,85,0.18)"
        : "rgba(46,125,85,0.12)",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 12,
    },

    secondaryBtnText: {
      fontSize: 13,
      fontFamily: "Manrope_700Bold",
      color: text,
    },

    sectionHead: {
      marginTop: 2,
      gap: 4,
    },

    sectionTitle: {
      fontSize: 18,
      fontFamily: "Nunito_800ExtraBold",
      color: text,
    },

    sectionSub: {
      fontSize: 13,
      lineHeight: 19,
      fontFamily: "Manrope_500Medium",
      color: muted,
    },

    featureCard: {
      borderRadius: 22,
      borderWidth: 1,
      borderColor: line,
      backgroundColor: card,
      padding: 14,
      gap: 8,
      shadowColor: "#000",
      shadowOpacity: 0.04,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 6 },
      elevation: 1,
    },

    featureCardLocked: {
      opacity: 0.58,
    },

    featureTop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },

    iconWrap: {
      width: 42,
      height: 42,
      borderRadius: 21,
      borderWidth: 1,
      borderColor: line,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDark
        ? "rgba(255,255,255,0.05)"
        : "rgba(255,255,255,0.72)",
    },

    iconText: {
      fontSize: 18,
    },

    featureBadge: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: line,
      paddingHorizontal: 10,
      paddingVertical: 6,
      backgroundColor: isDark
        ? "rgba(255,255,255,0.05)"
        : "rgba(46,125,85,0.08)",
    },

    featureBadgeText: {
      fontSize: 11,
      fontFamily: "Manrope_700Bold",
      color: "#2E7D55",
    },

    featureTitle: {
      fontSize: 16,
      lineHeight: 22,
      fontFamily: "Nunito_800ExtraBold",
      color: text,
    },

    featureSub: {
      fontSize: 13,
      lineHeight: 20,
      fontFamily: "Manrope_500Medium",
      color: muted,
    },

    featureBottom: {
      marginTop: 2,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },

    featureState: {
      flex: 1,
      fontSize: 12,
      fontFamily: "Manrope_600SemiBold",
      color: muted,
    },

    featureLink: {
      fontSize: 12,
      fontFamily: "Manrope_700Bold",
      color: "#2E7D55",
    },

    bottomCta: {
      marginTop: 4,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: line,
      backgroundColor: isDark
        ? "rgba(46,125,85,0.16)"
        : "rgba(46,125,85,0.10)",
      padding: 16,
      gap: 4,
    },

    bottomCtaTitle: {
      fontSize: 15,
      fontFamily: "Nunito_800ExtraBold",
      color: text,
      textAlign: "center",
    },

    bottomCtaSub: {
      fontSize: 12,
      lineHeight: 18,
      fontFamily: "Manrope_500Medium",
      color: muted,
      textAlign: "center",
    },

    doneCard: {
      marginTop: 4,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: line,
      backgroundColor: card,
      padding: 16,
      gap: 4,
    },

    doneTitle: {
      fontSize: 15,
      fontFamily: "Nunito_800ExtraBold",
      color: text,
      textAlign: "center",
    },

    doneSub: {
      fontSize: 13,
      lineHeight: 19,
      fontFamily: "Manrope_500Medium",
      color: muted,
      textAlign: "center",
    },

    lockWrap: {
      flex: 1,
      paddingHorizontal: 16,
      justifyContent: "center",
    },

    lockCard: {
      borderRadius: 24,
      borderWidth: 1,
      borderColor: line,
      backgroundColor: card,
      padding: 20,
      alignItems: "center",
      gap: 10,
    },

    lockEmoji: {
      fontSize: 28,
      marginTop: 2,
    },

    lockTitle: {
      fontSize: 22,
      lineHeight: 28,
      fontFamily: "Nunito_800ExtraBold",
      color: text,
      textAlign: "center",
    },

    lockSub: {
      fontSize: 14,
      lineHeight: 21,
      fontFamily: "Manrope_500Medium",
      color: muted,
      textAlign: "center",
      marginBottom: 4,
    },

    primaryBtn: {
      marginTop: 4,
      minHeight: 48,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: line,
      backgroundColor: isDark
        ? "rgba(46,125,85,0.22)"
        : "rgba(46,125,85,0.12)",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 18,
      alignSelf: "stretch",
    },

    primaryBtnText: {
      fontSize: 14,
      fontFamily: "Manrope_700Bold",
      color: text,
    },
  });
}