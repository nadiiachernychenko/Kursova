import React, { useMemo } from "react";
import { View, Text, StyleSheet, Pressable, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppTheme } from "../lib/theme";

type Props = {
  title?: string;
  showTitle?: boolean;  
  offsetY?: number;      
};

const FONTS = {
  strong: "Manrope_700Bold",
} as const;

export default function AppTopBar({ title, showTitle = true, offsetY = 0 }: Props) {
  const navigation = useNavigation<any>();
  const { colors, isDark } = useAppTheme() as any;

  const PAL = useMemo(() => {
    const accent = "#2F6F4E";
    const text = colors?.text ?? (isDark ? "#F2F3F4" : "#111214");
    const line = colors?.border ?? (isDark ? "rgba(242,243,244,0.10)" : "rgba(17,18,20,0.08)");
    return {
      accent,
      text,
      line,
      btnBg: isDark ? "rgba(47,111,78,0.22)" : "rgba(47,111,78,0.14)",
      btnBorder: isDark ? "rgba(47,111,78,0.55)" : "rgba(47,111,78,0.35)",
    };
  }, [colors, isDark]);

  const styles = useMemo(() => createStyles(PAL), [PAL]);

  return (
  <View style={[styles.topBar, { top: offsetY }]}>
    <SafeAreaView edges={["top"]}>
      <View style={styles.topBarInner}>
        {showTitle ? (
          <Text style={styles.topBarTitle} numberOfLines={1}>
            {title ?? ""}
          </Text>
        ) : (
          <View style={{ width: 1, height: 1 }} />
        )}

        <Pressable
          onPress={() => navigation.navigate("More")}
          hitSlop={10}
          style={({ pressed }) => [
            styles.menuBtn,
            {
              opacity: pressed ? 0.75 : 1,
              backgroundColor: PAL.btnBg,
              borderColor: PAL.btnBorder,
            },
          ]}
        >
          <Ionicons name="menu-outline" size={24} color={PAL.accent} />
        </Pressable>
      </View>
    </SafeAreaView>
  </View>
);
}

function createStyles(PAL: any) {
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

  return StyleSheet.create({
    topBar: {
      position: "absolute",
      left: 0,
      right: 0,
      top: 0,
      zIndex: 1000,
    },
    topBarInner: {
      paddingHorizontal: 14,
      paddingTop: 8,
      paddingBottom: 10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    topBarTitle: {
      fontSize: 14,
      color: PAL.text,
      opacity: 0.9,
      fontFamily: FONTS.strong,
    },
    menuBtn: {
      width: 44,
      height: 44,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      ...shadow,
    },
  });
}