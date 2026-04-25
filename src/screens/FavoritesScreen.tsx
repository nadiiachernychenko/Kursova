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
  Platform,
  Image,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import AppTopBar from "../components/AppTopBar";
import { supabase } from "../lib/supabase";
import { getFavorites, toggleFavorite } from "../lib/favorites";
import { CATEGORIES, type WasteCategoryId } from "../data/sorting";
import { useAppTheme } from "../lib/theme";

type Nav = any;

export type EcoPoint = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  categories: WasteCategoryId[];
  materials?: string | string[] | null;
  phone?: string | null;
  hours?: string | null;
  hours_json?: any | null;
  website?: string | null;
  note?: string | null;
  status: "pending" | "approved" | "rejected";
};

const LEAVES = require("../../assets/leaves-texture.png");

export default function FavoritesScreen({ navigation }: any) {
  const nav = useNavigation<Nav>();

  const [favIds, setFavIds] = useState<string[]>([]);
  const [points, setPoints] = useState<EcoPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { colors, isDark } = useAppTheme() as any;
  const styles = useMemo(() => createStyles(colors, !!isDark), [colors, isDark]);

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
        .select(
          "id,name,address,lat,lng,categories,materials,phone,hours,hours_json,website,note,status"
        )
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
    <View style={styles.root}>
      <LinearGradient
        style={styles.bg}
        colors={[styles._bgA, styles._bgB]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <Image source={LEAVES} style={styles.texture} resizeMode="repeat" />
      <View style={styles.veil} />

      <AppTopBar />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
<Text style={styles.simpleTitle}>Збережені пункти</Text>
        {error ? (
          <Pressable
            onPress={load}
            style={({ pressed }) => [styles.errorBox, { opacity: pressed ? 0.9 : 1 }]}
          >
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.errorHint}>Натисни, щоб спробувати ще раз</Text>
          </Pressable>
        ) : null}

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator />
            <Text style={styles.stateText}>Завантажую…</Text>
          </View>
        ) : empty ? (
          <View style={styles.emptyWrap}>
            <View style={styles.emptyCircle}>
              <Ionicons name="time-outline" size={28} color={styles._actionIcon as any} />
            </View>

            <Text style={styles.stateTitle}>Поки нічого немає</Text>
            <Text style={styles.stateText}>
              Тут з’являться пункти, які очікують перевірки
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {points.map((p, index) => {
              const cats = (p.categories ?? [])
                .map((id) => {
                  const c = CATEGORIES.find((x) => x.id === id);
                  return c ? `${c.emoji} ${c.title}` : id;
                })
                .join(" • ");

              const toneStyle =
                index % 4 === 0
                  ? styles.row_mint
                  : index % 4 === 1
                  ? styles.row_sky
                  : index % 4 === 2
                  ? styles.row_sand
                  : styles.row_lilac;

              const barStyle =
                index % 4 === 0
                  ? styles.bar_mint
                  : index % 4 === 1
                  ? styles.bar_sky
                  : index % 4 === 2
                  ? styles.bar_sand
                  : styles.bar_lilac;

              return (
                <View key={p.id} style={[styles.card, toneStyle]}>
                  <View style={[styles.accentBar, barStyle]} />

                  <View style={styles.cardMain}>
                    <View style={styles.cardTopRow}>
                      <Text style={styles.cardTitle} numberOfLines={1}>
                        {p.name}
                      </Text>

                      <Pressable
                        onPress={() => removeFromFav(p.id)}
                        style={({ pressed }) => [
                          styles.starBtn,
                          { opacity: pressed ? 0.55 : 1 },
                        ]}
                      >
                        <Ionicons name="star" size={16} color={styles._star as any} />
                      </Pressable>
                    </View>

                    <Text style={styles.cardSub} numberOfLines={2}>
                      {p.address}
                    </Text>

                    {cats ? (
                      <Text style={styles.cardHint} numberOfLines={2}>
                        {cats}
                      </Text>
                    ) : null}

                    <View style={styles.actions}>
                      <Pressable
                        style={({ pressed }) => [
                          styles.actionBtn,
                          { opacity: pressed ? 0.88 : 1 },
                        ]}
                        onPress={() => navigation.navigate("PointDetails", { point: p })}
                      >
                        <Ionicons
                          name="information-circle-outline"
                          size={15}
                          color={styles._actionIcon as any}
                        />
                        <Text style={styles.actionText}>Деталі</Text>
                      </Pressable>

                      <Pressable
                        style={({ pressed }) => [
                          styles.actionBtn,
                          { opacity: pressed ? 0.88 : 1 },
                        ]}
                        onPress={() => goToPointOnMap(p)}
                      >
                        <Ionicons
                          name="map-outline"
                          size={15}
                          color={styles._actionIcon as any}
                        />
                        <Text style={styles.actionText}>На мапі</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function createStyles(colors: any, isDark: boolean) {
  const text = colors?.text ?? (isDark ? "#F2F3F4" : "#111214");
  const sub = isDark ? "rgba(242,243,244,0.70)" : "rgba(17,18,20,0.64)";

  const tones = {
    mint: isDark ? "rgba(47,111,78,0.20)" : "rgba(231,242,236,0.92)",
    sky: isDark ? "rgba(70,120,200,0.18)" : "rgba(230,241,255,0.92)",
    sand: isDark ? "rgba(190,150,80,0.18)" : "rgba(252,244,232,0.94)",
    lilac: isDark ? "rgba(150,110,210,0.18)" : "rgba(244,236,255,0.94)",
  } as const;

  const bars = {
    mint: isDark ? "rgba(92,200,140,0.78)" : "rgba(47,111,78,0.62)",
    sky: isDark ? "rgba(120,170,255,0.78)" : "rgba(70,120,200,0.62)",
    sand: isDark ? "rgba(255,210,120,0.78)" : "rgba(190,150,80,0.62)",
    lilac: isDark ? "rgba(200,160,255,0.78)" : "rgba(150,110,210,0.62)",
  } as const;

  const shadow = Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 10 },
    },
    android: { elevation: 3 },
    default: {} as any,
  });

  const bgA = isDark ? "#0D0F11" : "#F7FBF8";
  const bgB = isDark ? "#0A0C0F" : "#FFFFFF";

  const pillBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.55)";
  const pillLine = isDark ? "rgba(255,255,255,0.10)" : "rgba(47,111,78,0.10)";

  const star = isDark ? "rgba(255,214,92,0.95)" : "#C79A1B";
  const actionIcon = isDark ? "rgba(92,200,140,0.92)" : "rgba(47,111,78,0.78)";

  return StyleSheet.create({
    _bgA: bgA as any,
    _bgB: bgB as any,
    _star: star as any,
    _actionIcon: actionIcon as any,

    root: { flex: 1, backgroundColor: "transparent" },

    bg: { ...StyleSheet.absoluteFillObject },

    texture: {
      ...StyleSheet.absoluteFillObject,
      opacity: isDark ? 0.06 : 0.08,
      transform: [{ scale: 1.15 }],
    },

    veil: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: isDark ? "rgba(0,0,0,0.10)" : "rgba(255,255,255,0.18)",
    },

    content: {
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 80,
      gap: 12,
      flexGrow: 1,
    },

    simpleTitle: {
      fontSize: 18,
      color: text,
      fontFamily: "Nunito_800ExtraBold",
      marginBottom: 6,
    },

    errorBox: {
      borderRadius: 18,
      padding: 12,
      backgroundColor: isDark ? "rgba(255,90,90,0.08)" : "rgba(255,90,90,0.06)",
      gap: 4,
      marginBottom: 4,
    },

    errorText: {
      fontSize: 12,
      color: text,
      fontFamily: "Manrope_700Bold",
    },

    errorHint: {
      fontSize: 12,
      color: sub,
      fontFamily: "Manrope_600SemiBold",
    },

    loadingWrap: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingTop: 60,
      paddingBottom: 40,
    },

    emptyWrap: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingTop: 80,
      paddingBottom: 40,
      paddingHorizontal: 20,
    },

    emptyCircle: {
      width: 72,
      height: 72,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 14,
      backgroundColor: "rgba(47,111,78,0.08)",
    },

    stateTitle: {
      fontSize: 16,
      color: text,
      fontFamily: "Nunito_800ExtraBold",
      textAlign: "center",
    },

    stateText: {
      marginTop: 8,
      textAlign: "center",
      fontSize: 13,
      color: sub,
      fontFamily: "Manrope_600SemiBold",
      lineHeight: 18,
    },

    list: {
      gap: 10,
    },

    card: {
      flexDirection: "row",
      borderRadius: 22,
      paddingVertical: 14,
      paddingHorizontal: 14,
      overflow: "hidden",
      ...shadow,
    },

    cardMain: {
      flex: 1,
      minWidth: 0,
      paddingLeft: 10,
    },

    cardTopRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
    },

    cardTitle: {
      flex: 1,
      fontSize: 14,
      color: text,
      fontFamily: "Nunito_700Bold",
    },

    cardSub: {
      marginTop: 6,
      fontSize: 12,
      color: sub,
      fontFamily: "Manrope_600SemiBold",
      lineHeight: 17,
    },

    cardHint: {
      marginTop: 6,
      fontSize: 12,
      color: sub,
      fontFamily: "Manrope_600SemiBold",
      lineHeight: 16,
    },

    starBtn: {
      width: 34,
      height: 34,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.65)",
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.10)" : "rgba(17,18,20,0.06)",
    },

    actions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      marginTop: 12,
    },

    actionBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.62)",
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.10)" : "rgba(17,18,20,0.06)",
    },

    actionText: {
      fontSize: 12,
      color: text,
      fontFamily: "Manrope_700Bold",
    },

    accentBar: {
      width: 6,
      borderRadius: 999,
      minHeight: 52,
    },

    row_mint: { backgroundColor: tones.mint },
    row_sky: { backgroundColor: tones.sky },
    row_sand: { backgroundColor: tones.sand },
    row_lilac: { backgroundColor: tones.lilac },

    bar_mint: { backgroundColor: bars.mint },
    bar_sky: { backgroundColor: bars.sky },
    bar_sand: { backgroundColor: bars.sand },
    bar_lilac: { backgroundColor: bars.lilac },
  });
}