import React from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Linking } from "react-native";
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

  const openEmail = () => Linking.openURL(`mailto:${supportEmail}?subject=EcoLife%20Support`);
  const openPhone = () => Linking.openURL(`tel:${hotlinePhone.replace(/\s/g, "")}`);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      {/* backdrop */}
      <Pressable
        onPress={onClose}
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" }}
      >
        {/* sheet */}
        <Pressable
          onPress={() => {}}
          style={{
            backgroundColor: "#0b1220",
            borderTopLeftRadius: 18,
            borderTopRightRadius: 18,
            padding: 16,
            paddingBottom: 22,
          }}
        >
          {/* handle */}
          <View
            style={{
              alignSelf: "center",
              width: 60,
              height: 5,
              borderRadius: 999,
              backgroundColor: "rgba(148,163,184,0.55)",
              marginBottom: 12,
            }}
          />

          <Text style={{ color: "#e2e8f0", fontSize: 22, fontWeight: "800" }}>{t("supportTitle")}</Text>
          <Text style={{ color: "#94a3b8", marginTop: 6, marginBottom: 14 }}>{t("supportCaption")}</Text>

          <Pressable
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              paddingVertical: 14,
              paddingHorizontal: 14,
              borderRadius: 16,
              backgroundColor: "#7dd3fc",
              marginBottom: 10,
            }}
            onPress={onOpenFeedback}
          >
            <Ionicons name="chatbubbles" size={18} color="#0f172a" />
            <Text style={{ color: "#0f172a", fontSize: 14, fontWeight: "700" }}>{t("supportFeedbackForm")}</Text>
          </Pressable>

          <Pressable
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              paddingVertical: 14,
              paddingHorizontal: 14,
              borderRadius: 16,
              backgroundColor: "rgba(255,255,255,0.06)",
              marginBottom: 10,
            }}
            onPress={openEmail}
          >
            <Ionicons name="mail" size={18} color="#e2e8f0" />
            <Text style={{ color: "#e2e8f0", fontSize: 14, fontWeight: "700" }}>{t("supportEmailLabel")}</Text>
            <Text style={{ marginLeft: "auto", color: "#94a3b8", fontSize: 12 }}>{supportEmail}</Text>
          </Pressable>

          <Pressable
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              paddingVertical: 14,
              paddingHorizontal: 14,
              borderRadius: 16,
              backgroundColor: "rgba(255,255,255,0.06)",
              marginBottom: 10,
            }}
            onPress={openPhone}
          >
            <Ionicons name="call" size={18} color="#e2e8f0" />
            <Text style={{ color: "#e2e8f0", fontSize: 14, fontWeight: "700" }}>{t("supportHotlineLabel")}</Text>
            <Text style={{ marginLeft: "auto", color: "#94a3b8", fontSize: 12 }}>{hotlinePhone}</Text>
          </Pressable>

          <Pressable
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              paddingVertical: 12,
              paddingHorizontal: 14,
              borderRadius: 16,
              backgroundColor: "rgba(255,255,255,0.04)",
              marginTop: 4,
            }}
            onPress={onOpenFaq}
          >
            <Ionicons name="help-circle" size={18} color="#e2e8f0" />
            <Text style={{ color: "#e2e8f0", fontSize: 14, fontWeight: "700" }}>{t("supportFaq")}</Text>
          </Pressable>

          <Pressable style={{ marginTop: 10, alignItems: "center", paddingVertical: 10 }} onPress={onClose}>
            <Text style={{ color: "#94a3b8", fontWeight: "700" }}>{t("supportClose")}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
