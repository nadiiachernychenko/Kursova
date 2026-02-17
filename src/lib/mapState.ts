import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Region } from "react-native-maps";
import type { WasteCategoryId } from "../data/sorting";

export type MapSavedState = {
  selected: WasteCategoryId | "all";
  region: Region | null;
  selectedPointId: string | null;
};

const KEY = "ecolife.map.state.v1";

export async function loadMapState(): Promise<MapSavedState | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as MapSavedState;
  } catch {
    return null;
  }
}

export async function saveMapState(state: MapSavedState): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(state));
  } catch {
  }
}

export async function clearMapState(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
  }
}
