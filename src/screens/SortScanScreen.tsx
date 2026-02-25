import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
  Keyboard,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useIsFocused } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { CameraView, useCameraPermissions, BarcodeScanningResult } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { askEcoAssistant } from "../lib/ecoAssistant";
import { addToSortHistory } from "../lib/sortHistory";
import { useAppTheme } from "../lib/theme";

type Step = "scan" | "compose" | "loading" | "result";

function stripMdLike(text: string) {
  return String(text || "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/#{1,6}\s?/g, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .trim();
}

export default function SortScanScreen() {
  const { colors, isDark } = useAppTheme() as any;
  const isFocused = useIsFocused();
  const [permission, requestPermission] = useCameraPermissions();

  const [step, setStep] = useState<Step>("scan");
  const [camKey, setCamKey] = useState(1);

  const [barcode, setBarcode] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [clarify, setClarify] = useState("");

  const [needClarify, setNeedClarify] = useState(false);

  const [productLine, setProductLine] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const canUse = permission?.granted === true;

  const bgA = colors?.bg ?? "#0B1220";
  const bgB = (colors?.card ?? "#0F1A2E") as string;
  const card = colors?.card ?? "#0F1A2E";
  const border = colors?.border ?? "#1F2A44";
  const text = colors?.textOnDark ?? "#F9FAFB";
  const muted = colors?.muted ?? "#A7B0BE";
  const accent = colors?.accent ?? "#1D4ED8";

  const topH = 120;
  const panelMin = 260;

  const headerTitle = useMemo(() => {
    if (step === "loading") return "Шукаю…";
    if (step === "result") return "Готово";
    return "Скануй";
  }, [step]);

  const onBarcodeScanned = (r: BarcodeScanningResult) => {
    if (barcode) return;
    if (!r?.data) return;
    const b = String(r.data).trim();
    if (!b) return;
    setBarcode(b);
    setNeedClarify(false);
    setErr(null);
    setProductLine(null);
    setAnswer(null);
    setClarify("");
    setStep("compose");
  };

  const resetAll = () => {
    setErr(null);
    setAnswer(null);
    setProductLine(null);
    setNeedClarify(false);
    setNote("");
    setClarify("");
    setBarcode(null);
    setStep("scan");
    setCamKey((x) => x + 1);
  };

  const submitFind = async () => {
    if (!barcode) return;

    Keyboard.dismiss();
    setErr(null);
    setAnswer(null);
    setProductLine(null);
    setNeedClarify(false);
    setStep("loading");

    try {
      await addToSortHistory(`Штрихкод: ${barcode}`);

      const res = await askEcoAssistant({
        barcode,
        query: note.trim() || undefined,
      });

      const prod = res?.product;
      const resolved = !!res?.resolved;

      if (prod && (prod.title || prod.brand)) {
        const parts = [prod.title, prod.brand].filter(Boolean);
        const src = prod.source ? ` · ${prod.source}` : "";
        setProductLine(`${parts.join(" — ")}${src}`);
      } else {
        setProductLine(null);
      }

      const a = stripMdLike(res?.answer ?? "");

      if (resolved) {
        setAnswer(a);
        setNeedClarify(false);
        setStep("result");
      } else {
        setNeedClarify(true);
        setStep("compose");
      }
    } catch (e: any) {
      setErr(String(e?.message ?? e));
      setStep("compose");
    }
  };

  const submitExplain = async () => {
    if (!barcode) return;
    const w = clarify.trim();
    if (!w) return;

    Keyboard.dismiss();
    setErr(null);
    setAnswer(null);
    setProductLine(null);
    setStep("loading");

    try {
      const res = await askEcoAssistant({
        barcode,
        query: note.trim() || undefined,
        hint: w,
      });

      const prod = res?.product;
      if (prod && (prod.title || prod.brand)) {
        const parts = [prod.title, prod.brand].filter(Boolean);
        const src = prod.source ? ` · ${prod.source}` : "";
        setProductLine(`${parts.join(" — ")}${src}`);
      } else {
        setProductLine(null);
      }

      setAnswer(stripMdLike(res?.answer ?? ""));
      setNeedClarify(false);
      setStep("result");
    } catch (e: any) {
      setErr(String(e?.message ?? e));
      setStep("compose");
    }
  };

  if (!permission) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: bgA }]} edges={["top", "bottom"]}>
        <View style={[styles.centerCard, { backgroundColor: card, borderColor: border }]}>
          <Text style={[styles.h1, { color: text }]}>Камера</Text>
          <Text style={[styles.sub, { color: muted }]}>Потрібен дозвіл</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!canUse) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: bgA }]} edges={["top", "bottom"]}>
        <LinearGradient colors={[bgA, bgB]} style={StyleSheet.absoluteFillObject} />
        <View style={[styles.centerCard, { backgroundColor: card, borderColor: border }]}>
          <Text style={[styles.h1, { color: text }]}>Доступ до камери</Text>
          <Text style={[styles.sub, { color: muted }]}>Дозволь камеру, щоб сканувати штрихкоди</Text>
          <Pressable style={[styles.primaryBtn, { backgroundColor: accent }]} onPress={requestPermission}>
            <Text style={styles.primaryTxt}>Дозволити</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bgA }]} edges={["top", "bottom"]}>
      <LinearGradient colors={[bgA, bgB]} style={StyleSheet.absoluteFillObject} />

      <View style={[styles.header, { borderBottomColor: border }]}>
        <Text style={[styles.headerTitle, { color: text }]}>{headerTitle}</Text>
        <Pressable style={[styles.headerPill, { backgroundColor: card, borderColor: border }]} onPress={resetAll}>
          <Ionicons name="refresh" size={16} color={text} />
          <Text style={[styles.headerPillTxt, { color: text }]}>Перезапустити</Text>
        </Pressable>
      </View>

      <View style={styles.body}>
        <View style={styles.cameraWrap}>
          <CameraView
            key={camKey}
            style={styles.camera}
            facing="back"
            active={isFocused && step !== "result"}
            onBarcodeScanned={step === "scan" ? onBarcodeScanned : undefined}
            barcodeScannerSettings={{ barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "code128", "code39", "qr"] }}
          />

          <View style={[styles.topOverlay, { backgroundColor: isDark ? "rgba(15,26,46,0.80)" : "rgba(255,255,255,0.88)", borderColor: border }]}>
            <View style={styles.topOverlayLeft}>
              <Ionicons name="scan-outline" size={18} color={isDark ? "#E5E7EB" : "#111827"} />
              <Text style={[styles.topOverlayTitle, { color: isDark ? "#F9FAFB" : "#111827" }]}>
                {barcode ? "Штрихкод знайдено" : "Наведи на штрихкод"}
              </Text>
            </View>

            {barcode ? (
              <View style={[styles.codePill, { backgroundColor: isDark ? "rgba(17,28,51,0.7)" : "rgba(243,244,246,0.9)", borderColor: border }]}>
                <Text style={[styles.codeTxt, { color: isDark ? "#E5E7EB" : "#111827" }]} numberOfLines={1}>
                  {barcode}
                </Text>
              </View>
            ) : (
              <View style={styles.dotRow}>
                <View style={[styles.dot, { backgroundColor: isDark ? "rgba(255,255,255,0.55)" : "rgba(17,24,39,0.3)" }]} />
                <View style={[styles.dot, { backgroundColor: isDark ? "rgba(255,255,255,0.35)" : "rgba(17,24,39,0.2)" }]} />
                <View style={[styles.dot, { backgroundColor: isDark ? "rgba(255,255,255,0.2)" : "rgba(17,24,39,0.12)" }]} />
              </View>
            )}
          </View>

          <View style={[styles.scanFrame, { borderColor: "rgba(255,255,255,0.22)" }]} />
        </View>

        <KeyboardAvoidingView
          style={styles.panelKA}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? topH : 0}
        >
          <View style={[styles.panel, { backgroundColor: card, borderColor: border }]}>
            {step === "loading" ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator />
                <Text style={[styles.loadingTxt, { color: muted }]}>Шукаю інформацію по базах…</Text>
              </View>
            ) : step === "result" ? (
              <ScrollView style={styles.resultScroll} contentContainerStyle={styles.resultContent} keyboardShouldPersistTaps="handled">
                {!!barcode && <Text style={[styles.meta, { color: muted }]}>Штрихкод: {barcode}</Text>}

                {!!productLine && (
                  <View style={[styles.productCard, { backgroundColor: bgA, borderColor: border }]}>
                    <Text style={[styles.productTitle, { color: text }]}>Знайдено</Text>
                    <Text style={[styles.productText, { color: muted }]}>{productLine}</Text>
                  </View>
                )}

                <View style={[styles.answerCard, { backgroundColor: bgA, borderColor: border }]}>
                  <Text style={[styles.answerText, { color: isDark ? "#D1D5DB" : "#111827" }]}>{answer ?? ""}</Text>
                </View>

                {!!err && (
                  <View style={styles.errorCard}>
                    <Text style={styles.errorTitle}>Помилка</Text>
                    <Text style={styles.errorText}>{err}</Text>
                  </View>
                )}

                <Pressable style={[styles.primaryBtn, { backgroundColor: accent }]} onPress={resetAll}>
                  <Text style={styles.primaryTxt}>Сканувати ще раз</Text>
                </Pressable>
              </ScrollView>
            ) : (
              <ScrollView
                style={styles.composeScroll}
                contentContainerStyle={[styles.composeContent, { minHeight: panelMin }]}
                keyboardShouldPersistTaps="handled"
              >
                {!barcode ? (
                  <View style={styles.emptyCompose}>
                    <Text style={[styles.composeTitle, { color: text }]}>Готова сканувати</Text>
                    <Text style={[styles.composeSub, { color: muted }]}>Наведи камеру на штрихкод — і я спробую знайти товар.</Text>
                  </View>
                ) : (
                  <>
                    {!needClarify ? (
                      <>
                        <Text style={[styles.composeTitle, { color: text }]}>Додай деталь (необовʼязково)</Text>
                        <Text style={[styles.composeSub, { color: muted }]}>
                          Наприклад: “крем для рук”, “пластикова упаковка”.
                        </Text>

                        <TextInput
                          value={note}
                          onChangeText={setNote}
                          placeholder="Короткий коментар (необовʼязково)"
                          placeholderTextColor={isDark ? "#9AA3AF" : "#6B7280"}
                          style={[styles.input, { backgroundColor: bgA, borderColor: border, color: text }]}
                          multiline
                        />

                        {!!err && (
                          <View style={styles.errorCard}>
                            <Text style={styles.errorTitle}>Помилка</Text>
                            <Text style={styles.errorText}>{err}</Text>
                          </View>
                        )}

                        <View style={styles.row}>
                          <Pressable style={[styles.secondaryBtn, { backgroundColor: bgA, borderColor: border }]} onPress={resetAll}>
                            <Text style={[styles.secondaryTxt, { color: text }]}>Сканувати знову</Text>
                          </Pressable>
                          <Pressable style={[styles.primaryBtn, { backgroundColor: accent }]} onPress={submitFind}>
                            <Text style={styles.primaryTxt}>Знайти</Text>
                          </Pressable>
                        </View>
                      </>
                    ) : (
                      <>
                        <Text style={[styles.composeTitle, { color: text }]}>Ми не змогли знайти товар у базах</Text>
                        <Text style={[styles.composeSub, { color: muted }]}>
                          Напиши, що це за предмет або яка упаковка — і я поясню, як правильно утилізувати в Україні.
                        </Text>

                        <TextInput
                          value={clarify}
                          onChangeText={setClarify}
                          placeholder="Наприклад: крем у тюбику з помпою"
                          placeholderTextColor={isDark ? "#9AA3AF" : "#6B7280"}
                          style={[styles.inputBig, { backgroundColor: bgA, borderColor: border, color: text }]}
                          multiline
                        />

                        {!!err && (
                          <View style={styles.errorCard}>
                            <Text style={styles.errorTitle}>Помилка</Text>
                            <Text style={styles.errorText}>{err}</Text>
                          </View>
                        )}

                        <View style={styles.row}>
                          <Pressable style={[styles.secondaryBtn, { backgroundColor: bgA, borderColor: border }]} onPress={() => setNeedClarify(false)}>
                            <Text style={[styles.secondaryTxt, { color: text }]}>Назад</Text>
                          </Pressable>
                          <Pressable
                            style={[styles.primaryBtn, { backgroundColor: accent }, !clarify.trim() && { opacity: 0.6 }]}
                            onPress={submitExplain}
                            disabled={!clarify.trim()}
                          >
                            <Text style={styles.primaryTxt}>Пояснити утилізацію</Text>
                          </Pressable>
                        </View>
                      </>
                    )}
                  </>
                )}
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}

const W = Dimensions.get("window").width;

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  headerTitle: { fontSize: 18, fontWeight: "900" },
  headerPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  headerPillTxt: { fontWeight: "900", fontSize: 12 },

  body: { flex: 1 },
  cameraWrap: { flex: 1, borderRadius: 22, overflow: "hidden", margin: 16, marginBottom: 10 },
  camera: { flex: 1 },

  topOverlay: {
    position: "absolute",
    left: 12,
    right: 12,
    top: 12,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  topOverlayLeft: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  topOverlayTitle: { fontWeight: "900" },
  dotRow: { flexDirection: "row", gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 99 },

  codePill: { maxWidth: Math.min(W - 110, 220), borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  codeTxt: { fontWeight: "900", letterSpacing: 0.6 },

  scanFrame: {
    position: "absolute",
    left: 22,
    right: 22,
    top: 92,
    bottom: 86,
    borderRadius: 22,
    borderWidth: 2,
  },

  panelKA: { paddingHorizontal: 16, paddingBottom: 12 },
  panel: {
    borderRadius: 22,
    borderWidth: 1,
    overflow: "hidden",
    maxHeight: 360,
  },

  loadingRow: { padding: 18, flexDirection: "row", alignItems: "center", gap: 10 },
  loadingTxt: { fontWeight: "800" },

  composeScroll: { maxHeight: 360 },
  composeContent: { padding: 16, gap: 10 },

  composeTitle: { fontSize: 16, fontWeight: "900" },
  composeSub: { fontWeight: "700", lineHeight: 18 },

  input: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 72,
    fontSize: 14,
  },
  inputBig: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 110,
    fontSize: 14,
  },

  row: { flexDirection: "row", gap: 10, marginTop: 2 },

  primaryBtn: { flex: 1, borderRadius: 18, paddingVertical: 12, alignItems: "center" },
  primaryTxt: { color: "#FFFFFF", fontWeight: "900" },

  secondaryBtn: { flex: 1, borderRadius: 18, paddingVertical: 12, alignItems: "center", borderWidth: 1 },
  secondaryTxt: { fontWeight: "900" },

  emptyCompose: { paddingVertical: 8, gap: 6 },

  resultScroll: { maxHeight: 360 },
  resultContent: { padding: 16, gap: 12 },

  meta: { fontWeight: "900" },

  productCard: { borderRadius: 18, borderWidth: 1, padding: 12, gap: 6 },
  productTitle: { fontWeight: "900" },
  productText: { fontWeight: "700" },

  answerCard: { borderRadius: 18, borderWidth: 1, padding: 12 },
  answerText: { lineHeight: 20, fontWeight: "700" },

  errorCard: { backgroundColor: "#2A1220", borderRadius: 16, borderWidth: 1, borderColor: "#7F1D1D", padding: 12, gap: 6 },
  errorTitle: { color: "#FEE2E2", fontWeight: "900" },
  errorText: { color: "#FCA5A5", fontWeight: "700" },

  centerCard: { margin: 16, borderRadius: 22, borderWidth: 1, padding: 16, gap: 10 },
  h1: { fontSize: 20, fontWeight: "900" },
  sub: { fontWeight: "700" },
});