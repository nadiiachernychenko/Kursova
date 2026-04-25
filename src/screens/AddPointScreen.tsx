import { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Alert,
  ScrollView,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import MapView, { Marker, Region, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";

import { CATEGORIES, type WasteCategoryId } from "../data/sorting";
import { supabase } from "../lib/supabase";

const KYIV_CENTER: Region = {
  latitude: 50.4501,
  longitude: 30.5234,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

function normalizePhone(p: string) {
  return p.replace(/[^\d+]/g, "");
}

function normalizeAddress(a: string) {
  const s = a.trim();
  if (!s) return s;
  const lower = s.toLowerCase();
  if (!lower.includes("київ") && !lower.includes("kyiv")) {
    return `${s}, Київ`;
  }
  return s;
}

function buildAddressFromNominatim(item: any) {
  const addr = item?.address ?? {};

  const parts = [
    addr.road || addr.pedestrian || addr.footway || addr.cycleway,
    addr.house_number,
  ].filter(Boolean);

  const streetLine = parts.join(", ");

  const area =
    addr.suburb ||
    addr.city_district ||
    addr.neighbourhood ||
    addr.town ||
    addr.village;

  const city = addr.city || addr.town || addr.village || "Київ";

  return [streetLine, area, city].filter(Boolean).join(", ");
}

export default function AddPointScreen({ navigation }: any) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [note, setNote] = useState("");

  const [categories, setCategories] = useState<WasteCategoryId[]>([]);
  const [materials, setMaterials] = useState("");

  const [region, setRegion] = useState<Region | null>(null);
  const [geoStatus, setGeoStatus] = useState<"idle" | "ok" | "fail">("idle");

  const [finding, setFinding] = useState(false);
  const [sending, setSending] = useState(false);
  const [updatingAddress, setUpdatingAddress] = useState(false);

  const canSend = useMemo(() => {
    return (
      name.trim().length > 0 &&
      address.trim().length > 0 &&
      categories.length > 0 &&
      region !== null
    );
  }, [name, address, categories, region]);

  const canAdjustMarker = region !== null && address.trim().length > 0;

  function toggleCategory(id: WasteCategoryId) {
    setCategories((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function geocodeAddress() {
    const a = normalizeAddress(address);
    if (!a) {
      Alert.alert("Введи адресу");
      return;
    }

    Keyboard.dismiss();
    setFinding(true);
    setGeoStatus("idle");

    try {
      const q = encodeURIComponent(`${a}, Ukraine`);
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=1&q=${q}`;

      const res = await fetch(url, {
        headers: {
          "User-Agent": "EcoLifeApp/1.0",
          "Accept-Language": "uk",
        },
      });

      const data = await res.json();

      if (!Array.isArray(data) || data.length === 0) {
        setGeoStatus("fail");
        Alert.alert("Не знайдено адресу", "Спробуй уточнити район, вулицю або номер.");
        return;
      }

      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon);

      const r: Region = {
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

      setRegion(r);
      setGeoStatus("ok");
    } catch (e: any) {
      setGeoStatus("fail");
      Alert.alert("Помилка", e?.message ?? "Не вдалося знайти адресу");
    } finally {
      setFinding(false);
    }
  }

  async function useMyLocation() {
    Keyboard.dismiss();

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Немає доступу до геолокації");
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      setRegion({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      setGeoStatus("ok");
    } catch {
      Alert.alert("Помилка", "Не вдалося отримати твоє місцезнаходження");
    }
  }

  async function reverseGeocodeAndUpdateAddress(latitude: number, longitude: number) {
    try {
      setUpdatingAddress(true);

      const url =
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1` +
        `&lat=${latitude}&lon=${longitude}`;

      const res = await fetch(url, {
        headers: {
          "User-Agent": "EcoLifeApp/1.0",
          "Accept-Language": "uk",
        },
      });

      const data = await res.json();

      const prettyAddress =
        buildAddressFromNominatim(data) ||
        data?.display_name ||
        "";

      if (prettyAddress.trim()) {
        setAddress(prettyAddress);
        setGeoStatus("ok");
      } else {
        Alert.alert("Не вдалося оновити адресу");
      }
    } catch (e: any) {
      Alert.alert("Помилка", e?.message ?? "Не вдалося переоновити адресу");
    } finally {
      setUpdatingAddress(false);
    }
  }

  function askAboutAddressRefresh(latitude: number, longitude: number) {
    Alert.alert(
      "Оновити адресу?",
      "Ти перетягнув/ла маркер. Хочеш переоновити адресу відповідно до нової точки?",
      [
        {
          text: "Ні",
          style: "cancel",
        },
        {
          text: "Так",
          onPress: () => {
            reverseGeocodeAndUpdateAddress(latitude, longitude);
          },
        },
      ]
    );
  }

  async function submit() {
    if (!canSend || !region) {
      Alert.alert(
        "Заповни обовʼязкові поля",
        "Потрібно вказати назву, адресу, категорії та точку на карті."
      );
      return;
    }

    setSending(true);

    const materialsArr =
      materials.trim().length > 0
        ? materials
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : null;

    const payload = {
      name: name.trim(),
      address: normalizeAddress(address),
      lat: region.latitude,
      lng: region.longitude,
      categories,
      materials: materialsArr,
      phone: phone.trim() ? normalizePhone(phone) : null,
      website: website.trim() ? website.trim() : null,
      note: note.trim() ? note.trim() : null,
      status: "pending",
    };

    const { error } = await supabase.from("eco_points").insert(payload);

    setSending(false);

    if (error) {
      Alert.alert("Помилка", error.message);
      return;
    }

    Alert.alert("Готово", "Пункт надіслано на модерацію.", [
      { text: "OK", onPress: () => navigation.goBack() },
    ]);
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Додати пункт</Text>

      <View style={styles.card}>
        <Text style={styles.section}>Основні дані</Text>

        <Text style={styles.label}>Назва</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Напр. ВТОРКОРП"
          placeholderTextColor="rgba(17,17,17,0.45)"
        />

        <Text style={styles.label}>Адреса</Text>
        <TextInput
          style={styles.input}
          value={address}
          onChangeText={(v) => {
            setAddress(v);
            setGeoStatus("idle");
          }}
          placeholder="Напр. вул. Бориспільська, 9"
          placeholderTextColor="rgba(17,17,17,0.45)"
        />

        <View style={styles.actionsRow}>
          <Pressable
            style={[styles.actionBtn, styles.actionBtnPrimary]}
            onPress={geocodeAddress}
          >
            {finding ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={[styles.actionText, styles.actionTextPrimary]}>
                Знайти по адресі
              </Text>
            )}
          </Pressable>

          <Pressable style={styles.actionBtn} onPress={useMyLocation}>
            <Text style={styles.actionText}>Моє місце</Text>
          </Pressable>
        </View>

        <Text style={styles.infoText}>
          Спочатку введи адресу і натисни «Знайти по адресі». Потім зажми маркер на пару секунд і перетягни його в точне місце.
        </Text>

        {updatingAddress ? (
          <View style={styles.inlineLoadingRow}>
            <ActivityIndicator size="small" color="#4D9C79" />
            <Text style={styles.inlineLoadingText}>Оновлюю адресу…</Text>
          </View>
        ) : null}

        {geoStatus === "fail" ? (
          <Text style={styles.errorText}>
            Не вдалося визначити координати. Спробуй точніше вказати адресу.
          </Text>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>Мапа</Text>
        <Text style={styles.sectionHint}>
          Після пошуку адреси маркер з’явиться на мапі. Після перетягування можна оновити адресу за новою точкою.
        </Text>

        <View style={[styles.mapWrap, !canAdjustMarker && styles.mapWrapDisabled]}>
          <MapView
            style={styles.map}
            region={region ?? KYIV_CENTER}
            provider={PROVIDER_GOOGLE}
          >
            {canAdjustMarker && region ? (
              <Marker
                draggable
                coordinate={{
                  latitude: region.latitude,
                  longitude: region.longitude,
                }}
                onDragEnd={(e) => {
                  const { latitude, longitude } = e.nativeEvent.coordinate;

                  setRegion((prev) =>
                    prev
                      ? { ...prev, latitude, longitude }
                      : {
                          latitude,
                          longitude,
                          latitudeDelta: 0.01,
                          longitudeDelta: 0.01,
                        }
                  );

                  askAboutAddressRefresh(latitude, longitude);
                }}
              >
                <View style={styles.markerWrap}>
                  <View style={styles.markerPin}>
                    <View style={styles.markerDot} />
                  </View>
                  <View style={styles.markerTip} />
                </View>
              </Marker>
            ) : null}
          </MapView>

          {!canAdjustMarker ? (
            <View style={styles.mapOverlay}>
              <Text style={styles.mapOverlayText}>
                Спочатку введи адресу і натисни «Знайти по адресі»
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>Категорії</Text>
        <Text style={styles.sectionHint}>Оберіть, що приймає цей пункт</Text>

        <View style={styles.chips}>
          {CATEGORIES.map((c) => {
            const active = categories.includes(c.id);
            return (
              <Pressable
                key={c.id}
                onPress={() => toggleCategory(c.id)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {c.title}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>Додаткова інформація</Text>

        <Text style={styles.label}>Матеріали</Text>
        <TextInput
          style={styles.input}
          value={materials}
          onChangeText={setMaterials}
          placeholder="paper, PET, glass..."
          placeholderTextColor="rgba(17,17,17,0.45)"
        />

        <Text style={styles.label}>Телефон</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="+380..."
          placeholderTextColor="rgba(17,17,17,0.45)"
        />

        <Text style={styles.label}>Сайт</Text>
        <TextInput
          style={styles.input}
          value={website}
          onChangeText={setWebsite}
          placeholder="https://..."
          placeholderTextColor="rgba(17,17,17,0.45)"
        />

        <Text style={styles.label}>Примітка</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          multiline
          value={note}
          onChangeText={setNote}
          placeholder="Напр. навпроти будинку №3"
          placeholderTextColor="rgba(17,17,17,0.45)"
          textAlignVertical="top"
        />
      </View>

      <Pressable
        style={[styles.submitBtn, !canSend && styles.submitBtnDisabled]}
        onPress={submit}
        disabled={!canSend || sending}
      >
        {sending ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.submitText}>Надіслати</Text>
        )}
      </Pressable>

      <Text style={styles.hint}>
        Після модерації пункт зʼявиться на мапі.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 28,
    backgroundColor: "#F6F8F6",
  },

  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#111",
    marginBottom: 14,
  },

  card: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    borderRadius: 22,
    padding: 14,
    marginBottom: 14,
  },

  section: {
    fontSize: 17,
    fontWeight: "900",
    color: "#111",
  },

  sectionHint: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 18,
    color: "rgba(17,17,17,0.62)",
    marginBottom: 10,
  },

  label: {
    fontSize: 13,
    fontWeight: "800",
    marginTop: 12,
    marginBottom: 6,
    color: "#111",
  },

  input: {
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.10)",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#FAFAFA",
    fontSize: 14,
    color: "#111",
  },

  textarea: {
    minHeight: 92,
    paddingTop: 12,
  },

  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
    flexWrap: "wrap",
  },

  actionBtn: {
    flexGrow: 1,
    flexBasis: 140,
    minHeight: 48,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },

  actionBtnPrimary: {
    backgroundColor: "#4D9C79",
    borderColor: "#4D9C79",
  },

  actionText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#111",
  },

  actionTextPrimary: {
    color: "white",
  },

  infoText: {
    marginTop: 12,
    fontSize: 12,
    lineHeight: 18,
    color: "rgba(17,17,17,0.72)",
  },

  errorText: {
    marginTop: 12,
    fontSize: 12,
    lineHeight: 18,
    color: "#A14A4A",
  },

  inlineLoadingRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  inlineLoadingText: {
    fontSize: 12,
    color: "#2D6B53",
    fontWeight: "700",
  },

  mapWrap: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "white",
    position: "relative",
  },

  mapWrapDisabled: {
    opacity: 0.8,
  },

  map: {
    height: 230,
  },

  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.72)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  mapOverlayText: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
    color: "#111",
    fontWeight: "700",
  },

  markerWrap: {
    alignItems: "center",
    justifyContent: "center",
  },

  markerPin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#1F8A70",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },

  markerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#FFFFFF",
  },

  markerTip: {
    marginTop: -2,
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 12,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#1F8A70",
  },

  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },

  chip: {
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.10)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "white",
  },

  chipActive: {
    backgroundColor: "#EAF7F0",
    borderColor: "rgba(77,156,121,0.24)",
  },

  chipText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111",
  },

  chipTextActive: {
    color: "#245C45",
  },

  submitBtn: {
    backgroundColor: "#111",
    borderRadius: 18,
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },

  submitBtnDisabled: {
    opacity: 0.5,
  },

  submitText: {
    fontSize: 15,
    fontWeight: "900",
    color: "white",
  },

  hint: {
    marginTop: 10,
    fontSize: 12,
    lineHeight: 17,
    opacity: 0.72,
    color: "#111",
    textAlign: "center",
  },
});