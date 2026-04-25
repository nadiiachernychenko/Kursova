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
const getCategoryTone = (id: string, title: string) => {
  const key = `${id} ${title}`.toLowerCase();

  if (key.includes("пап") || key.includes("paper")) {
    return { color: "#C79A3B", bg: "#FFF7E6" };
  }

  if (key.includes("пласт") || key.includes("plastic")) {
    return { color: "#4D9C79", bg: "#EEF8F2" };
  }

  if (key.includes("скл") || key.includes("glass")) {
    return { color: "#6B9CCF", bg: "#F1F7FD" };
  }

  if (key.includes("мет") || key.includes("metal")) {
    return { color: "#8A9499", bg: "#F3F5F6" };
  }

  if (key.includes("орган") || key.includes("organic")) {
    return { color: "#6FA05C", bg: "#F0F7EC" };
  }

  if (key.includes("елект") || key.includes("elect")) {
    return { color: "#8C79C9", bg: "#F4F1FB" };
  }

  return { color: "#4D9C79", bg: "#EEF8F2" };
};
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

const goToMe = useCallback(async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
      setPermissionDenied(true);
      return;
    }

    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    const reg: Region = {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };

    setPermissionDenied(false);
    setUserRegion(reg);

    requestAnimationFrame(() => {
      mapRef.current?.animateToRegion(reg, 900);
    });
  } catch (e: any) {
    setError(e?.message ?? "Не вдалося отримати геолокацію");
  }
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
return c ? c.title : "Фільтр";
  }, [selected]);

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
            <MapView
              ref={mapRef}
              onMapReady={() => setMapReady(true)}
              style={StyleSheet.absoluteFill}
              initialRegion={KYIV}
              showsUserLocation={false}
              showsMyLocationButton={false}
              onPress={() => setSelectedPoint(null)}
              provider={PROVIDER_GOOGLE}
            >
            {userRegion && !permissionDenied ? (
  <Marker
    coordinate={{
      latitude: userRegion.latitude,
      longitude: userRegion.longitude,
    }}
    anchor={{ x: 0.5, y: 0.5 }}
tracksViewChanges={true}
    zIndex={9999}
  >
    <View style={styles.userDotWrapper}>
      <View style={styles.userDotOuter}>
        <View style={styles.userDotInner} />
      </View>
    </View>
  </Marker>
) : null}

            {points.map((p) => (
  <Marker
    key={p.id}
    coordinate={{
      latitude: Number(p.lat),
      longitude: Number(p.lng),
    }}
    onPress={() => setSelectedPoint(p)}
    image={require("../../assets/marker-green-96.png")}
  />
))}
           </MapView>
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
  onPress={goToMe}
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
  style={{ maxHeight: 390 }}
  contentContainerStyle={{ paddingVertical: 6, gap: 8 }}
  showsVerticalScrollIndicator={false}
>
  <Pressable
    style={[
      styles.modalCategoryRow,
      selected === "all" && styles.modalCategoryRowActive,
    ]}
    onPress={() => {
      setFocusOnly(false);
      setSelected("all");
      setFilterOpen(false);
    }}
  >
    <View style={[styles.modalCategoryColor, { backgroundColor: "#4D9C79" }]} />

    <Text
      style={[
        styles.modalCategoryTitle,
        selected === "all" && styles.modalCategoryTitleActive,
      ]}
    >
      Усі категорії
    </Text>
  </Pressable>

  {CATEGORIES.map((c) => {
  const active = selected === c.id;
  const tone = getCategoryTone(c.id, c.title);

  return (
    <Pressable
      key={c.id}
      style={[
        styles.modalCategoryRow,
        {
          backgroundColor: tone.bg,
        },
        active && styles.modalCategoryRowActive,
      ]}
      onPress={() => {
        setFocusOnly(false);
        setSelected(c.id);
        setFilterOpen(false);
      }}
    >
      <View
        style={[
          styles.modalCategoryColor,
          { backgroundColor: tone.color },
        ]}
      />

      <Text
        style={[
          styles.modalCategoryTitle,
          active && styles.modalCategoryTitleActive,
        ]}
      >
        {c.title}
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
          <Pressable style={styles.searchModalCard} onPress={() => {}}>
  <Text style={styles.searchModalTitle}>Пошук</Text>
  <Text style={styles.searchModalSub}>
    Знайди пункт за назвою або адресою
  </Text>

  <View style={styles.searchInputWrap}>
    <TextInput
      value={query}
      onChangeText={setQuery}
      placeholder="Тиць сюди"
      placeholderTextColor="#8DA096"
      style={styles.searchInputNew}
      autoCorrect={false}
      autoCapitalize="none"
    />
  </View>

<View style={[styles.suggestBox, { marginTop: 10 }]}>
      {query.trim().length === 0 ? (null) : suggestions.length === 0 ? (
      <Text style={styles.suggestEmpty}>Нічого не знайдено</Text>
    ) : (
      <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
        {suggestions.map((p) => (
          <Pressable
            key={p.id}
            onPress={() => {
              setSelectedPoint(p);
              setSearchOpen(false);
              animateToPoint(p);
            }}
            style={({ pressed }) => [
              styles.searchResultRow,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <View style={styles.searchDot} />

            <View style={styles.searchTextBox}>
              <Text style={styles.searchTitle} numberOfLines={1}>
                {p.name}
              </Text>
              <Text style={styles.searchAddress} numberOfLines={1}>
                {p.address}
              </Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    )}
  </View>

  <Pressable
    style={styles.searchCloseBtn}
    onPress={() => {
      setSearchOpen(false);
      setQuery("");
    }}
  >
    <Text style={styles.searchCloseText}>Закрити</Text>
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
modalCategoryRow: {
  flexDirection: "row",
  alignItems: "center",
  minHeight: 48,
  borderRadius: 18,
  paddingHorizontal: 12,
},

modalCategoryRowActive: {
  borderColor: "rgba(77,156,121,0.35)",
  backgroundColor: "#F3FAF6",
},
modalCategoryTitle: {
  flex: 1,
  fontSize: 14,
  fontWeight: "800",
  color: "#1D4034",
  fontFamily: Platform.OS === "ios" ? "Avenir Next" : "sans-serif-medium",
},

modalCategoryTitleActive: {
  color: "#3B8868",
},

topOverlay: {
  position: "absolute",
  top: 10,
  left: 14,
  right: 14,
},

headerCard: {
  backgroundColor: "rgba(255,255,255,0.96)",
  borderRadius: 24,
  padding: 10,
  borderWidth: 1,
  borderColor: "rgba(76,152,120,0.12)",
  ...shadow,
},

  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

filterBtn: {
  flex: 1,
  minHeight: 44,
  borderRadius: 16,
  backgroundColor: "#EFF8F2",
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
  width: 44,
  height: 44,
  borderRadius: 16,
  backgroundColor: "#F5FAF7",
  borderWidth: 1,
  borderColor: "rgba(76,152,120,0.12)",
  alignItems: "center",
  justifyContent: "center",
},

iconBtnGreen: {
  width: 44,
  height: 44,
  borderRadius: 16,
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
pointMarker: {
  width: 30,
  height: 30,
  borderRadius: 15,
  backgroundColor: "#4D9C79",
  borderWidth: 3,
  borderColor: "#FFFFFF",
  alignItems: "center",
  justifyContent: "center",
  shadowColor: "#0F2D24",
  shadowOpacity: 0.22,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 4 },
  elevation: 6,
},

pointMarkerDot: {
  width: 8,
  height: 8,
  borderRadius: 4,
  backgroundColor: "#FFFFFF",
},
  userDotOuter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(66,133,244,0.20)",
    alignItems: "center",
    justifyContent: "center",
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
modalCategoryColor: {
  width: 6,
  height: 28,
  borderRadius: 999,
  marginRight: 12,
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
userDotWrapper: {
  alignItems: "center",
  justifyContent: "center",
},
  closeMiniBtnText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#23483B",
    fontFamily: Platform.OS === "ios" ? "Avenir Next" : "sans-serif-medium",
  },
searchModalCard: {
  backgroundColor: "#FFFFFF",
  borderRadius: 26,
  padding: 16,
  borderWidth: 1,
  borderColor: "rgba(76,152,120,0.12)",
},

searchModalTitle: {
  fontSize: 20,
  fontWeight: "900",
  color: "#173626",
},

searchModalSub: {
  marginTop: 4,
  fontSize: 13,
  color: "#7A8F86",
},

searchInputWrap: {
  marginTop: 14,
  minHeight: 46,
  borderRadius: 18,
  backgroundColor: "#F4FBF6",
  borderWidth: 1,
  borderColor: "rgba(76,152,120,0.16)",
  paddingHorizontal: 14,
  justifyContent: "center",
},

searchInputNew: {
  fontSize: 14,
  fontWeight: "700",
  color: "#24483B",
},

searchResultRow: {
  flexDirection: "row",
  alignItems: "center",
  minHeight: 52,
  borderRadius: 16,
  backgroundColor: "#F6FBF8",
  paddingHorizontal: 12,
  marginTop: 8,
  borderWidth: 1,
  borderColor: "rgba(76,152,120,0.08)",
},

searchDot: {
  width: 6,
  height: 6,
  borderRadius: 3,
  backgroundColor: "#4D9C79",
  marginRight: 10,
},

searchTextBox: {
  flex: 1,
},

searchTitle: {
  fontSize: 14,
  fontWeight: "800",
  color: "#1D4034",
},

searchAddress: {
  marginTop: 2,
  fontSize: 12,
  color: "#7A8F86",
},

searchCloseBtn: {
  marginTop: 14,
  minHeight: 44,
  borderRadius: 18,
  backgroundColor: "#4D9C79",
  alignItems: "center",
  justifyContent: "center",
  shadowColor: "#000",
  shadowOpacity: 0.08,
  shadowRadius: 6,
  shadowOffset: { width: 0, height: 3 },
  elevation: 3,
},

searchCloseText: {
  color: "#FFFFFF",
  fontWeight: "800",
  fontSize: 14,
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

userDotInner: {
  width: 12,
  height: 12,
  borderRadius: 6,
  backgroundColor: "#3478F6", // сама точка
  borderWidth: 2,
  borderColor: "#FFFFFF",
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