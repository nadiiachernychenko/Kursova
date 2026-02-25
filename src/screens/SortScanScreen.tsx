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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useIsFocused } from "@react-navigation/native";
import { CameraView, useCameraPermissions, BarcodeScanningResult } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { askEcoAssistant } from "../lib/ecoAssistant";
import { addToSortHistory } from "../lib/sortHistory";
import { useAppTheme } from "../lib/theme";

type Step = "scan" | "compose" | "loading" | "result";

const FONTS = {
  title: "Nunito_800ExtraBold",
  title2: "Nunito_700Bold",
  body: "Manrope_600SemiBold",
  strong: "Manrope_700Bold",
} as const;

type Pal = {
  bg: string;
  card: string;
  text: string;
  sub: string;
  line: string;
  accent: string;
  accentSoft: string;
  placeholder: string;
};

function makePal(colors: any, isDark: boolean): Pal {
  const accent = "#2F6F4E";
  const bg = colors?.background ?? (isDark ? "#0E0F11" : "#F6F7F4");
  const card = colors?.card ?? (isDark ? "#15171A" : "#FFFFFF");
  const text = colors?.text ?? (isDark ? "#F2F3F4" : "#111214");
  const border = colors?.border ?? (isDark ? "rgba(242,243,244,0.10)" : "rgba(17,18,20,0.08)");

  return {
    bg,
    card,
    text,
    sub: isDark ? "rgba(242,243,244,0.72)" : "rgba(17,18,20,0.68)",
    line: border,
    accent,
    accentSoft: isDark ? "rgba(47,111,78,0.22)" : "#E7F2EC",
    placeholder: isDark ? "rgba(242,243,244,0.40)" : "rgba(17,18,20,0.38)",
  };
}

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
  const PAL = useMemo(() => makePal(colors, !!isDark), [colors, isDark]);
  const styles = useMemo(() => createStyles(PAL, !!isDark), [PAL, isDark]);

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

  const title = useMemo(() => {
    if (step === "scan") return "Сканування";
    if (step === "loading") return "Пошук…";
    if (step === "result") return "Готово";
    return "Деталі";
  }, [step]);

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
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.centerCard}>
          <Text style={styles.h1}>Камера</Text>
          <Text style={styles.sub}>Потрібен дозвіл</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!canUse) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <LinearGradient
          colors={isDark ? ["#14241B", "#111315"] : ["#F6F9F6", "#FFFFFF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.centerCard}>
          <Text style={styles.h1}>Доступ до камери</Text>
          <Text style={styles.sub}>Дозволь камеру, щоб сканувати штрихкоди</Text>
          <Pressable style={styles.primaryBtn} onPress={requestPermission}>
            <Text style={styles.primaryTxt}>Дозволити</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (step === "loading") {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <LinearGradient
          colors={isDark ? ["#14241B", "#111315"] : ["#F6F9F6", "#FFFFFF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{title}</Text>
        </View>
        <View style={styles.loadingWrap}>
          <View style={styles.loadingCard}>
            <ActivityIndicator />
            <Text style={styles.loadingTxt}>Шукаю інформацію у відкритих базах…</Text>
            <Text style={styles.loadingSub}>Це може зайняти кілька секунд</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (step === "result") {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <LinearGradient
          colors={isDark ? ["#14241B", "#111315"] : ["#F6F9F6", "#FFFFFF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{title}</Text>
        </View>

        <ScrollView style={styles.full} contentContainerStyle={styles.fullPad} keyboardShouldPersistTaps="handled">
          {!!barcode && <Text style={styles.meta}>Штрихкод: {barcode}</Text>}

          {!!productLine && (
            <View style={styles.productCard}>
              <Text style={styles.productTitle}>Знайдено</Text>
              <Text style={styles.productText}>{productLine}</Text>
            </View>
          )}

          <View style={styles.answerCard}>
            <Text style={styles.answerText}>{answer ?? ""}</Text>
          </View>

          {!!err && (
            <View style={styles.errorCard}>
              <Text style={styles.errorTitle}>Помилка</Text>
              <Text style={styles.errorText}>{err}</Text>
            </View>
          )}

          <Pressable style={styles.primaryBtn} onPress={resetAll}>
            <Text style={styles.primaryTxt}>Сканувати ще раз</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (step === "compose" && barcode) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <LinearGradient
          colors={isDark ? ["#14241B", "#111315"] : ["#F6F9F6", "#FFFFFF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{title}</Text>
        </View>

        <KeyboardAvoidingView
          style={styles.composeWrap}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
          <ScrollView style={styles.full} contentContainerStyle={styles.fullPad} keyboardShouldPersistTaps="handled">
            <View style={styles.codeCard}>
              <View style={styles.codeRow}>
                <View style={styles.codeLeft}>
                  <Ionicons name="barcode-outline" size={18} color={PAL.text} />
                  <Text style={styles.codeLabel}>Штрихкод</Text>
                </View>
                <Text style={styles.codeValue} numberOfLines={1}>
                  {barcode}
                </Text>
              </View>
              <Pressable style={styles.linkBtn} onPress={resetAll}>
                <Ionicons name="scan-outline" size={18} color={PAL.text} />
                <Text style={styles.linkTxt}>Сканувати інший</Text>
              </Pressable>
            </View>

            {!needClarify ? (
              <>
                <View style={styles.block}>
                  <Text style={styles.blockTitle}>Додай контекст (необовʼязково)</Text>
                  <Text style={styles.blockSub}>
                    Приклади: “Це пластикова пляшка від йогурту. Поясни як її правильно утилізувати.” або “Це тюбик крему з
                    помпою, куди викидати помпу?”
                  </Text>

                  <TextInput
                    value={note}
                    onChangeText={setNote}
                    placeholder="Напиши своїми словами (можна пропустити)"
                    placeholderTextColor={PAL.placeholder}
                    style={styles.input}
                    multiline
                  />
                </View>

                {!!err && (
                  <View style={styles.errorCard}>
                    <Text style={styles.errorTitle}>Помилка</Text>
                    <Text style={styles.errorText}>{err}</Text>
                  </View>
                )}

                <Pressable style={styles.primaryBtn} onPress={submitFind}>
                  <Text style={styles.primaryTxt}>Знайти</Text>
                </Pressable>
              </>
            ) : (
              <>
                <View style={styles.block}>
                  <Text style={styles.blockTitle}>Не вдалося знайти товар у базах</Text>
                  <Text style={styles.blockSub}>
                    Напиши, що це за предмет або яка упаковка — і я поясню, як утилізувати в Україні.
                  </Text>

                  <TextInput
                    value={clarify}
                    onChangeText={setClarify}
                    placeholder="Наприклад: пластикова пляшка, тюбик, банка з металу, ручка"
                    placeholderTextColor={PAL.placeholder}
                    style={styles.inputBig}
                    multiline
                  />
                </View>

                {!!err && (
                  <View style={styles.errorCard}>
                    <Text style={styles.errorTitle}>Помилка</Text>
                    <Text style={styles.errorText}>{err}</Text>
                  </View>
                )}

                <View style={styles.row}>
                  <Pressable style={styles.secondaryBtn} onPress={() => setNeedClarify(false)}>
                    <Text style={styles.secondaryTxt}>Назад</Text>
                  </Pressable>
                  <Pressable style={[styles.primaryBtn, !clarify.trim() && { opacity: 0.6 }]} onPress={submitExplain} disabled={!clarify.trim()}>
                    <Text style={styles.primaryTxt}>Пояснити утилізацію</Text>
                  </Pressable>
                </View>
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <LinearGradient
        colors={isDark ? ["#14241B", "#111315"] : ["#F6F9F6", "#FFFFFF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>{title}</Text>
        <Pressable style={styles.headerPill} onPress={resetAll}>
          <Ionicons name="refresh" size={16} color={PAL.text} />
          <Text style={styles.headerPillTxt}>Перезапустити</Text>
        </Pressable>
      </View>

      <View style={styles.scanBody}>
        <View style={styles.cameraPlain}>
          <CameraView
            key={camKey}
            style={StyleSheet.absoluteFillObject}
            facing="back"
            active={isFocused}
            onBarcodeScanned={onBarcodeScanned}
            barcodeScannerSettings={{ barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "code128", "code39", "qr"] }}
          />
          <View style={styles.scanTop}>
            <Ionicons name="scan-outline" size={18} color={PAL.text} />
            <Text style={styles.scanTopTxt}>Наведи на штрихкод</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

function createStyles(PAL: Pal, isDark: boolean) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: "transparent" },

    header: {
      paddingHorizontal: 16,
      paddingTop: 6,
      paddingBottom: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: PAL.line,
    },
    headerRow: {
      paddingHorizontal: 16,
      paddingTop: 6,
      paddingBottom: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: PAL.line,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },
    headerTitle: { fontSize: 18, color: PAL.text, fontFamily: FONTS.title },

    headerPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: PAL.line,
      backgroundColor: isDark ? "rgba(21,24,27,0.58)" : "rgba(255,255,255,0.72)",
    },
    headerPillTxt: { color: PAL.text, fontSize: 12, fontFamily: FONTS.strong },

    scanBody: { flex: 1, padding: 16 },
    cameraPlain: {
      flex: 1,
      borderRadius: 22,
      overflow: "hidden",
      backgroundColor: "#000",
      borderWidth: 1,
      borderColor: PAL.line,
    },

    scanTop: {
      position: "absolute",
      left: 12,
      right: 12,
      top: 12,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: PAL.line,
      paddingHorizontal: 12,
      paddingVertical: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: isDark ? "rgba(21,24,27,0.72)" : "rgba(255,255,255,0.82)",
    },
    scanTopTxt: { color: PAL.text, fontFamily: FONTS.strong, fontSize: 13 },

    full: { flex: 1 },
    fullPad: { padding: 16, gap: 12 },

    composeWrap: { flex: 1 },

    codeCard: {
      borderRadius: 22,
      borderWidth: 1,
      borderColor: PAL.line,
      padding: 14,
      gap: 12,
      backgroundColor: isDark ? "rgba(21,24,27,0.72)" : "rgba(255,255,255,0.82)",
    },
    codeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
    codeLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
    codeLabel: { color: PAL.sub, fontFamily: FONTS.body, fontSize: 12 },
    codeValue: { color: PAL.text, fontFamily: FONTS.strong, letterSpacing: 0.5, flex: 1, textAlign: "right" },

    linkBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 12,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: PAL.line,
      backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.03)",
    },
    linkTxt: { color: PAL.text, fontFamily: FONTS.strong, fontSize: 12 },

    block: {
      borderRadius: 22,
      borderWidth: 1,
      borderColor: PAL.line,
      padding: 14,
      gap: 8,
      backgroundColor: isDark ? "rgba(21,24,27,0.72)" : "rgba(255,255,255,0.82)",
    },
    blockTitle: { fontSize: 15, color: PAL.text, fontFamily: FONTS.title2 },
    blockSub: { fontSize: 12, color: PAL.sub, lineHeight: 18, fontFamily: FONTS.body },

    input: {
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)",
      backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.03)",
      borderRadius: 18,
      paddingHorizontal: 12,
      paddingVertical: 12,
      minHeight: 72,
      fontSize: 13,
      color: PAL.text,
      lineHeight: 18,
      fontFamily: FONTS.body,
    },
    inputBig: {
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)",
      backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.03)",
      borderRadius: 18,
      paddingHorizontal: 12,
      paddingVertical: 12,
      minHeight: 110,
      fontSize: 13,
      color: PAL.text,
      lineHeight: 18,
      fontFamily: FONTS.body,
    },

    primaryBtn: {
      borderRadius: 18,
      paddingVertical: 12,
      alignItems: "center",
      backgroundColor: PAL.accent,
    },
    primaryTxt: { color: "#fff", fontSize: 12, fontFamily: FONTS.strong },

    row: { flexDirection: "row", gap: 10 },
    secondaryBtn: {
      flex: 1,
      borderRadius: 18,
      paddingVertical: 12,
      alignItems: "center",
      borderWidth: 1,
      borderColor: PAL.line,
      backgroundColor: isDark ? "rgba(21,24,27,0.72)" : "rgba(255,255,255,0.82)",
    },
    secondaryTxt: { color: PAL.text, fontSize: 12, fontFamily: FONTS.strong },

    meta: { color: PAL.sub, fontFamily: FONTS.body, fontSize: 12 },

    productCard: {
      borderRadius: 22,
      borderWidth: 1,
      borderColor: PAL.line,
      padding: 14,
      gap: 6,
      backgroundColor: isDark ? "rgba(21,24,27,0.72)" : "rgba(255,255,255,0.82)",
    },
    productTitle: { color: PAL.text, fontFamily: FONTS.title2, fontSize: 14 },
    productText: { color: PAL.sub, fontFamily: FONTS.body, fontSize: 12, lineHeight: 18 },

    answerCard: {
      borderRadius: 22,
      borderWidth: 1,
      borderColor: PAL.line,
      padding: 14,
      backgroundColor: isDark ? "rgba(21,24,27,0.72)" : "rgba(255,255,255,0.82)",
    },
    answerText: { color: PAL.text, lineHeight: 20, fontFamily: FONTS.body, fontSize: 13 },

    loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 16 },
    loadingCard: {
      width: "100%",
      borderRadius: 22,
      borderWidth: 1,
      borderColor: PAL.line,
      padding: 16,
      gap: 10,
      alignItems: "center",
      backgroundColor: isDark ? "rgba(21,24,27,0.72)" : "rgba(255,255,255,0.82)",
    },
    loadingTxt: { fontFamily: FONTS.strong, color: PAL.text, textAlign: "center", fontSize: 13 },
    loadingSub: { fontFamily: FONTS.body, color: PAL.sub, textAlign: "center", fontSize: 12 },

    errorCard: {
      backgroundColor: isDark ? "rgba(127,29,29,0.24)" : "rgba(127,29,29,0.10)",
      borderRadius: 18,
      borderWidth: 1,
      borderColor: isDark ? "rgba(252,165,165,0.35)" : "rgba(127,29,29,0.22)",
      padding: 12,
      gap: 6,
    },
    errorTitle: { color: isDark ? "#FEE2E2" : "#7F1D1D", fontFamily: FONTS.strong, fontSize: 12 },
    errorText: { color: isDark ? "#FCA5A5" : "#7F1D1D", fontFamily: FONTS.body, fontSize: 12, lineHeight: 18 },

    centerCard: {
      margin: 16,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: PAL.line,
      padding: 16,
      gap: 10,
      backgroundColor: isDark ? "rgba(21,24,27,0.72)" : "rgba(255,255,255,0.82)",
    },
    h1: { fontSize: 18, color: PAL.text, fontFamily: FONTS.title },
    sub: { color: PAL.sub, fontFamily: FONTS.body, fontSize: 12, lineHeight: 18 },
  });
}