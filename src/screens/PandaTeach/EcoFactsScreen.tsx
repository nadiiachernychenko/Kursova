import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { earnEduPoints } from "../../lib/eduApi";
import { useEduProfile } from "../../lib/useEduProfile";
import { useAppTheme } from "../../lib/theme";
import {
  getNextEduFact,
  markEduFactSeen,
  type EduFact,
} from "../../lib/eduFacts";

const LEAVES = require("../../../assets/leaves-texture.png");

export default function EcoFactsScreen() {
  const { refresh } = useEduProfile();
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

  const [fact, setFact] = useState<EduFact | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [limitMsg, setLimitMsg] = useState<string | null>(null);
  const [pointsMsg, setPointsMsg] = useState<string | null>(null);

  const loadFirst = async () => {
    try {
      setLoading(true);
      const f = await getNextEduFact("uk");
      setFact(f);
    } catch (e: any) {
      Alert.alert(
        "Помилка",
        e?.message ?? "Не вдалося завантажити факт"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFirst();
  }, []);

  const next = async () => {
    try {
      if (busy) return;

      setBusy(true);
      setLimitMsg(null);
      setPointsMsg(null);

      const f = await getNextEduFact("uk");
      if (!f) {
        setLimitMsg("Немає фактів. Додай ще в базу.");
        return;
      }

      setFact(f);
      await markEduFactSeen(f.id);

      const res: any = await earnEduPoints("facts", 1);
      await refresh();

      if (res?.ok === false) {
        setLimitMsg(
          res?.reason ??
            "Ліміт балів на сьогодні досягнуто. Далі бали не нараховуються — приходь завтра або продовжуй читати без балів."
        );
        return;
      }

      const added = Number(res?.added ?? 0);

      if (added > 0) {
        setPointsMsg(`+${added} бал`);
        setTimeout(() => setPointsMsg(null), 1200);
      } else {
        setLimitMsg(
          res?.reason ??
            "Ліміт балів на сьогодні досягнуто. Далі бали не нараховуються — приходь завтра або продовжуй читати без балів."
        );
      }
    } catch (e: any) {
      Alert.alert(
        "Помилка",
        e?.message ?? "Не вдалося виконати дію"
      );
    } finally {
      setBusy(false);
    }
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

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Еко-факти</Text>
          {pointsMsg ? (
            <Text style={styles.points}>{pointsMsg}</Text>
          ) : null}
        </View>

        <View style={styles.card}>
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator />
              <Text style={styles.loadingText}>Завантажую…</Text>
            </View>
          ) : (
            <Text style={styles.factText}>
              {fact?.text ?? "Немає фактів"}
            </Text>
          )}
        </View>

        {limitMsg ? (
          <View style={styles.limitBox}>
            <Text style={styles.limitText}>{limitMsg}</Text>
          </View>
        ) : null}

        <Pressable
          onPress={next}
          disabled={loading || busy}
          style={({ pressed }) => [
            styles.btn,
            (loading || busy) && styles.btnDisabled,
            pressed && !loading && !busy && { opacity: 0.9 },
          ]}
        >
          <Text style={styles.btnText}>
            {busy ? "Зачекай…" : "Наступний факт"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function createStyles(colors: any, isDark: boolean) {
  const line =
    colors?.line ??
    (isDark
      ? "rgba(255,255,255,0.12)"
      : "rgba(0,0,0,0.10)");

  const card =
    colors?.card ??
    (isDark
      ? "rgba(20,26,24,0.78)"
      : "rgba(255,255,255,0.78)");

  const text =
    colors?.text ??
    (isDark ? "#F2F6F4" : "#0E1512");

  const muted =
    colors?.muted ??
    (isDark
      ? "rgba(242,246,244,0.72)"
      : "rgba(14,21,18,0.72)");

  return StyleSheet.create({
    root: { flex: 1, backgroundColor: "transparent" },

    bg: { ...StyleSheet.absoluteFillObject },

    veil: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: isDark
        ? "rgba(0,0,0,0.10)"
        : "rgba(255,255,255,0.18)",
    },

    content: {
      flex: 1,
      paddingHorizontal: 14,
      paddingTop: 28,
      paddingBottom: 18,
      gap: 12,
    },

    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },

    title: {
      fontSize: 22,
      fontFamily: "Nunito_800ExtraBold",
      color: text,
    },

    points: {
      fontSize: 13,
      fontFamily: "Manrope_700Bold",
      color: "#2E7D55",
    },

    card: {
      borderRadius: 22,
      borderWidth: 1,
      borderColor: line,
      backgroundColor: card,
      padding: 16,
    },

    factText: {
      fontSize: 15,
      lineHeight: 22,
      fontFamily: "Manrope_600SemiBold",
      color: text,
    },

    loadingBox: {
      paddingVertical: 14,
      gap: 10,
      alignItems: "center",
    },

    loadingText: {
      fontSize: 12,
      fontFamily: "Manrope_700Bold",
      color: muted,
    },

    limitBox: {
      alignSelf: "flex-start",
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: line,
      backgroundColor: isDark
        ? "rgba(255,255,255,0.06)"
        : "rgba(255,255,255,0.60)",
    },

    limitText: {
      fontSize: 12,
      fontFamily: "Manrope_700Bold",
      color: muted,
    },

    btn: {
      marginTop: 2,
      height: 48,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: line,
      backgroundColor: isDark
        ? "rgba(46,125,85,0.22)"
        : "rgba(46,125,85,0.12)",
      alignItems: "center",
      justifyContent: "center",
    },

    btnDisabled: {
      opacity: 0.6,
    },

    btnText: {
      fontSize: 13,
      fontFamily: "Manrope_700Bold",
      color: text,
    },
  });
}