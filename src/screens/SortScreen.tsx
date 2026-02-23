import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  FlatList,
  Keyboard,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { SortStackParamList } from "../navigation/SortStack";
import type { WasteCategoryId } from "../data/sorting";
import { addToSortHistory, clearSortHistory, loadSortHistory, SortHistoryItem } from "../lib/sortHistory";

type Nav = NativeStackNavigationProp<SortStackParamList, "SortMain">;

type QuickItem = {
  title: string;
  id: WasteCategoryId;
  keywords: string[];
};

const QUICK: QuickItem[] = [
  { title: "Папір", id: "paper" as WasteCategoryId, keywords: ["папір", "картон", "коробка", "газета", "лист", "зошит"] },
  { title: "Пластик", id: "plastic" as WasteCategoryId, keywords: ["пластик", "пляшка", "пет", "pet", "pp", "hdpe", "пакет", "контейнер", "кришка"] },
  { title: "Скло", id: "glass" as WasteCategoryId, keywords: ["скло", "банка", "пляшка скло", "скляна"] },
  { title: "Метал", id: "metal" as WasteCategoryId, keywords: ["метал", "алюміній", "жерсть", "бляшанка", "консерва"] },
  { title: "Органіка", id: "organic" as WasteCategoryId, keywords: ["органіка", "харчові", "очистки", "кава", "чай", "шкірка"] },
  { title: "Небезпечні", id: "hazardous" as WasteCategoryId, keywords: ["батарей", "лампа", "ртуть", "акумулятор", "ліки", "аерозоль", "фарба", "хімія"] },
  { title: "Електроніка", id: "ewaste" as WasteCategoryId, keywords: ["електрон", "кабель", "зарядка", "телефон", "ноут", "плата"] },
];

function norm(s: string) {
  return s.trim().toLowerCase();
}

function scoreMatch(query: string, text: string) {
  const q = norm(query);
  const t = norm(text);
  if (!q) return 0;
  if (t === q) return 100;
  if (t.startsWith(q)) return 60;
  if (t.includes(q)) return 30;
  return 0;
}

function guessCategory(query: string): QuickItem | null {
  const q = norm(query);
  if (!q) return null;
  let best: { item: QuickItem; score: number } | null = null;
  for (const item of QUICK) {
    let s = scoreMatch(q, item.title);
    for (const k of item.keywords) s = Math.max(s, scoreMatch(q, k));
    if (!best || s > best.score) best = { item, score: s };
  }
  if (!best) return null;
  if (best.score >= 60) return best.item;
  return null;
}

export default function SortScreen() {
  const nav = useNavigation<Nav>();
  const [q, setQ] = useState("");
  const [history, setHistory] = useState<SortHistoryItem[]>([]);

  useEffect(() => {
    loadSortHistory().then(setHistory);
  }, []);

  const suggestions = useMemo(() => {
    const query = q.trim();
    const list: Array<{ type: "cat" | "hist"; title: string; id?: WasteCategoryId }> = [];

    if (query.length > 0) {
      const cat = guessCategory(query);
      if (cat) list.push({ type: "cat", title: `Відкрити категорію: ${cat.title}`, id: cat.id });

      const catMatches = QUICK
        .map((x) => ({ x, s: Math.max(scoreMatch(query, x.title), ...x.keywords.map((k) => scoreMatch(query, k))) }))
        .filter((z) => z.s > 0)
        .sort((a, b) => b.s - a.s)
        .slice(0, 4)
        .map((z) => ({ type: "cat" as const, title: z.x.title, id: z.x.id }));

      for (const m of catMatches) {
        if (!list.some((y) => y.type === "cat" && y.id === m.id)) list.push(m);
      }

      const histMatches = history
        .map((h) => ({ h, s: scoreMatch(query, h.q) }))
        .filter((z) => z.s > 0)
        .sort((a, b) => b.s - a.s)
        .slice(0, 6)
        .map((z) => ({ type: "hist" as const, title: z.h.q }));

      for (const m of histMatches) list.push(m);
    } else {
      const top = history.slice(0, 8).map((h) => ({ type: "hist" as const, title: h.q }));
      for (const t of top) list.push(t);
    }

    return list.slice(0, 10);
  }, [q, history]);

  const submit = async (text?: string) => {
    const query = (text ?? q).trim();
    if (!query) return;
    Keyboard.dismiss();

    const cat = guessCategory(query);
    await addToSortHistory(query);
    setHistory(await loadSortHistory());

    if (cat) {
      nav.navigate("Category", { id: cat.id, title: cat.title });
      return;
    }

    nav.navigate("Assistant", { initialQuery: query });
  };

  const openSuggestion = (s: { type: "cat" | "hist"; title: string; id?: WasteCategoryId }) => {
    if (s.type === "cat" && s.id) {
      const item = QUICK.find((x) => x.id === s.id);
      nav.navigate("Category", { id: s.id, title: item?.title ?? "Деталі" });
      return;
    }
    submit(s.title);
  };

  const wipeHistory = async () => {
    await clearSortHistory();
    setHistory([]);
  };

  return (
    <View style={styles.root}>
      <View style={styles.top}>
        <Text style={styles.h1}>Інструмент сортування</Text>
        <Text style={styles.sub}>Пошук + порадник + сканування штрихкоду</Text>

        <View style={styles.searchWrap}>
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Введи предмет або матеріал (напр. батарейки, PET, банка)"
            placeholderTextColor="#9AA3AF"
            style={styles.input}
            returnKeyType="search"
            onSubmitEditing={() => submit()}
          />
          <Pressable style={styles.goBtn} onPress={() => submit()}>
            <Text style={styles.goTxt}>Знайти</Text>
          </Pressable>
        </View>

        <View style={styles.actions}>
          <Pressable style={styles.actionBtn} onPress={() => nav.navigate("Scan")}>
            <Text style={styles.actionTitle}>Скануй</Text>
            <Text style={styles.actionSub}>Штрихкод → підказка</Text>
          </Pressable>

          <Pressable style={styles.actionBtn} onPress={() => nav.navigate("Intro")}>
            <Text style={styles.actionTitle}>Як сортувати</Text>
            <Text style={styles.actionSub}>Для новачків</Text>
          </Pressable>

          <Pressable style={styles.actionBtn} onPress={() => nav.navigate("Assistant")}>
            <Text style={styles.actionTitle}>Запитай</Text>
            <Text style={styles.actionSub}>Відповідь від AI</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>{q.trim() ? "Підказки" : "Історія"}</Text>
        <Pressable onPress={wipeHistory} hitSlop={10}>
          <Text style={styles.clear}>Очистити</Text>
        </Pressable>
      </View>

      <FlatList
        data={suggestions}
        keyExtractor={(item, idx) => `${item.type}:${item.title}:${idx}`}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => openSuggestion(item)}>
            <Text style={styles.rowTitle}>{item.type === "cat" && item.id ? item.title : item.title}</Text>
            <Text style={styles.rowMeta}>{item.type === "cat" ? "Категорія" : "Запит"}</Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Поки що порожньо</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0B1220" },
  top: { padding: 16, paddingTop: Platform.OS === "android" ? 16 : 12 },
  h1: { color: "#F9FAFB", fontSize: 22, fontWeight: "700" },
  sub: { color: "#A7B0BE", marginTop: 6, marginBottom: 14 },

  searchWrap: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    backgroundColor: "#0F1A2E",
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: "#1F2A44",
  },
  input: { flex: 1, color: "#F9FAFB", fontSize: 14, paddingVertical: 8 },
  goBtn: { backgroundColor: "#1D4ED8", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  goTxt: { color: "#FFFFFF", fontWeight: "700" },

  actions: { flexDirection: "row", gap: 10, marginTop: 12 },
  actionBtn: {
    flex: 1,
    backgroundColor: "#0F1A2E",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#1F2A44",
  },
  actionTitle: { color: "#F9FAFB", fontWeight: "800" },
  actionSub: { color: "#A7B0BE", marginTop: 4, fontSize: 12 },

  listHeader: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  listTitle: { color: "#D1D5DB", fontWeight: "700" },
  clear: { color: "#93C5FD", fontWeight: "700" },

  list: { padding: 16, paddingTop: 8, gap: 10 },
  row: {
    backgroundColor: "#0F1A2E",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#1F2A44",
  },
  rowTitle: { color: "#F9FAFB", fontWeight: "700" },
  rowMeta: { color: "#A7B0BE", marginTop: 4, fontSize: 12 },

  empty: { padding: 16, alignItems: "center" },
  emptyText: { color: "#9AA3AF" },
});