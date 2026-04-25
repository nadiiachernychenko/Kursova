import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { getShopItems, buyShopItem, type AccessItemRow } from "../../lib/eduApi";
import { useEduProfile } from "../../lib/useEduProfile";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { MoreStackParamList } from "../../navigation/MoreStack";
import { useAppTheme } from "../../lib/theme";

const LEAVES = require("../../../assets/leaves-texture.png");

type Nav = NativeStackNavigationProp<MoreStackParamList>;

export default function AccessCenterScreen() {
  const navigation = useNavigation<Nav>();
  const { points, expertUnlocked, expertLevel, refresh } = useEduProfile();
  const { colors, isDark } = useAppTheme() as any;

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

  const [items, setItems] = useState<AccessItemRow[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  useEffect(() => {
    getShopItems().then(setItems).catch(() => {});
  }, []);
const openLevelScreen = (level: number) => {
  if (level <= 1) {
    navigation.navigate("EcoExpertLevel1");
    return;
  }

  if (level === 2) {
    navigation.navigate("EcoExpertLevel2");
    return;
  }

  navigation.navigate("EcoExpertLevel3");
};
  const handleBuy = async (item: AccessItemRow) => {
  try {
    setMsg(null);

    const level = Number(item.expert_level ?? 0);

    if (item.type === "expert_access") {
      if (expertUnlocked || expertLevel >= 1) {
        setMsg("✅ Eco-експерт уже відкрито");
        openLevelScreen(1);
        return;
      }
    }

    if (item.type === "expert_upgrade") {
      if (level <= expertLevel) {
        setMsg("✅ Цей рівень уже відкрито");
        openLevelScreen(level);
        return;
      }

      if (level !== expertLevel + 1) {
        setMsg(`🔒 Спочатку відкрий рівень ${expertLevel + 1}`);
        return;
      }
    }

    setBusyId(item.id);

    const res = await buyShopItem(item.id);
    await refresh();

    if (res?.ok === false) {
      if (res?.reason === "not_enough_points") {
        setMsg("Недостатньо балів");
        return;
      }

      if (res?.reason === "wrong_order") {
        setMsg(`🔒 Спочатку відкрий рівень ${expertLevel + 1}`);
        return;
      }

      if (res?.reason === "need_level1_first") {
        setMsg("🔒 Спочатку відкрий рівень 1");
        return;
      }

      setMsg(res?.reason ?? "Не вдалося купити");
      return;
    }

    if (res?.reward?.type === "unlock") {
      setMsg("🔓 Eco-експерт відкрито");
      openLevelScreen(1);
      return;
    }

    if (res?.reward?.type === "upgrade") {
      setMsg(`⬆️ Відкрито рівень ${res.reward.level}`);
      openLevelScreen(Number(res.reward.level));
      return;
    }

    if (res?.reward?.type === "badge") {
      setMsg(`🎖 ${res.reward.title} (${res.reward.rarity})`);
      return;
    }

    setMsg("✅ Готово");
  } catch (e: any) {
    Alert.alert("Помилка", e?.message ?? "Не вдалося купити");
  } finally {
    setBusyId(null);
  }
};

  const getState = (item: AccessItemRow) => {
    const level = Number(item.expert_level ?? 0);

  if (item.type === "expert_access") {
  const opened = expertUnlocked || expertLevel >= 1;
  return {
    disabled: busyId === item.id,
    label: opened ? "Відкрити" : busyId === item.id ? "..." : "Купити",
    costText: opened ? "Відкрито ✅" : `${item.cost} балів`,
    status: opened ? "opened" : "default",
  };
}

   if (item.type === "expert_upgrade") {
  if (level <= expertLevel) {
    return {
      disabled: busyId === item.id,
      label: "Відкрити",
      costText: `Рівень ${level} ✅`,
      status: "opened",
    };
  }

  if (level === expertLevel + 1) {
    return {
      disabled: busyId === item.id,
      label: busyId === item.id ? "..." : "Купити",
      costText: `${item.cost} балів`,
      status: "active",
    };
  }

       return {
    disabled: true,
    label: "Зачинено",
    costText: `Спочатку рівень ${expertLevel + 1}`,
    status: "locked",
  };
}

    return {
      disabled: busyId === item.id,
      label: busyId === item.id ? "..." : "Купити",
      costText: `${item.cost} балів`,
      status: "default",
    };
  };

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
        <View style={styles.hero}>
          <View style={styles.pointsBadge}>
            <Text style={styles.pointsBadgeText}>⭐ {points} балів</Text>
          </View>

          <Text style={styles.title}>Центр доступу</Text>
          <Text style={styles.sub}>
            Відкривай нові можливості та рівні Eco-експерта за свої бали.
          </Text>

          <View style={styles.levelBox}>
            <Text style={styles.levelLabel}>Поточний рівень</Text>
            <Text style={styles.levelValue}>{expertLevel}</Text>
          </View>
        </View>

        <View style={styles.list}>
          {items.map((item) => {
            const state = getState(item);

            return (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardMain}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <Text style={styles.cardCost}>{state.costText}</Text>
                </View>

                <Pressable
                  style={({ pressed }) => [
                    styles.btn,
                    state.status === "opened" && styles.btnOpened,
                    state.status === "locked" && styles.btnLocked,
                    state.disabled && styles.btnDisabled,
                    pressed && !state.disabled && { opacity: 0.9, transform: [{ scale: 0.99 }] },
                  ]}
                  disabled={state.disabled}
                 onPress={() => {
  const level = Number(item.expert_level ?? 0);
  const state = getState(item);

  if (state.status === "opened") {
    openLevelScreen(level || 1);
    return;
  }

  handleBuy(item);
}}
                >
                  <Text
                    style={[
                      styles.btnText,
                      state.status === "locked" && styles.btnTextLocked,
                    ]}
                  >
                    {state.label}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>

        {msg ? (
          <View style={styles.msgBox}>
            <Text style={styles.msgText}>{msg}</Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
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
      paddingTop: 20,
      paddingBottom: 24,
      gap: 14,
    },

    hero: {
      borderRadius: 24,
      borderWidth: 1,
      borderColor: line,
      backgroundColor: card,
      padding: 18,
      gap: 10,
    },

    pointsBadge: {
      alignSelf: "flex-start",
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: line,
      backgroundColor: isDark
        ? "rgba(255,255,255,0.05)"
        : "rgba(255,255,255,0.65)",
    },

    pointsBadgeText: {
      fontSize: 12,
      fontFamily: "Manrope_700Bold",
      color: text,
    },

    title: {
      fontSize: 24,
      fontFamily: "Nunito_800ExtraBold",
      color: text,
    },

    sub: {
      fontSize: 14,
      lineHeight: 21,
      fontFamily: "Manrope_500Medium",
      color: muted,
    },

    levelBox: {
      marginTop: 4,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: line,
      backgroundColor: isDark
        ? "rgba(46,125,85,0.14)"
        : "rgba(46,125,85,0.08)",
      paddingHorizontal: 14,
      paddingVertical: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },

    levelLabel: {
      fontSize: 13,
      fontFamily: "Manrope_600SemiBold",
      color: muted,
    },

    levelValue: {
      fontSize: 18,
      fontFamily: "Nunito_800ExtraBold",
      color: text,
    },

    list: {
      gap: 12,
    },

    card: {
      borderRadius: 22,
      borderWidth: 1,
      borderColor: line,
      backgroundColor: card,
      padding: 14,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },

    cardMain: {
      flex: 1,
      gap: 6,
    },

    cardTitle: {
      fontSize: 16,
      fontFamily: "Nunito_800ExtraBold",
      color: text,
    },

    cardCost: {
      fontSize: 13,
      lineHeight: 18,
      fontFamily: "Manrope_600SemiBold",
      color: muted,
    },

    btn: {
      minWidth: 108,
      height: 44,
      paddingHorizontal: 14,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: line,
      backgroundColor: isDark
        ? "rgba(46,125,85,0.22)"
        : "rgba(46,125,85,0.12)",
      alignItems: "center",
      justifyContent: "center",
    },

    btnOpened: {
      backgroundColor: isDark
        ? "rgba(255,255,255,0.07)"
        : "rgba(255,255,255,0.72)",
    },

    btnLocked: {
      backgroundColor: isDark
        ? "rgba(255,255,255,0.04)"
        : "rgba(255,255,255,0.52)",
    },

    btnDisabled: {
      opacity: 0.72,
    },

    btnText: {
      fontSize: 13,
      fontFamily: "Manrope_700Bold",
      color: text,
    },

    btnTextLocked: {
      color: muted,
    },

    msgBox: {
      marginTop: 2,
      alignSelf: "stretch",
      borderRadius: 18,
      borderWidth: 1,
      borderColor: line,
      backgroundColor: isDark
        ? "rgba(255,255,255,0.06)"
        : "rgba(255,255,255,0.60)",
      paddingHorizontal: 14,
      paddingVertical: 12,
    },

    msgText: {
      fontSize: 13,
      lineHeight: 19,
      fontFamily: "Manrope_700Bold",
      color: text,
    },
  });
}