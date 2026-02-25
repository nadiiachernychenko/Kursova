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

type R = RouteProp<SortStackParamList, "Assistant">;

function stripMdLike(text: string) {
  return String(text || "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/#{1,6}\s?/g, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .trim();
}

const HINT_CHIPS = [
  "Косметика",
  "Побутова хімія",
  "Їжа/напої",
  "Пластикова упаковка",
  "Скло",
  "Метал",
  "Папір/картон",
  "Електроніка",
  "Батарейки",
  "Інше",
];

export default function SortAssistantScreen() {
  const route = useRoute<R>();

  const [q, setQ] = useState(route.params?.initialQuery ?? "");
  const [barcode, setBarcode] = useState<string | undefined>((route.params as any)?.barcode);

  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [resolved, setResolved] = useState<boolean | null>(null);
  const [productLine, setProductLine] = useState<string | null>(null);

  const [hint, setHint] = useState("");
  const [showHintBlock, setShowHintBlock] = useState(false);

  const title = useMemo(() => (barcode ? "Результат сканування" : "Запитай про сортування"), [barcode]);

  useEffect(() => {
    if (route.params?.initialQuery != null) setQ(route.params.initialQuery ?? "");
    const b = (route.params as any)?.barcode;
    if (b) setBarcode(b);
  }, [route.params]);

  const call = async (opts?: { hint?: string }) => {
    const query = q.trim();
    const h = (opts?.hint ?? hint).trim();

    if (!query && !barcode) {
      setErr("Введи запит або відскануй штрихкод.");
      return;
    }

    Keyboard.dismiss();
    setLoading(true);
    setErr(null);

    try {
      if (query) await addToSortHistory(query);

      const res = await askEcoAssistant({
        query: query || undefined,
        barcode: barcode || undefined,
        hint: h || undefined,
      });

      const prod = res?.product;
      const isResolved = !!res?.resolved;
      setResolved(isResolved);

      if (prod && (prod.title || prod.brand)) {
        const parts = [prod.title, prod.brand].filter(Boolean);
        const src = prod.source ? ` · ${prod.source}` : "";
        setProductLine(`${parts.join(" — ")}${src}`);
      } else if (barcode) {
        setProductLine("Не знайдено у базах за цим штрихкодом.");
      } else {
        setProductLine(null);
      }

      setAnswer(stripMdLike(res?.answer ?? ""));
      setShowHintBlock(!!barcode && !isResolved);
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {
    setAnswer(null);
    setResolved(null);
    setProductLine(null);
    setShowHintBlock(false);
    await call();
  };

  const submitHint = async () => {
    await call({ hint });
  };

  const pickChip = (v: string) => {
    setHint((prev) => (prev ? `${prev}, ${v}` : v));
  };

  return (
    <View style={styles.root}>
      <View style={styles.top}>
        <Text style={styles.h1}>{title}</Text>
        <Text style={styles.sub}>Коротко і практично: куди та як викидати в Україні</Text>

        {!!barcode && (
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeTxt}>Штрихкод: {barcode}</Text>
            </View>
          </View>
        )}

        <View style={styles.box}>
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder={barcode ? "Можеш додати питання (необовʼязково)" : "Наприклад: куди викидати батарейки?"}
            placeholderTextColor="#9AA3AF"
            style={styles.input}
            multiline
          />
          <Pressable style={styles.btn} onPress={submit} disabled={loading}>
            <Text style={styles.btnTxt}>{loading ? "..." : "Надіслати"}</Text>
          </Pressable>
        </View>

        {!!productLine && (
          <View style={styles.productCard}>
            <Text style={styles.productTitle}>По штрихкоду</Text>
            <Text style={styles.productText}>{productLine}</Text>
          </View>
        )}
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

        {showHintBlock && (
          <View style={styles.hintCard}>
            <Text style={styles.hintTitle}>Не знайшла товар по коду</Text>
            <Text style={styles.hintSub}>
              Щоб підказка була точною, уточни: що це за предмет або яка упаковка (наприклад: “крем для рук у тюбику з
              помпою”, “побутова хімія”, “скляна банка”).
            </Text>

            <View style={styles.chips}>
              {HINT_CHIPS.map((c) => (
                <Pressable key={c} onPress={() => pickChip(c)} style={styles.chip}>
                  <Text style={styles.chipTxt}>{c}</Text>
                </Pressable>
              ))}
            </View>

            <TextInput
              value={hint}
              onChangeText={setHint}
              placeholder="Уточнення (можна коротко)"
              placeholderTextColor="#9AA3AF"
              style={styles.hintInput}
            />

            <Pressable style={styles.btn2} onPress={submitHint} disabled={loading}>
              <Text style={styles.btn2Txt}>{loading ? "..." : "Надіслати уточнення"}</Text>
            </Pressable>
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

  badgeRow: { marginTop: 8, flexDirection: "row" },
  badge: {
    backgroundColor: "#111C33",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#1F2A44",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  badgeTxt: { color: "#D1D5DB", fontWeight: "800" },

  box: {
    marginTop: 10,
    backgroundColor: "#0F1A2E",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1F2A44",
    padding: 12,
    gap: 10,
  },
  input: { minHeight: 88, color: "#F9FAFB", fontSize: 14 },
  btn: { backgroundColor: "#1D4ED8", paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  btnTxt: { color: "#FFFFFF", fontWeight: "800" },

  productCard: {
    marginTop: 10,
    backgroundColor: "#0F1A2E",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1F2A44",
    padding: 12,
    gap: 6,
  },
  productTitle: { color: "#F9FAFB", fontWeight: "900" },
  productText: { color: "#D1D5DB" },

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

  hintCard: {
    backgroundColor: "#0F1A2E",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1F2A44",
    padding: 14,
    gap: 10,
  },
  hintTitle: { color: "#F9FAFB", fontWeight: "900", fontSize: 16 },
  hintSub: { color: "#A7B0BE", lineHeight: 18 },

  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    backgroundColor: "#111C33",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#1F2A44",
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  chipTxt: { color: "#D1D5DB", fontWeight: "700", fontSize: 12 },

  hintInput: {
    backgroundColor: "#0B1220",
    borderWidth: 1,
    borderColor: "#1F2A44",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: "#F9FAFB",
  },

  btn2: { backgroundColor: "#111C33", paddingVertical: 12, borderRadius: 12, alignItems: "center", borderWidth: 1, borderColor: "#1F2A44" },
  btn2Txt: { color: "#E5E7EB", fontWeight: "900" },
});