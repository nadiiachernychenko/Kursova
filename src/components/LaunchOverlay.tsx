import React, { useEffect, useMemo, useRef } from "react";
import { Animated, ImageBackground, StyleSheet, Text, View } from "react-native";
import { useAppTheme } from "../lib/theme";

type Props = { visible: boolean };

export default function LaunchOverlay({ visible }: Props) {
  const { colors } = useAppTheme() as any;

  const opacity = useRef(new Animated.Value(0)).current;
  const pandaBob = useRef(new Animated.Value(0)).current;

  const styles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    if (!visible) return;

    opacity.setValue(0);
    pandaBob.setValue(0);

    Animated.timing(opacity, {
      toValue: 1,
      duration: 520,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pandaBob, { toValue: -4, duration: 900, useNativeDriver: true }),
        Animated.timing(pandaBob, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, [visible, opacity, pandaBob]);

  if (!visible) return null;

  return (
    <View style={styles.wrap} pointerEvents="none">
      <ImageBackground
        source={require("../../assets/splash.png")}
        style={styles.bg}
        resizeMode="cover"
      >
        <View style={styles.dimmer} />

        <Animated.View style={[styles.sloganWrap, { opacity }]}>
          <Text style={styles.subtitle}>Growing a greener future</Text>
        </Animated.View>
      </ImageBackground>
    </View>
  );
}

function createStyles(colors: any) {
  return StyleSheet.create({
    wrap: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "#0E1F17",
    },
    bg: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    dimmer: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(14,31,23,0.25)",
    },
    sloganWrap: {
      position: "absolute",
      bottom: 180,
      alignItems: "center",
    },
    subtitle: {
      fontSize: 14,
      letterSpacing: 1.4,
      textTransform: "uppercase",
      color: colors?.text ?? "#EAF6EF",
      opacity: 0.9,
    },
  });
} 