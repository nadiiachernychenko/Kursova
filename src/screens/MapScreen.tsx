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
import MapView, { Marker, Region, PROVIDER_GOOGLE } from "react-native-maps";
import ClusteredMapView from "react-native-map-clustering";
import * as Location from "expo-location";
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
    if (selected === "all") return "Усі категорії";
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
        <View collapsable={false} renderToHardwareTextureAndroid style={styles.clusterOuter}>
          <View style={styles.clusterInner}>
            <Text
              style={styles.clusterText}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
            >
              {String(count)}
            </Text>
          </View>
        </View>
      </Marker>
    );
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.mapWrap}>
        {isLoading ? (
          <View style={styles.center}>
            <View style={styles.loaderCard}>
              <ActivityIndicator size="small" color="#2F9E77" />
              <Text style={styles.loadingText}>
                {loadingGeo ? "Отримую геолокацію…" : "Завантажую пункти…"}
              </Text>
            </View>
          </View>
        ) : (
          <>
            <ClusteredMapView
              ref={mapRef}
              onMapReady={() => setMapReady(true)}
              style={StyleSheet.absoluteFill}
              initialRegion={KYIV}
              showsUserLocation={false}
              showsMyLocationButton={false}
              onPress={() => setSelectedPoint(null)}
              radius={Platform.OS === "ios" ? 40 : 50}
              animationEnabled
              renderCluster={renderCluster}
              provider={PROVIDER_GOOGLE}
            >
              {userRegion && !permissionDenied ? (
                <Marker
                  coordinate={{
                    latitude: userRegion.latitude,
                    longitude: userRegion.longitude,
                  }}
                  anchor={{ x: 0.5, y: 0.5 }}
                  tracksViewChanges={false}
                >
                  <View style={styles.userDotOuter}>
                    <View style={styles.userDotInner} />
                  </View>
                </Marker>
              ) : null}

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

            <View style={styles.topOverlay}>
              <View style={styles.headerCard}>
                <View style={styles.actionsRow}>
                  <Pressable style={styles.filterBtn} onPress={() => setFilterOpen(true)}>
                    <Text style={styles.filterBtnText} numberOfLines={1}>
                      {activeFilterTitle}
                    </Text>
                  </Pressable>

                  <Pressable style={styles.iconBtnGreen} onPress={() => setSearchOpen(true)}>
                    <Text style={styles.iconBtnTextLight}>🔎</Text>
                  </Pressable>

                  <Pressable style={styles.iconBtnSoft} onPress={() => loadPoints(selected)}>
                    <Text style={styles.iconBtnText}>↻</Text>
                  </Pressable>
                </View>
              </View>
            </View>

            <View style={styles.fabs}>
              <Pressable
                style={[styles.fab, styles.fabPrimary]}
                onPress={() => mapRef.current?.animateToRegion(userRegion ?? KYIV, 900)}
              >
                <Text style={styles.fabText}>Я</Text>
              </Pressable>

              <Pressable
                style={styles.fab}
                onPress={() => mapRef.current?.animateToRegion(KYIV, 900)}
              >
                <Text style={styles.fabText}>Київ</Text>
              </Pressable>

              {focusOnly ? (
                <Pressable style={styles.fabWide} onPress={showAll}>
                  <Text style={styles.fabWideText}>Показати всі</Text>
                </Pressable>
              ) : null}
            </View>

            {error ? (
              <View style={styles.banner}>
                <Text style={styles.bannerTitle}>Помилка</Text>
                <Text style={styles.bannerText}>{error}</Text>
              </View>
            ) : null}

            {selectedPoint ? (
              <View style={styles.sheet}>
                <View style={styles.sheetHandle} />

                <Text style={styles.sheetTitle} numberOfLines={1}>
                  {selectedPoint.name}
                </Text>

                <Text style={styles.sheetAddr} numberOfLines={2}>
                  {selectedPoint.address}
                </Text>

                <View style={styles.categoryPill}>
                  <Text style={styles.categoryPillText} numberOfLines={2}>
                    {selectedPoint.categories
                      .map((id) => {
                        const c = CATEGORIES.find((x) => x.id === id);
                        return c ? `${c.emoji} ${c.title}` : id;
                      })
                      .join(" • ")}
                  </Text>
                </View>

                <View style={styles.sheetBtns}>
                  <Pressable
                    style={[styles.sheetBtn, styles.sheetBtnPrimary]}
                    onPress={() => openDirections(selectedPoint)}
                  >
                    <Text style={[styles.sheetBtnText, styles.sheetBtnTextPrimary]}>
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

                  <Pressable style={styles.closeMiniBtn} onPress={() => setSelectedPoint(null)}>
                    <Text style={styles.closeMiniBtnText}>✕</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}
          </>
        )}
      </View>

      <Modal
        visible={filterOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setFilterOpen(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>Фільтр</Text>

            <ScrollView
              style={{ maxHeight: 360 }}
              contentContainerStyle={{ paddingVertical: 6 }}
              showsVerticalScrollIndicator={false}
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
                <Text
                  style={[
                    styles.modalRowText,
                    selected === "all" && styles.modalRowTextActive,
                  ]}
                >
                  ✨ Усі категорії
                </Text>
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
                    <Text
                      style={[
                        styles.modalRowText,
                        active && styles.modalRowTextActive,
                      ]}
                    >
                      {c.emoji} {c.title}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Pressable style={styles.modalClose} onPress={() => setFilterOpen(false)}>
              <Text style={styles.modalCloseText}>Закрити</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={searchOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setSearchOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setSearchOpen(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>Пошук</Text>

            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Назва або адреса…"
              placeholderTextColor="rgba(29,67,55,0.42)"
              style={styles.searchInput}
              autoCorrect={false}
              autoCapitalize="none"
            />

            <View style={styles.suggestBox}>
              {query.trim().length === 0 ? (
                <Text style={styles.suggestEmpty}>Введи запит — покажу варіанти</Text>
              ) : suggestions.length === 0 ? (
                <Text style={styles.suggestEmpty}>Нічого не знайдено</Text>
              ) : (
                <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
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
                        { opacity: pressed ? 0.72 : 1 },
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
    shadowColor: "#0F2D24",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  android: { elevation: 7 },
  default: {},
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F8F4",
  },

  mapWrap: {
    flex: 1,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F8F4",
  },

  loaderCard: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(76,152,120,0.10)",
    alignItems: "center",
    ...shadow,
  },

  loadingText: {
    marginTop: 10,
    color: "#24483B",
    fontSize: 14,
    fontWeight: "700",
    fontFamily: Platform.OS === "ios" ? "Avenir Next" : "sans-serif-medium",
  },

  topOverlay: {
    position: "absolute",
    top: 6,
    left: 12,
    right: 12,
  },

  headerCard: {
    backgroundColor: "rgba(255,255,255,0.97)",
    borderRadius: 22,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(76,152,120,0.10)",
    ...shadow,
  },

  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  filterBtn: {
    flex: 1,
    minHeight: 46,
    borderRadius: 16,
    backgroundColor: "#EEF7F1",
    borderWidth: 1,
    borderColor: "rgba(76,152,120,0.14)",
    paddingHorizontal: 14,
    justifyContent: "center",
  },

  filterBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#264B3E",
    fontFamily: Platform.OS === "ios" ? "Avenir Next" : "sans-serif-medium",
  },

  iconBtnSoft: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: "#F5FAF7",
    borderWidth: 1,
    borderColor: "rgba(76,152,120,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },

  iconBtnGreen: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: "#4D9C79",
    borderWidth: 1,
    borderColor: "#4D9C79",
    alignItems: "center",
    justifyContent: "center",
  },

  iconBtnText: {
    fontSize: 16,
    color: "#23483B",
    fontWeight: "800",
    fontFamily: Platform.OS === "ios" ? "Avenir Next" : "sans-serif-medium",
  },

  iconBtnTextLight: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "800",
    fontFamily: Platform.OS === "ios" ? "Avenir Next" : "sans-serif-medium",
  },

  clusterOuter: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
    ...shadow,
  },

  clusterInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#4D9C79",
    alignItems: "center",
    justifyContent: "center",
  },

  clusterText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 15,
    includeFontPadding: false,
    textAlign: "center",
    textAlignVertical: "center",
    fontFamily: Platform.OS === "ios" ? "Avenir Next" : "sans-serif-medium",
  },

  userDotOuter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(66,133,244,0.20)",
    alignItems: "center",
    justifyContent: "center",
  },

  userDotInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#4285F4",
    borderWidth: 2.5,
    borderColor: "#FFFFFF",
  },

  fabs: {
    position: "absolute",
    right: 12,
    top: 86,
    gap: 10,
    alignItems: "flex-end",
  },

  fab: {
    minWidth: 52,
    height: 48,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.96)",
    borderWidth: 1,
    borderColor: "rgba(76,152,120,0.10)",
    alignItems: "center",
    justifyContent: "center",
    ...shadow,
  },

  fabPrimary: {
    backgroundColor: "#DDF1E6",
    borderColor: "rgba(76,152,120,0.14)",
  },

  fabText: {
    fontSize: 14,
    color: "#24483B",
    fontWeight: "700",
    fontFamily: Platform.OS === "ios" ? "Avenir Next" : "sans-serif-medium",
  },

  fabWide: {
    minHeight: 46,
    borderRadius: 16,
    backgroundColor: "#24483B",
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    ...shadow,
  },

  fabWideText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
    fontFamily: Platform.OS === "ios" ? "Avenir Next" : "sans-serif-medium",
  },

  banner: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: "#FFF7F7",
    borderWidth: 1,
    borderColor: "rgba(220,70,70,0.14)",
    borderRadius: 18,
    padding: 13,
    ...shadow,
  },

  bannerTitle: {
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 4,
    color: "#8C2F2F",
    fontFamily: Platform.OS === "ios" ? "Avenir Next" : "sans-serif-medium",
  },

  bannerText: {
    fontSize: 13,
    lineHeight: 18,
    color: "#7A4545",
    fontFamily: Platform.OS === "ios" ? "Avenir Next" : "sans-serif",
  },

  sheet: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: "rgba(255,255,255,0.98)",
    borderWidth: 1,
    borderColor: "rgba(76,152,120,0.10)",
    borderRadius: 24,
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 14,
    ...shadow,
  },

  sheetHandle: {
    alignSelf: "center",
    width: 46,
    height: 5,
    borderRadius: 999,
    backgroundColor: "rgba(76,152,120,0.18)",
    marginBottom: 12,
  },

  sheetTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#16372C",
    fontFamily: Platform.OS === "ios" ? "Avenir Next" : "sans-serif-medium",
  },

  sheetAddr: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
    color: "#537166",
    fontFamily: Platform.OS === "ios" ? "Avenir Next" : "sans-serif",
  },

  categoryPill: {
    alignSelf: "flex-start",
    marginTop: 10,
    backgroundColor: "#EFF8F2",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },

  categoryPillText: {
    fontSize: 12,
    color: "#295141",
    fontWeight: "700",
    fontFamily: Platform.OS === "ios" ? "Avenir Next" : "sans-serif-medium",
  },

  sheetBtns: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
    alignItems: "center",
  },

  sheetBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 46,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(76,152,120,0.12)",
    backgroundColor: "#F7FBF8",
  },

  sheetBtnPrimary: {
    backgroundColor: "#4D9C79",
    borderColor: "#4D9C79",
  },

  sheetBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1E4134",
    fontFamily: Platform.OS === "ios" ? "Avenir Next" : "sans-serif-medium",
  },

  sheetBtnTextPrimary: {
    color: "#FFFFFF",
  },

  closeMiniBtn: {
    width: 46,
    height: 46,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(76,152,120,0.10)",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  closeMiniBtnText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#23483B",
    fontFamily: Platform.OS === "ios" ? "Avenir Next" : "sans-serif-medium",
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15,22,20,0.28)",
    padding: 14,
    justifyContent: "center",
  },

  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(76,152,120,0.10)",
    padding: 14,
    ...shadow,
  },

  modalTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#16372C",
    marginBottom: 10,
    fontFamily: Platform.OS === "ios" ? "Avenir Next" : "sans-serif-medium",
  },

  modalRow: {
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.07)",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 13,
    backgroundColor: "#FFFFFF",
    marginBottom: 8,
  },

  modalRowActive: {
    borderColor: "#4D9C79",
    backgroundColor: "#EFF8F2",
  },

  modalRowText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1D4034",
    fontFamily: Platform.OS === "ios" ? "Avenir Next" : "sans-serif-medium",
  },

  modalRowTextActive: {
    color: "#3B8868",
  },

  modalClose: {
    alignSelf: "flex-end",
    marginTop: 8,
    borderWidth: 1,
    borderColor: "rgba(76,152,120,0.10)",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: "#F7FBF8",
  },

  modalCloseText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#23483B",
    fontFamily: Platform.OS === "ios" ? "Avenir Next" : "sans-serif-medium",
  },

  searchInput: {
    borderWidth: 1,
    borderColor: "rgba(76,152,120,0.12)",
    borderRadius: 16,
    paddingHorizontal: 13,
    paddingVertical: 11,
    fontSize: 14,
    fontWeight: "700",
    color: "#16372C",
    backgroundColor: "#F8FCF9",
    fontFamily: Platform.OS === "ios" ? "Avenir Next" : "sans-serif-medium",
  },

  suggestBox: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "rgba(76,152,120,0.10)",
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },

  suggestRow: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },

  suggestTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#16372C",
    fontFamily: Platform.OS === "ios" ? "Avenir Next" : "sans-serif-medium",
  },

  suggestSub: {
    marginTop: 3,
    fontSize: 12,
    color: "#59746A",
    fontFamily: Platform.OS === "ios" ? "Avenir Next" : "sans-serif",
  },

  suggestEmpty: {
    padding: 12,
    color: "#5D746D",
    fontWeight: "700",
    fontFamily: Platform.OS === "ios" ? "Avenir Next" : "sans-serif-medium",
  },
});