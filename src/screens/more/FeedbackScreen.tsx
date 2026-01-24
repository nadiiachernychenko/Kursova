import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, Pressable, View } from "react-native";
import { supabase } from "../../lib/supabase";
import { SafeAreaView } from "react-native-safe-area-context";
import { useT } from "../../lib/i18n";

export function FeedbackScreen() {
  const t = useT(); // ✅ ВНУТРИ компонента

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert(t("feedbackFillFieldsTitle"), t("feedbackFillFieldsMsg"));
      return;
    }

    setSending(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      const { error } = await supabase.from("support_tickets").insert({
        user_id: user?.id ?? null,
        subject: subject.trim(),
        message: message.trim(),
        status: "new",
      });

      if (error) throw error;

      setSubject("");
      setMessage("");
      Alert.alert(t("feedbackDoneTitle"), t("feedbackDoneMsg"));
    } catch (e: any) {
      Alert.alert(t("feedbackErrorTitle"), t("feedbackErrorMsg"));
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.h1}>{t("feedbackTitle")}</Text>
        <Text style={styles.sub}>{t("feedbackSub")}</Text>

        <Text style={styles.label}>{t("feedbackSubjectLabel")}</Text>
        <TextInput
          value={subject}
          onChangeText={setSubject}
          placeholder={t("feedbackSubjectPh")}
          placeholderTextColor="rgba(148,163,184,0.6)"
          style={styles.input}
        />

        <Text style={styles.label}>{t("feedbackMessageLabel")}</Text>
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder={t("feedbackMessagePh")}
          placeholderTextColor="rgba(148,163,184,0.6)"
          style={[styles.input, styles.textarea]}
          multiline
        />

        <Pressable style={[styles.btn, sending && { opacity: 0.7 }]} onPress={send} disabled={sending}>
          <Text style={styles.btnText}>{sending ? t("feedbackSending") : t("feedbackSend")}</Text>
        </Pressable>

        <View style={{ height: 10 }} />
        <Text style={styles.note}>{t("feedbackNote")}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#07101f" },
  container: { padding: 16, paddingBottom: 24 },
  h1: { color: "#e2e8f0", fontSize: 22, fontWeight: "900" },
  sub: { color: "#94a3b8", marginTop: 6, marginBottom: 18 },
  label: { color: "#cbd5e1", fontWeight: "800", marginBottom: 8, marginTop: 10 },
  input: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#e2e8f0",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.16)",
  },
  textarea: { minHeight: 140, textAlignVertical: "top" },
  btn: {
    marginTop: 16,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#7dd3fc",
  },
  btnText: { color: "#0f172a", fontWeight: "900" },
  note: { color: "rgba(148,163,184,0.75)", lineHeight: 18 },
});
