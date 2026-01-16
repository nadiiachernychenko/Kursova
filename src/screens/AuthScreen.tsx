import React, { useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from "react-native";
import * as Linking from "expo-linking";
import { supabase } from "../lib/supabase";

export default function AuthScreen() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  const redirectTo = useMemo(() => Linking.createURL("auth-callback"), []);

  const sendLink = async () => {
    const clean = email.trim().toLowerCase();
    if (!clean || !clean.includes("@")) {
      Alert.alert("Email", "Введи коректну пошту");
      return;
    }

    try {
      setSending(true);
      console.log("MAGIC LINK redirectTo =", redirectTo);

      const { error } = await supabase.auth.signInWithOtp({
        email: clean,
        options: {
          emailRedirectTo: redirectTo,
          redirectTo: redirectTo as any, // на всяк випадок
        } as any,
      });

      if (error) throw error;

      Alert.alert("Готово ✅", "Ми надіслали magic link. Відкрий лист і натисни Log in.");
    } catch (e: any) {
      Alert.alert("Помилка", e?.message ?? "Не вдалося надіслати посилання");
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🐼 Вхід</Text>

      <Text style={styles.hint}>Redirect URL (додай у Supabase):</Text>
      <Text style={styles.mono}>{redirectTo}</Text>

      <Text style={styles.label}>Email</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        placeholder="name@gmail.com"
        style={styles.input}
      />

      <Pressable
        onPress={sendLink}
        disabled={sending}
        style={({ pressed }) => [styles.btn, pressed && { opacity: 0.9 }, sending && { opacity: 0.6 }]}
      >
        <Text style={styles.btnText}>{sending ? "Надсилаємо…" : "Надіслати посилання"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 18, backgroundColor: "#fff", gap: 12, justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "900" },
  label: { fontSize: 12, fontWeight: "800", opacity: 0.8 },
  input: { borderWidth: 1, borderColor: "rgba(0,0,0,0.15)", borderRadius: 14, paddingHorizontal: 12, paddingVertical: 12 },
  hint: { fontSize: 12, opacity: 0.65 },
  mono: { fontSize: 12, fontFamily: "monospace", opacity: 0.85 },
  btn: { marginTop: 10, paddingVertical: 12, borderRadius: 16, borderWidth: 1, alignItems: "center" },
  btnText: { fontWeight: "900" },
});
