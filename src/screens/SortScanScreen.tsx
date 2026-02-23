import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, TextInput } from "react-native";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { CameraView, useCameraPermissions, BarcodeScanningResult } from "expo-camera";
import type { SortStackParamList } from "../navigation/SortStack";
import { addToSortHistory } from "../lib/sortHistory";

type Nav = NativeStackNavigationProp<SortStackParamList, "Scan">;

export default function SortScanScreen() {
  const nav = useNavigation<Nav>();
  const isFocused = useIsFocused();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState<string | null>(null);
  const [manual, setManual] = useState("");
  const [camKey, setCamKey] = useState(1);

  const canUse = permission?.granted === true;

  const hintQuery = useMemo(() => {
    if (!scanned) return "";
    return `Я відсканувала штрихкод ${scanned}. Поясни, що це може бути за товар/упаковка і як правильно утилізувати упаковку та відходи від нього в Україні.`;
  }, [scanned]);

  const onBarcodeScanned = (r: BarcodeScanningResult) => {
    if (scanned) return;
    if (!r?.data) return;
    setScanned(String(r.data));
  };

  const reset = () => {
    setScanned(null);
    setCamKey((x) => x + 1);
  };

  const goAssistant = async () => {
    const q = hintQuery.trim();
    if (!q) return;
    await addToSortHistory(`Штрихкод: ${scanned}`);
    nav.navigate("Assistant", { initialQuery: q });
  };

  const goManual = async () => {
    const name = manual.trim();
    if (!name) return;
    await addToSortHistory(name);
    nav.navigate("Assistant", { initialQuery: `Куди викидати: ${name}?` });
  };

  if (!permission) {
    return (
      <View style={styles.root}>
        <View style={styles.card}>
          <Text style={styles.h1}>Камера</Text>
          <Text style={styles.sub}>Потрібен дозвіл</Text>
        </View>
      </View>
    );
  }

  if (!canUse) {
    return (
      <View style={styles.root}>
        <View style={styles.card}>
          <Text style={styles.h1}>Доступ до камери</Text>
          <Text style={styles.sub}>Натисни, щоб дозволити сканування</Text>
          <Pressable style={styles.btn} onPress={requestPermission}>
            <Text style={styles.btnTxt}>Дозволити</Text>
          </Pressable>
        </View>

        <View style={[styles.card, { marginTop: 12 }]}>
          <Text style={styles.h2}>Або введи вручну</Text>
          <TextInput value={manual} onChangeText={setManual} placeholder="Наприклад: батарейки, банка" placeholderTextColor="#9AA3AF" style={styles.input} />
          <Pressable style={styles.btn2} onPress={goManual}>
            <Text style={styles.btn2Txt}>Питати</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.cameraWrap}>
        <CameraView
          key={camKey}
          style={styles.camera}
          facing="back"
          active={isFocused}
          onBarcodeScanned={onBarcodeScanned}
          barcodeScannerSettings={{ barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "code128", "code39", "qr"] }}
        />

        <View style={styles.overlay}>
          <Text style={styles.overlayTitle}>Наведи на штрихкод</Text>
          <Pressable style={styles.btnSmall} onPress={reset}>
            <Text style={styles.btnSmallTxt}>Перезапустити</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.bottom}>
        {!scanned ? (
          <>
            <Text style={styles.h2}>Порада</Text>
            <Text style={styles.sub2}>Якщо штрихкод не сканується — введи предмет вручну нижче</Text>
            <TextInput value={manual} onChangeText={setManual} placeholder="Наприклад: банка з-під кави" placeholderTextColor="#9AA3AF" style={styles.input} />
            <Pressable style={styles.btn2} onPress={goManual}>
              <Text style={styles.btn2Txt}>Питати</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.h2}>Знайдено</Text>
            <Text style={styles.code}>{scanned}</Text>
            <Pressable style={styles.btn} onPress={goAssistant}>
              <Text style={styles.btnTxt}>Поясни, як утилізувати</Text>
            </Pressable>
            <Pressable style={styles.btnGhost} onPress={reset}>
              <Text style={styles.btnGhostTxt}>Сканувати ще раз</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0B1220" },
  cameraWrap: { flex: 1, backgroundColor: "#000000" },
  camera: { flex: 1 },
  overlay: { position: "absolute", left: 16, right: 16, top: 16, backgroundColor: "rgba(15, 26, 46, 0.85)", borderRadius: 14, borderWidth: 1, borderColor: "rgba(31, 42, 68, 0.9)", padding: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  overlayTitle: { color: "#F9FAFB", fontWeight: "900" },
  btnSmall: { backgroundColor: "rgba(17, 28, 51, 0.95)", paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: "rgba(31, 42, 68, 0.9)" },
  btnSmallTxt: { color: "#E5E7EB", fontWeight: "900" },
  bottom: { padding: 16, gap: 10 },
  card: { margin: 16, backgroundColor: "#0F1A2E", borderRadius: 16, borderWidth: 1, borderColor: "#1F2A44", padding: 14, gap: 10 },
  h1: { color: "#F9FAFB", fontSize: 20, fontWeight: "900" },
  h2: { color: "#F9FAFB", fontSize: 16, fontWeight: "900" },
  sub: { color: "#A7B0BE" },
  sub2: { color: "#A7B0BE", lineHeight: 18 },
  input: { backgroundColor: "#0F1A2E", borderWidth: 1, borderColor: "#1F2A44", borderRadius: 14, paddingHorizontal: 12, paddingVertical: 12, color: "#F9FAFB" },
  btn: { backgroundColor: "#1D4ED8", paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  btnTxt: { color: "#FFFFFF", fontWeight: "900" },
  btn2: { backgroundColor: "#111C33", paddingVertical: 12, borderRadius: 12, alignItems: "center", borderWidth: 1, borderColor: "#1F2A44" },
  btn2Txt: { color: "#E5E7EB", fontWeight: "900" },
  btnGhost: { paddingVertical: 10, alignItems: "center" },
  btnGhostTxt: { color: "#93C5FD", fontWeight: "900" },
  code: { color: "#D1D5DB", fontWeight: "900", fontSize: 18, letterSpacing: 1 },
});