import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Linking,
  Modal,
  TextInput,
  ScrollView,
  Platform,
} from "react-native";
import AppTopBar from "../components/AppTopBar";
import MapView, { Marker, Region } from "react-native-maps";
import ClusteredMapView from "react-native-map-clustering";
import * as Location from "expo-location";
import { useAppTheme } from "../lib/theme"; 
import { CATEGORIES, type WasteCategoryId } from "../data/sorting";
import { supabase } from "../lib/supabase";
import { useFocusEffect, useNavigation } from "@react-navigation/native";

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

const KYIV: Region = {
  latitude: 50.4501,
  longitude: 30.5234,
  latitudeDelta: 0.12,
  longitudeDelta: 0.12,
};

function norm(s: string) {
  return (s ?? "").toLowerCase().trim();
}

export default function MapScreen({ route }: any) {
  const navigation = useNavigation<any>();
  const mapRef = useRef<MapView>(null);

  const [mapReady, setMapReady] = useState(false);

  const [selected, setSelected] = useState<WasteCategoryId | "all">("all");
  const [selectedPoint, setSelectedPoint] = useState<EcoPoint | null>(null);

  const [loadingGeo, setLoadingGeo] = useState(true);
  const [loadingPoints, setLoadingPoints] = useState(true);

  const [userRegion, setUserRegion] = useState<Region | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const [points, setPoints] = useState<EcoPoint[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [focusOnly, setFocusOnly] = useState(false);

  const [filterOpen, setFilterOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setPermissionDenied(true);
          setLoadingGeo(false);
          return;
        }
        const loc = await Location.getCurrentPositionAsync({});
        const reg: Region = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        };
        setUserRegion(reg);
      } finally {
        setLoadingGeo(false);
      }
    })();
  }, []);

  const loadPoints = useCallback(async (filter: WasteCategoryId | "all") => {
    setLoadingPoints(true);
    setError(null);

    try {
      let q = supabase
        .from("eco_points")
        .select(
          "id,name,address,lat,lng,categories,materials,phone,hours,hours_json,website,note,status"
        )
        .eq("status", "approved");

      if (filter !== "all") q = q.contains("categories", [filter]);

      const { data, error } = await q;
      if (error) throw error;

      setPoints((data ?? []) as EcoPoint[]);
    } catch (e: any) {
      setError(e?.message ?? "Unknown error");
      setPoints([]);
    } finally {
      setLoadingPoints(false);
    }
  }, []);

  const loadPointById = useCallback(async (id: string) => {
    const { data, error } = await supabase
      .from("eco_points")
      .select(
        "id,name,address,lat,lng,categories,materials,phone,hours,hours_json,website,note,status"
      )
      .eq("status", "approved")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("Точку не знайдено або вона не approved");
    return data as EcoPoint;
  }, []);

  useEffect(() => {
    if (focusOnly) return;
    setSelectedPoint(null);
    loadPoints(selected);
  }, [selected, loadPoints, focusOnly]);

  const animateToPoint = useCallback((p: EcoPoint) => {
    const region: Region = {
      latitude: p.lat,
      longitude: p.lng,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
    requestAnimationFrame(() => {
      mapRef.current?.animateToRegion(region, 900);
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      const focusId: string | undefined = route?.params?.focusId;
      const focusNonce: number | undefined = route?.params?.focusNonce;
      const fo: boolean | undefined = route?.params?.focusOnly;

      if (!focusId || !focusNonce) return;

      let alive = true;

      (async () => {
        try {
          if (fo) setFocusOnly(true);

          const p = await loadPointById(focusId);
          if (!alive) return;

          setSelectedPoint(p);
          if (fo) setPoints([p]);

          const t = setInterval(() => {
            if (!alive) return;
            if (mapReady) {
              clearInterval(t);
              animateToPoint(p);
            }
          }, 100);

          navigation.setParams({
            focusId: undefined,
            focusNonce: undefined,
            focusOnly: undefined,
          });
        } catch (e: any) {
          if (!alive) return;
          setError(e?.message ?? "Не вдалося відкрити точку");
        }
      })();

      return () => {
        alive = false;
      };
    }, [
      route?.params?.focusNonce,
      mapReady,
      animateToPoint,
      loadPointById,
      navigation,
    ])
  );

  const isLoading = loadingGeo || loadingPoints;

  function openDirections(point: EcoPoint) {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${point.lat},${point.lng}`;
    Linking.openURL(url);
  }

  const showAll = async () => {
    setFocusOnly(false);
    setSelectedPoint(null);
    setQuery("");
    await loadPoints(selected);
  };

  const suggestions = useMemo(() => {
    const q = norm(query);
    if (!q) return [];
    const list = points.filter((p) =>
      norm(`${p.name} ${p.address}`).includes(q)
    );
    return list.slice(0, 10);
  }, [query, points]);

  const activeFilterTitle = useMemo(() => {
    if (selected === "all") return "Усі";
    const c = CATEGORIES.find((x) => x.id === selected);
    return c ? `${c.emoji} ${c.title}` : "Фільтр";
  }, [selected]);
const renderCluster = useCallback((cluster: any) => {
  const { id, geometry, properties } = cluster;
  const count: number = properties.point_count;

  const coordinate = {
    latitude: geometry.coordinates[1],
    longitude: geometry.coordinates[0],
  };

  return (
    <Marker
      key={`cluster-${id}`}
      coordinate={coordinate}
      tracksViewChanges={true}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <View
        collapsable={false} 
        renderToHardwareTextureAndroid 
        style={styles.clusterOuter}
      >
        <Text
          style={styles.clusterText}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.75}
        >
          {String(count)}
        </Text>
      </View>
    </Marker>
  );
}, []);

 


  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Text style={styles.topTitle}>Карта</Text>

        <View style={styles.topBtns}>
          <Pressable style={styles.topBtn} onPress={() => setFilterOpen(true)}>
            <Text style={styles.topBtnText}>{activeFilterTitle}</Text>
          </Pressable>

          <Pressable
            style={styles.topBtnIcon}
            onPress={() => setSearchOpen(true)}
          >
            <Text style={styles.topBtnIconText}>🔎</Text>
          </Pressable>

          <Pressable
            style={styles.topBtnIcon}
            onPress={() => loadPoints(selected)}
          >
            <Text style={styles.topBtnIconText}>↻</Text>
          </Pressable>
        </View>
      </View>

      {/* MAP */}
      <View style={styles.mapWrap}>
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator />
            <Text style={styles.loadingText}>
              {loadingGeo ? "Отримую геолокацію…" : "Завантажую пункти…"}
            </Text>
          </View>
        ) : (
          <>
            <ClusteredMapView
              ref={mapRef}
              onMapReady={() => setMapReady(true)}
              style={StyleSheet.absoluteFill}
              initialRegion={KYIV}
              showsUserLocation={!permissionDenied}
              showsMyLocationButton={false}
              onPress={() => setSelectedPoint(null)}
              radius={Platform.OS === "ios" ? 40 : 50}
              animationEnabled
              renderCluster={renderCluster}
            >
              {points.map((p) => (
                <Marker
                  key={p.id}
                  coordinate={{ latitude: p.lat, longitude: p.lng }}
                  title={p.name}
                  description={p.address}
                  onPress={() => setSelectedPoint(p)}
                  tracksViewChanges={false}
                />
              ))}
            </ClusteredMapView>

            {/* Floating buttons */}
            <View style={styles.fabs}>
              <Pressable
                style={styles.fab}
                onPress={() =>
                  mapRef.current?.animateToRegion(userRegion ?? KYIV, 900)
                }
              >
                <Text style={styles.fabText}>📍</Text>
              </Pressable>

              <Pressable
                style={styles.fab}
                onPress={() => mapRef.current?.animateToRegion(KYIV, 900)}
              >
                <Text style={styles.fabText}>🏙️</Text>
              </Pressable>

              {focusOnly ? (
                <Pressable style={styles.fabWide} onPress={showAll}>
                  <Text style={styles.fabWideText}>Показати всі</Text>
                </Pressable>
              ) : null}
            </View>

            {error ? (
              <View style={styles.banner}>
                <Text style={styles.bannerTitle}>⚠️ Помилка</Text>
                <Text style={styles.bannerText}>{error}</Text>
              </View>
            ) : null}

            {/* Bottom sheet */}
            {selectedPoint ? (
              <View style={styles.sheet}>
                <View style={styles.sheetHandle} />

                <Text style={styles.sheetTitle} numberOfLines={1}>
                  {selectedPoint.name}
                </Text>
                <Text style={styles.sheetAddr} numberOfLines={2}>
                  {selectedPoint.address}
                </Text>

                <Text style={styles.sheetCats} numberOfLines={2}>
                  {selectedPoint.categories
                    .map((id) => {
                      const c = CATEGORIES.find((x) => x.id === id);
                      return c ? `${c.emoji} ${c.title}` : id;
                    })
                    .join(" • ")}
                </Text>

                <View style={styles.sheetBtns}>
                  <Pressable
                    style={[styles.sheetBtn, styles.sheetBtnPrimary]}
                    onPress={() => openDirections(selectedPoint)}
                  >
                    <Text
                      style={[styles.sheetBtnText, styles.sheetBtnTextPrimary]}
                    >
                      Маршрут
                    </Text>
                  </Pressable>

                  <Pressable
                    style={styles.sheetBtn}
                    onPress={() =>
                      navigation.navigate("PointDetails", {
                        point: selectedPoint,
                      })
                    }
                  >
                    <Text style={styles.sheetBtnText}>Деталі</Text>
                  </Pressable>

                  <Pressable
                    style={styles.sheetBtn}
                    onPress={() => setSelectedPoint(null)}
                  >
                    <Text style={styles.sheetBtnText}>✖</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}
          </>
        )}
      </View>

      {/* Filter modal */}
      <Modal
        visible={filterOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterOpen(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setFilterOpen(false)}
        >
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>Фільтр</Text>

            <ScrollView
              style={{ maxHeight: 360 }}
              contentContainerStyle={{ paddingVertical: 6 }}
            >
              <Pressable
                style={[
                  styles.modalRow,
                  selected === "all" && styles.modalRowActive,
                ]}
                onPress={() => {
                  setFocusOnly(false);
                  setSelected("all");
                  setFilterOpen(false);
                }}
              >
                <Text style={styles.modalRowText}>✨ Усі</Text>
              </Pressable>

              {CATEGORIES.map((c) => {
                const active = selected === c.id;
                return (
                  <Pressable
                    key={c.id}
                    style={[styles.modalRow, active && styles.modalRowActive]}
                    onPress={() => {
                      setFocusOnly(false);
                      setSelected(c.id);
                      setFilterOpen(false);
                    }}
                  >
                    <Text style={styles.modalRowText}>
                      {c.emoji} {c.title}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Pressable
              style={styles.modalClose}
              onPress={() => setFilterOpen(false)}
            >
              <Text style={styles.modalCloseText}>Закрити</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Search modal */}
      <Modal
        visible={searchOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setSearchOpen(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setSearchOpen(false)}
        >
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>Пошук</Text>

            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Назва або адреса…"
              placeholderTextColor="rgba(0,0,0,0.45)"
              style={styles.searchInput}
              autoCorrect={false}
              autoCapitalize="none"
            />

            <View style={styles.suggestBox}>
              {query.trim().length === 0 ? (
                <Text style={styles.suggestEmpty}>
                  Введи запит — покажу варіанти
                </Text>
              ) : suggestions.length === 0 ? (
                <Text style={styles.suggestEmpty}>Нічого не знайдено</Text>
              ) : (
                <ScrollView style={{ maxHeight: 320 }}>
                  {suggestions.map((p) => (
                    <Pressable
                      key={p.id}
                      onPress={() => {
                        setSelectedPoint(p);
                        setSearchOpen(false);
                        animateToPoint(p);
                      }}
                      style={({ pressed }) => [
                        styles.suggestRow,
                        { opacity: pressed ? 0.6 : 1 },
                      ]}
                    >
                      <Text style={styles.suggestTitle} numberOfLines={1}>
                        {p.name}
                      </Text>
                      <Text style={styles.suggestSub} numberOfLines={1}>
                        {p.address}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              )}
            </View>

            <Pressable
              style={styles.modalClose}
              onPress={() => {
                setSearchOpen(false);
                setQuery("");
              }}
            >
              <Text style={styles.modalCloseText}>Закрити</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const shadow = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  android: { elevation: 6 },
  default: {},
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white" },

  topBar: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.06)",
    backgroundColor: "white",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  topTitle: { fontSize: 18, fontWeight: "900", color: "#111" },
  topBtns: { flexDirection: "row", gap: 8, alignItems: "center" },

  topBtn: {
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.10)",
    backgroundColor: "white",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  topBtnText: { fontSize: 13, fontWeight: "800", color: "#111" },

  topBtnIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.10)",
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },
  topBtnIconText: { fontSize: 15, fontWeight: "900", color: "#111" },

  mapWrap: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { marginTop: 10, opacity: 0.75, color: "#111" },

 clusterOuter: {
  width: 56,
  height: 56,
  borderRadius: 28,
  padding: 2, 
  backgroundColor: "#111",
  borderWidth: 3,
  borderColor: "rgba(255,255,255,0.92)",
  alignItems: "center",
  justifyContent: "center",
},
  clusterInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
clusterText: {
  color: "white",
  fontWeight: "900",
  fontSize: 16,
  lineHeight: 18,            
  includeFontPadding: false,
  textAlign: "center",
  textAlignVertical: "center",
},

  fabs: { position: "absolute", right: 12, top: 12, gap: 10 },
  fab: {
    width: 44,
    height: 44,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.10)",
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    ...shadow,
  },
  fabText: { fontSize: 18, fontWeight: "900" },
  fabWide: {
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.10)",
    backgroundColor: "white",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: "center",
    ...shadow,
  },
  fabWideText: { fontSize: 12, fontWeight: "900", color: "#111" },

  banner: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    borderRadius: 18,
    padding: 12,
    ...shadow,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 4,
    color: "#111",
  },
  bannerText: {
    fontSize: 13,
    opacity: 0.8,
    lineHeight: 18,
    color: "#111",
  },

  sheet: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.10)",
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 14,
    ...shadow,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.10)",
    marginBottom: 10,
  },
  sheetTitle: { fontSize: 16, fontWeight: "900", color: "#111" },
  sheetAddr: { marginTop: 6, fontSize: 13, opacity: 0.8, color: "#111" },
  sheetCats: { marginTop: 8, fontSize: 12, opacity: 0.7, color: "#111" },

  sheetBtns: { flexDirection: "row", gap: 10, marginTop: 12 },
  sheetBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.10)",
    backgroundColor: "white",
  },
  sheetBtnPrimary: {
    backgroundColor: "#111",
    borderColor: "#111",
  },
  sheetBtnText: { fontSize: 13, fontWeight: "900", color: "#111" },
  sheetBtnTextPrimary: { color: "white" },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
    padding: 14,
    justifyContent: "center",
  },
  modalCard: {
    backgroundColor: "white",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.10)",
    padding: 14,
    ...shadow,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#111",
    marginBottom: 10,
  },

  modalRow: {
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "white",
    marginBottom: 8,
  },
  modalRowActive: { borderColor: "rgba(0,0,0,0.35)" },
  modalRowText: { fontSize: 13, fontWeight: "900", color: "#111" },

  modalClose: {
    alignSelf: "flex-end",
    marginTop: 6,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "white",
  },
  modalCloseText: { fontSize: 12, fontWeight: "900", color: "#111" },

  searchInput: {
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.10)",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: "800",
    color: "#111",
    backgroundColor: "white",
  },
  suggestBox: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "white",
  },
  suggestRow: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.06)",
  },
  suggestTitle: { fontSize: 13, fontWeight: "900", color: "#111" },
  suggestSub: { marginTop: 2, fontSize: 12, opacity: 0.75, color: "#111" },
  suggestEmpty: { padding: 12, opacity: 0.75, fontWeight: "800", color: "#111" },
});
