import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useEduProfile } from "../lib/useEduProfile";

export default function ExpertGate({
  children,
  title = "Доступ лише для Eco-експерт",
  subtitle = "Відкрий Eco-експерт у «Центрі доступу».",
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}) {
  const nav = useNavigation<any>();
  const { expertUnlocked } = useEduProfile();

  if (expertUnlocked) return <>{children}</>;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.sub}>{subtitle}</Text>

      <Pressable
        onPress={() => nav.navigate("AccessCenter")}
        style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }]}
      >
        <Text style={styles.btnText}>Перейти в Центр доступу</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 10 },
  title: { fontSize: 16, fontWeight: "800" },
  sub: { opacity: 0.75, lineHeight: 18 },
  btn: { marginTop: 6, borderWidth: 1, borderRadius: 14, paddingVertical: 12, alignItems: "center" },
  btnText: { fontWeight: "800" },
});