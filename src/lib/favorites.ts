// src/lib/favorites.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "ecolife:favorites:v1";

export async function getFavorites(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as string[]) : [];
}

export async function setFavorites(ids: string[]) {
  await AsyncStorage.setItem(KEY, JSON.stringify(ids));
}

export async function toggleFavorite(id: string): Promise<string[]> {
  const prev = await getFavorites();
  const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
  await setFavorites(next);
  return next;
}

export async function isFavorite(id: string): Promise<boolean> {
  const ids = await getFavorites();
  return ids.includes(id);
}
