import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { SortStackParamList } from "../navigation/SortStack";
import { askEcoAssistant } from "../lib/ecoAssistant";
import { addToSortHistory } from "../lib/sortHistory";
import { supabase } from "../lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";

type R = RouteProp<SortStackParamList, "Assistant">;

function getProjectRef(url?: string) {
  if (!url) return null;
  const m = url.match(/^https:\/\/([a-z0-9-]+)\.supabase\.co/i);
  return m?.[1] ?? null;
}

async function hardResetSupabaseSession() {
  try {
    await supabase.auth.signOut();
  } catch {}

  try {
    const keys = await AsyncStorage.getAllKeys();
    const ref = getProjectRef(process.env.EXPO_PUBLIC_SUPABASE_URL) ?? "";
    const authKeys = keys.filter(
      (k) =>
        k.includes("sb-") &&
        k.includes("-auth-token") &&
        (ref ? k.includes(ref) : true)
    );
    if (authKeys.length) await AsyncStorage.multiRemove(authKeys);
  } catch {}
}

export default function SortAssistantScreen() {
  const route = useRoute<R>();
  const [q, setQ] = useState(route.params?.initialQuery ?? "");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [sessionState, setSessionState] = useState<"yes" | "no" | "unknown">("unknown");

  const ref = useMemo(() => getProjectRef(process.env.EXPO_PUBLIC_SUPABASE_URL), []);

  useEffect(() => {
    if (route.params?.initialQuery) setQ(route.params.initialQuery);
  }, [route.params?.initialQuery]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSessionState(data.session ? "yes" : "no");
    });
  }, []);

  const resetSession = async () => {
    setErr(null);
    setAnswer(null);
    await hardResetSupabaseSession();
    const s = await supabase.auth.getSession();
    setSessionState(s.data.session ? "yes" : "no");
    setErr("Сесію очищено. Зайди в акаунт ще раз і повтори запит.");
  };

  const submit = async () => {
    const query = q.trim();
    if (!query || loading) return;

    Keyboard.dismiss();
    setLoading(true);
    setErr(null);
    setAnswer(null);

    try {
      await addToSortHistory(query);
      const res = await askEcoAssistant(query);
      setAnswer(res.answer);
    } catch (e: any) {
      const msg = String(e?.message ?? e);
      if (msg.includes("NO_SESSION")) setErr("Потрібно увійти в акаунт, щоб користуватись AI.");
      else if (msg.includes("Invalid JWT") || msg.includes("invalid jwt")) {
        setErr("Invalid JWT. Натисни «Скинути сесію», потім зайди в акаунт знову.");
      } else setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.top}>
        <Text style={styles.h1}>Запитай про сортування</Text>
        <Text style={styles.sub}>AI відповідає про утилізацію та сортування</Text>

        <View style={styles.debug}>
          <Text style={styles.debugText}>Project: {ref ?? "?"}</Text>
          <Text style={styles.debugText}>Session: {sessionState}</Text>
          <Pressable style={styles.resetBtn} onPress={resetSession}>
            <Text style={styles.resetTxt}>Скинути сесію</Text>
          </Pressable>
        </View>

        <View style={styles.box}>
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Наприклад: куди викидати батарейки?"
            placeholderTextColor="#9AA3AF"
            style={styles.input}
            multiline
          />
          <Pressable style={styles.btn} onPress={submit} disabled={loading}>
            <Text style={styles.btnTxt}>{loading ? "..." : "Надіслати"}</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        {loading && (
          <View style={styles.center}>
            <ActivityIndicator />
            <Text style={styles.muted}>Думаю…</Text>
          </View>
        )}

        {!!err && (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Помилка</Text>
            <Text style={styles.errorText}>{err}</Text>
          </View>
        )}

        {!!answer && (
          <View style={styles.answerCard}>
            <Text style={styles.answerTitle}>Відповідь</Text>
            <Text style={styles.answerText}>{answer}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0B1220" },
  top: { padding: 16, gap: 6 },
  h1: { color: "#F9FAFB", fontSize: 20, fontWeight: "800" },
  sub: { color: "#A7B0BE" },

  debug: {
    marginTop: 10,
    backgroundColor: "#0F1A2E",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1F2A44",
    padding: 12,
    gap: 8,
  },
  debugText: { color: "#A7B0BE", fontSize: 12 },
  resetBtn: {
    alignSelf: "flex-start",
    backgroundColor: "#111C33",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1F2A44",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  resetTxt: { color: "#E5E7EB", fontWeight: "900" },

  box: {
    marginTop: 10,
    backgroundColor: "#0F1A2E",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1F2A44",
    padding: 12,
    gap: 10,
  },
  input: { minHeight: 96, color: "#F9FAFB", fontSize: 14 },
  btn: { backgroundColor: "#1D4ED8", paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  btnTxt: { color: "#FFFFFF", fontWeight: "800" },

  body: { flex: 1 },
  bodyContent: { padding: 16, gap: 12 },
  center: { gap: 8, alignItems: "center", paddingVertical: 20 },
  muted: { color: "#A7B0BE" },

  answerCard: { backgroundColor: "#0F1A2E", borderRadius: 16, borderWidth: 1, borderColor: "#1F2A44", padding: 14, gap: 8 },
  answerTitle: { color: "#F9FAFB", fontWeight: "900" },
  answerText: { color: "#D1D5DB", lineHeight: 20 },

  errorCard: { backgroundColor: "#2A1220", borderRadius: 16, borderWidth: 1, borderColor: "#7F1D1D", padding: 14, gap: 6 },
  errorTitle: { color: "#FEE2E2", fontWeight: "900" },
  errorText: { color: "#FCA5A5" },
});