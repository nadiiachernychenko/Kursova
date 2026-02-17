import React from "react";
import { Modal, Pressable, Text, View, StyleSheet, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useT } from "../lib/i18n";

type Props = {
  visible: boolean;
  onClose: () => void;
  onOpenFaq: () => void;
  onOpenFeedback: () => void;
  supportEmail: string;
  hotlinePhone: string;
};

export function SupportSheet({
  visible,
  onClose,
  onOpenFaq,
  onOpenFeedback,
  supportEmail,
  hotlinePhone,
}: Props) {
  const t = useT();

  if (!visible) return null;

  const openEmail = () => Linking.openURL(`mailto:${supportEmail}?subject=EcoLife%20Support`);
  const openPhone = () => Linking.openURL(`tel:${hotlinePhone.replace(/\s/g, "")}`);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.wrap} pointerEvents="box-none">
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <Text style={styles.title}>{t("supportTitle")}</Text>
          <Text style={styles.caption}>{t("supportCaption")}</Text>

          <Pressable style={[styles.btn, styles.btnPrimary]} onPress={onOpenFeedback}>
            <Ionicons name="chatbubbles" size={18} color="#0f172a" />
            <Text style={[styles.btnText, styles.btnTextDark]}>{t("supportFeedbackForm")}</Text>
          </Pressable>

          <Pressable style={styles.btn} onPress={openEmail}>
            <Ionicons name="mail" size={18} color="#e2e8f0" />
            <Text style={styles.btnText}>{t("supportEmailLabel")}</Text>
            <Text style={styles.right}>{supportEmail}</Text>
          </Pressable>

          <Pressable style={styles.btn} onPress={openPhone}>
            <Ionicons name="call" size={18} color="#e2e8f0" />
            <Text style={styles.btnText}>{t("supportHotlineLabel")}</Text>
            <Text style={styles.right}>{hotlinePhone}</Text>
          </Pressable>

          <Pressable style={styles.btn} onPress={onOpenFaq}>
            <Ionicons name="help-circle" size={18} color="#e2e8f0" />
            <Text style={styles.btnText}>{t("supportFaq")}</Text>
          </Pressable>

          <Pressable style={styles.close} onPress={onClose}>
            <Text style={styles.closeText}>{t("supportClose")}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.55)" },
  wrap: { flex: 1, justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "#0b1220",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 16,
    paddingBottom: 22,
  },
  handle: {
    alignSelf: "center",
    width: 60,
    height: 5,
    borderRadius: 999,
    backgroundColor: "rgba(148,163,184,0.55)",
    marginBottom: 12,
  },
  title: { color: "#e2e8f0", fontSize: 22, fontWeight: "800" },
  caption: { color: "#94a3b8", marginTop: 6, marginBottom: 14, fontWeight: "600" },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginBottom: 10,
  },
  btnPrimary: { backgroundColor: "#7dd3fc" },
  btnText: { color: "#e2e8f0", fontSize: 14, fontWeight: "700" },
  btnTextDark: { color: "#0f172a" },
  right: { marginLeft: "auto", color: "#94a3b8", fontSize: 12, fontWeight: "600" },
  close: { marginTop: 2, alignItems: "center", paddingVertical: 10 },
  closeText: { color: "#94a3b8", fontWeight: "700" },
});
