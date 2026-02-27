import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Image, ImageBackground, StyleSheet, Text, View } from "react-native";
import { useAppTheme } from "../lib/theme";

type Props = { visible: boolean };

export default function LaunchOverlay({ visible }: Props) {
  const { colors } = useAppTheme() as any;

  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;
  const pandaBob = useRef(new Animated.Value(0)).current;

  const styles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    if (!visible) return;

    opacity.setValue(0);
    translateY.setValue(8);
    pandaBob.setValue(0);

    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 520, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 520, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pandaBob, { toValue: -4, duration: 900, useNativeDriver: true }),
        Animated.timing(pandaBob, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, [visible, opacity, translateY, pandaBob]);

  if (!visible) return null;

  return (
    <View style={styles.wrap} pointerEvents="none">
      <ImageBackground source={require("../../assets/splash.png")} style={styles.bg} resizeMode="cover">
        <View style={styles.dimmer} />
        <Animated.View style={[styles.center, { opacity, transform: [{ translateY }] }]}>
          <Text style={styles.title}>EcoLife</Text>
          <Text style={styles.subtitle}>Growing a greener future</Text>
        </Animated.View>
        <Animated.View style={[styles.pandaWrap, { opacity, transform: [{ translateY: pandaBob }] }]}>
          <Image source={require("../../assets/panda-mark.png")} style={styles.panda} />
        </Animated.View>
      </ImageBackground>
    </View>
  );
}

function createStyles(colors: any) {
  return StyleSheet.create({
    wrap: { ...StyleSheet.absoluteFillObject, backgroundColor: "#0E1F17" },
    bg: { flex: 1, alignItems: "center", justifyContent: "center" },
    dimmer: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(14,31,23,0.35)" },
    center: { alignItems: "center", paddingHorizontal: 24 },
    title: { fontSize: 44, fontWeight: "800", letterSpacing: 0.5, color: colors?.text ?? "#EAF6EF" },
    subtitle: { marginTop: 10, fontSize: 14, letterSpacing: 1.2, textTransform: "uppercase", color: colors?.mutedText ?? "#B8D3C5", opacity: 0.95 },
    pandaWrap: { position: "absolute", bottom: 48 },
    panda: { width: 92, height: 92, resizeMode: "contain" },
  });
} 