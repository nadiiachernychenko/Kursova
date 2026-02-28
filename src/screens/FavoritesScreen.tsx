import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Alert,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";

import { supabase } from "../lib/supabase";
import { getFavorites, toggleFavorite } from "../lib/favorites";
import { CATEGORIES, type WasteCategoryId } from "../data/sorting";

export type EcoPoint = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  categories: WasteCategoryId[];
  materials?: string[] | null;
  phone?: string | null;
  hours?: string | null;
  hours_json?: any | null;
  website?: string | null;
  note?: string | null;
  status: "pending" | "approved" | "rejected";
};

export default function FavoritesScreen({ navigation }: any) {
  const nav = useNavigation<any>();

  const [favIds, setFavIds] = useState<string[]>([]);
  const [points, setPoints] = useState<EcoPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);

    try {
      const ids = await getFavorites();
      setFavIds(ids);

      if (ids.length === 0) {
        setPoints([]);
        return;
      }

      const { data, error } = await supabase
        .from("eco_points")
        .select("id,name,address,lat,lng,categories,materials,phone,hours,hours_json,website,note,status")
        .eq("status", "approved")
        .in("id", ids);

      if (error) throw error;

      const map = new Map((data ?? []).map((p: any) => [p.id, p]));
      const ordered = ids.map((id) => map.get(id)).filter(Boolean) as EcoPoint[];
      setPoints(ordered);
    } catch (e: any) {
      setError(e?.message ?? "Unknown error");
      setPoints([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const removeFromFav = useCallback(async (id: string) => {
    try {
      const ids = await toggleFavorite(id);
      setFavIds(ids);
      setPoints((prev) => prev.filter((p) => p.id !== id));
    } catch {
      Alert.alert("Помилка", "Не вдалося змінити обране");
    }
  }, []);

  const goToPointOnMap = useCallback(
    (p: EcoPoint) => {
      const params = { focusId: p.id, focusNonce: Date.now(), focusOnly: true };

      const parent = nav.getParent?.();
      if (parent) {
        parent.navigate("Map", { screen: "MapMain", params });
        return;
      }
      navigation.navigate("MapMain", params);
    },
    [nav, navigation]
  );

  const empty = useMemo(
    () => !loading && !error && favIds.length === 0,
    [loading, error, favIds]
  );

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>⭐ Обране</Text>
        <Pressable style={styles.refreshBtn} onPress={load}>
          <Text style={styles.refreshText}>↻</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={styles.muted}>Завантажую…</Text>
        </View>
      ) : error ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>⚠️ Помилка</Text>
          <Text style={styles.cardSub}>{error}</Text>
          <Pressable style={[styles.pill, { marginTop: 10 }]} onPress={load}>
            <Text style={styles.pillText}>↻ Спробувати ще</Text>
          </Pressable>
        </View>
      ) : empty ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Поки порожньо</Text>
          <Text style={styles.cardSub}>Додавай пункти в обране — і вони з’являться тут.</Text>
          <Pressable style={[styles.pill, { marginTop: 10 }]} onPress={() => navigation.goBack()}>
            <Text style={styles.pillText}>← Назад до карти</Text>
          </Pressable>
        </View>
      ) : (
        points.map((p) => {
          const cats = (p.categories ?? [])
            .map((id) => {
              const c = CATEGORIES.find((x) => x.id === id);
              return c ? `${c.emoji} ${c.title}` : id;
            })
            .join(" • ");

          return (
            <View key={p.id} style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {p.name}
                </Text>

                <Pressable
                  onPress={() => removeFromFav(p.id)}
                  style={({ pressed }) => [styles.starBtn, { opacity: pressed ? 0.5 : 1 }]}
                >
                  <Text style={styles.starText}>⭐</Text>
                </Pressable>
              </View>

              <Text style={styles.cardSub}>{p.address}</Text>
              {cats ? <Text style={styles.cardHint}>{cats}</Text> : null}

              <View style={styles.actions}>
                <Pressable style={styles.actionBtn} onPress={() => navigation.navigate("PointDetails", { point: p })}>
                  <Text style={styles.actionText}>ℹ️ Деталі</Text>
                </Pressable>

                <Pressable style={styles.actionBtn} onPress={() => goToPointOnMap(p)}>
                  <Text style={styles.actionText}>🗺️ На мапі</Text>
                </Pressable>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 28 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 22, fontWeight: "900" },
  refreshBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.15)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
  },
  refreshText: { fontSize: 16, fontWeight: "900" },
  center: { marginTop: 30, alignItems: "center" },
  muted: { marginTop: 8, opacity: 0.7 },
  card: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    borderRadius: 16,
    padding: 12,
    backgroundColor: "white",
  },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  cardTitle: { fontSize: 15, fontWeight: "900", flex: 1 },
  cardSub: { marginTop: 6, fontSize: 13, opacity: 0.8, lineHeight: 18 },
  cardHint: { marginTop: 6, fontSize: 12, opacity: 0.7, lineHeight: 16 },
  starBtn: {
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  starText: { fontSize: 14, fontWeight: "900" },
  actions: { flexDirection: "row", gap: 10, marginTop: 10, flexWrap: "wrap" },
  actionBtn: {
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.15)",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "white",
  },
  actionText: { fontSize: 13, fontWeight: "900" },
  pill: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.15)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "white",
  },
  pillText: { fontSize: 12, fontWeight: "900" },
});
