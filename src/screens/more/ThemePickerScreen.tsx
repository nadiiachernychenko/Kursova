import React, { useMemo } from "react";
import { StyleSheet, Text, Pressable, View, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useSettings, AppTheme } from "../../context/SettingsContext";
import { useAppTheme } from "../../lib/theme";
import { useT } from "../../lib/i18n";

const LEAVES = require("../../../assets/leaves-texture.png");

type Opt = {
  value: AppTheme;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

export function ThemePickerScreen() {
  const { theme, setTheme } = useSettings();
  const { colors, isDark } = useAppTheme() as any;
  const t = useT();

  const styles = useMemo(() => createStyles(colors, !!isDark), [colors, isDark]);

  const opts: Opt[] = [
    { value: "system", label: t("system"), icon: "phone-portrait-outline" },
    { value: "dark", label: t("dark"), icon: "moon-outline" },
    { value: "light", label: t("light"), icon: "sunny-outline" },
  ];

  return (
    <SafeAreaView style={styles.root}>
      <View style={StyleSheet.absoluteFill}>
        <View style={styles.bgBase} />
        <Image source={LEAVES} resizeMode="cover" style={styles.bgLeaves} />
        <View style={styles.bgOverlay} pointerEvents="none" />
      </View>

      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons
              name="color-palette-outline"
              size={18}
              color={styles._sub.color}
              style={{ opacity: 0.7 }}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.h1}>{t("theme")}</Text>
            <Text style={styles.sub}>{t("chooseTheme")}</Text>
          </View>
        </View>

        <View style={styles.list}>
          {opts.map((o, idx) => {
            const active = theme === o.value;

            return (
              <Pressable
                key={o.value}
                onPress={() => setTheme(o.value)}
                style={({ pressed }) => [
                  styles.row,
                  idx === 0 && styles.rowFirst,
                  active && styles.rowActive,
                  pressed && { opacity: 0.9 },
                ]}
              >
                <View style={styles.left}>
                  <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
                    <Ionicons
                      name={o.icon}
                      size={18}
                      color={styles._sub.color}
                      style={{ opacity: active ? 0.9 : 0.55 }}
                    />
                  </View>

                  <Text style={styles.label}>{o.label}</Text>
                </View>

                <View style={[styles.dot, active && styles.dotActive]}>
                  {active ? <View style={styles.dotInner} /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.tip}>
          <Ionicons
            name="leaf-outline"
            size={16}
            color={styles._sub.color}
            style={{ opacity: 0.7 }}
          />
          <Text style={styles.tipText}>Тема застосовується одразу.</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors: any, isDark: boolean) {
  const bg = colors?.bg ?? (isDark ? "#0E0F11" : "#F6F7F4");
  const text = colors?.textOnDark ?? (isDark ? "#F2F3F4" : "#111214");
  const sub = colors?.muted ?? (isDark ? "rgba(242,243,244,0.72)" : "rgba(17,18,20,0.62)");
  const border = colors?.border ?? (isDark ? "rgba(255,255,255,0.10)" : "rgba(17,18,20,0.08)");
  const accent = colors?.accent ?? "#2F6F4E";

  const card = isDark ? "rgba(21,24,27,0.72)" : "rgba(255,255,255,0.88)";
  const soft = isDark ? "rgba(47,111,78,0.18)" : "rgba(47,111,78,0.12)";
  const soft2 = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)";

  return StyleSheet.create({
    _sub: { color: sub },

    root: { flex: 1, backgroundColor: bg },
    container: { paddingHorizontal: 16, paddingTop: 14 },

    bgBase: { flex: 1, backgroundColor: isDark ? "#0F1113" : "#FFFFFF" },
    bgLeaves: {
      ...StyleSheet.absoluteFillObject,
      opacity: isDark ? 0.08 : 0.1,
      transform: [{ scale: 1.08 }],
    },
    bgOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: isDark
        ? "rgba(0,0,0,0.16)"
        : "rgba(255,255,255,0.18)",
    },

    header: {
      borderRadius: 18,
      padding: 12,
      borderWidth: 1,
      borderColor: border,
      backgroundColor: card,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginBottom: 10,
    },
    headerIcon: {
      width: 40,
      height: 40,
      borderRadius: 16,
      backgroundColor: soft2,
      borderWidth: 1,
      borderColor: border,
      alignItems: "center",
      justifyContent: "center",
    },

    h1: {
      fontSize: 20,
      color: text,
      fontFamily: "Nunito_800ExtraBold",
    },
    sub: {
      marginTop: 4,
      fontSize: 12,
      color: sub,
      fontFamily: "Manrope_600SemiBold",
    },

    list: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: border,
      backgroundColor: card,
      overflow: "hidden",
    },

    row: {
      paddingHorizontal: 12,
      paddingVertical: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderTopWidth: 1,
      borderTopColor: border,
    },
    rowFirst: { borderTopWidth: 0 },
    rowActive: { backgroundColor: soft },

    left: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      flex: 1,
    },

    iconWrap: {
      width: 34,
      height: 34,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: border,
      backgroundColor: soft2,
      alignItems: "center",
      justifyContent: "center",
    },
    iconWrapActive: {
      borderColor: accent,
      backgroundColor: soft,
    },

    label: {
      fontSize: 14,
      color: text,
      fontFamily: "Manrope_700Bold",
    },

    dot: {
      width: 22,
      height: 22,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: border,
      backgroundColor: soft2,
      alignItems: "center",
      justifyContent: "center",
    },
    dotActive: {
      borderColor: accent,
      backgroundColor: soft,
    },
    dotInner: {
      width: 10,
      height: 10,
      borderRadius: 999,
      backgroundColor: accent,
    },

    tip: {
      marginTop: 10,
      borderRadius: 18,
      padding: 12,
      borderWidth: 1,
      borderColor: border,
      backgroundColor: card,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    tipText: {
      flex: 1,
      fontSize: 12,
      color: sub,
      fontFamily: "Manrope_600SemiBold",
    },
  });
}