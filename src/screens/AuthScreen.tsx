import React, { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View, Platform } from "react-native";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";

WebBrowser.maybeCompleteAuthSession();

type Lang = "ua" | "en";

const AUTH_LANG_KEY = "auth_lang_v1";

const dict = {
  ua: {
    title: "Твій EcoLife.",
    subtitle: "Увійдіть через Google, щоб зберігати прогрес",
    button: "Продовжити з Google",
    error: "Помилка входу",
    tag: "Крок за кроком",
    langBtn: "ENG 🇬🇧",
  },
  en: {
    title: "Your EcoLife.",
    subtitle: "Sign in with Google to keep your progress",
    button: "Continue with Google",
    error: "Sign-in error",
    tag: "Step by step",
    langBtn: "UKR 🇺🇦",
  },
} as const;

export default function AuthScreen() {
  const [lang, setLang] = useState<Lang>("ua");
  const [busy, setBusy] = useState(false);

  const t = dict[lang];
  const redirectTo = useMemo(() => Linking.createURL("auth-callback"), []);

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem(AUTH_LANG_KEY);
      if (saved === "en" || saved === "ua") setLang(saved);
    })();
  }, []);

  const toggleLang = async () => {
    const next: Lang = lang === "ua" ? "en" : "ua";
    setLang(next);
    await AsyncStorage.setItem(AUTH_LANG_KEY, next);
  };

  const signInGoogle = async () => {
    try {
      setBusy(true);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: { prompt: "select_account" },
        } as any,
      });

      if (error) throw error;
      if (!data?.url) throw new Error("No OAuth URL");

      await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    } catch (e: any) {
      Alert.alert(t.error, e?.message ?? "OAuth failed");
    } finally {
      WebBrowser.dismissBrowser();
      setBusy(false);
    }
  };

  return (
    <LinearGradient
      colors={["#E9FFF1", "#F4FFFB", "#FFFFFF"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.root}
    >
      <View style={styles.blobA} />
      <View style={styles.blobB} />
      <View style={styles.blobC} />

      <View style={styles.topRow}>
        <View style={styles.spacer} />
        <Pressable
          onPress={toggleLang}
          disabled={busy}
          style={({ pressed }) => [
            styles.langBtn,
            pressed && styles.pressed,
            busy && styles.disabled,
          ]}
        >
          <Text style={styles.langText}>{t.langBtn}</Text>
        </Pressable>
      </View>

      <View style={styles.center}>
        <View style={styles.tag}>
          <Ionicons name="leaf-outline" size={14} color="#0B6B44" />
          <Text style={styles.tagText}>{t.tag}</Text>
        </View>

        <Text style={styles.title}>{t.title}</Text>
        <Text style={styles.subtitle}>{t.subtitle}</Text>

        <View style={styles.card}>
          <Pressable
            onPress={signInGoogle}
            disabled={busy}
            style={({ pressed }) => [
              styles.googleBtn,
              pressed && styles.pressed,
              busy && styles.disabled,
            ]}
          >
            <View style={styles.googleLeft}>
              <View style={styles.googleIconWrap}>
                <Ionicons name="logo-google" size={18} color="#0B6B44" />
              </View>
              <Text style={styles.googleText}>{t.button}</Text>
            </View>

            <View style={styles.chevWrap}>
              <Ionicons name="arrow-forward" size={18} color="#0F172A" />
            </View>
          </Pressable>

          <Text style={styles.small}>
            {lang === "ua" ? "Швидко. Без пароля." : "Fast. No password."}
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingTop: Platform.OS === "ios" ? 54 : 28,
    paddingHorizontal: 18,
    overflow: "hidden",
  },

  blobA: {
    position: "absolute",
    width: 360,
    height: 360,
    borderRadius: 360,
    left: -160,
    top: -140,
    backgroundColor: "rgba(16, 185, 129, 0.20)",
  },
  blobB: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 300,
    right: -140,
    top: 80,
    backgroundColor: "rgba(34, 197, 94, 0.14)",
  },
  blobC: {
    position: "absolute",
    width: 460,
    height: 460,
    borderRadius: 460,
    left: -220,
    bottom: -260,
    backgroundColor: "rgba(59, 130, 246, 0.06)",
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  spacer: { flex: 1 },

  langBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "rgba(219, 234, 254, 0.75)",
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.18)",
  },
  langText: {
    fontWeight: "900",
    fontSize: 12,
    color: "rgba(15, 23, 42, 0.85)",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 14,
    paddingBottom: 24,
  },

  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(6, 78, 59, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(6, 78, 59, 0.10)",
  },
  tagText: {
    fontWeight: "900",
    fontSize: 12,
    color: "#0B6B44",
    letterSpacing: 0.2,
  },

  title: {
    fontSize: 34,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.8,
    textAlign: "center",
  },

  subtitle: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "700",
    color: "rgba(15, 23, 42, 0.70)",
    lineHeight: 20,
    maxWidth: 320,
  },

  card: {
    marginTop: 12,
    width: "100%",
    maxWidth: 420,
    padding: 16,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.86)",
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.06)",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 14 },
    elevation: 3,
    gap: 10,
  },

  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "rgba(187, 247, 208, 0.55)",
  },

  googleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  googleIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: "rgba(16, 185, 129, 0.14)",
    alignItems: "center",
    justifyContent: "center",
  },

  googleText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0F172A",
  },

  chevWrap: {
    width: 34,
    height: 34,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.60)",
    alignItems: "center",
    justifyContent: "center",
  },

  small: {
    textAlign: "center",
    fontSize: 12,
    fontWeight: "800",
    color: "rgba(15, 23, 42, 0.55)",
  },

  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.995 }],
  },

  disabled: {
    opacity: 0.6,
  },
});