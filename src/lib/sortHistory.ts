import AsyncStorage from "@react-native-async-storage/async-storage";

export type SortHistoryItem = {
  q: string;
  ts: number;
};

const KEY = "ecolife_sort_history_v1";
const MAX = 30;

export async function loadSortHistory(): Promise<SortHistoryItem[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((x) => x && typeof x.q === "string" && typeof x.ts === "number")
      .slice(0, MAX);
  } catch {
    return [];
  }
}

export async function saveSortHistory(items: SortHistoryItem[]) {
  await AsyncStorage.setItem(KEY, JSON.stringify(items.slice(0, MAX)));
}

export async function addToSortHistory(q: string) {
  const query = q.trim();
  if (!query) return;
  const current = await loadSortHistory();
  const next = [
    { q: query, ts: Date.now() },
    ...current.filter((x) => x.q.toLowerCase() !== query.toLowerCase()),
  ].slice(0, MAX);
  await saveSortHistory(next);
}

export async function clearSortHistory() {
  await AsyncStorage.removeItem(KEY);
}