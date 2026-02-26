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
import MapView, { Marker, Region } from "react-native-maps";
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

  const canSend = useMemo(() => {
    return (
      name.trim().length > 0 &&
      address.trim().length > 0 &&
      categories.length > 0 &&
      region !== null
    );
  }, [name, address, categories, region]);

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
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${q}`;

      const res = await fetch(url, {
        headers: {
          "User-Agent": "EcoLifeApp/1.0",
          "Accept-Language": "uk",
        },
      });

      const data = await res.json();

      if (!Array.isArray(data) || data.length === 0) {
        setGeoStatus("fail");
        Alert.alert("Не знайшла адресу", "Спробуй уточнити (район/вулиця/номер).");
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
  }

  async function submit() {
    if (!canSend || !region) {
      Alert.alert("Заповни обовʼязкові поля", "Назва, адреса, категорії і точка на карті.");
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

    Alert.alert("Готово ✅", "Пункт надіслано на модерацію.", [
      { text: "OK", onPress: () => navigation.goBack() },
    ]);
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>➕ Додати пункт</Text>

      <Text style={styles.label}>Назва *</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Напр. ВТОРКОРП" />

      <Text style={styles.label}>Адреса *</Text>
      <TextInput
        style={styles.input}
        value={address}
        onChangeText={(v) => {
          setAddress(v);
          setGeoStatus("idle");
        }}
        placeholder='Напр. "вул. Бориспільська, 9"'
      />

      <View style={styles.row}>
        <Pressable style={[styles.secondaryBtn, { flex: 1 }]} onPress={geocodeAddress}>
          {finding ? <ActivityIndicator /> : <Text style={styles.secondaryText}>📍 Знайти по адресі</Text>}
        </Pressable>

        <Pressable style={[styles.secondaryBtn, { flex: 1 }]} onPress={useMyLocation}>
          <Text style={styles.secondaryText}>📡 Моє місце</Text>
        </Pressable>
      </View>

      {geoStatus === "ok" ? <Text style={styles.ok}>✅ Точку знайдено — можеш підкоригувати маркер</Text> : null}
      {geoStatus === "fail" ? <Text style={styles.bad}>❌ Не вдалося визначити координати</Text> : null}

      <View style={styles.mapWrap}>
        <MapView style={styles.map} region={region ?? KYIV_CENTER}>
          {region ? (
            <Marker
              draggable
              coordinate={{ latitude: region.latitude, longitude: region.longitude }}
              onDragEnd={(e) => {
                const { latitude, longitude } = e.nativeEvent.coordinate;
                setRegion((prev) =>
                  prev
                    ? { ...prev, latitude, longitude }
                    : { latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }
                );
              }}
            />
          ) : null}
        </MapView>
      </View>

      <Text style={styles.section}>Категорії *</Text>
      <View style={styles.chips}>
        {CATEGORIES.map((c) => {
          const active = categories.includes(c.id);
          return (
            <Pressable
              key={c.id}
              onPress={() => toggleCategory(c.id)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={styles.chipText}>{c.emoji} {c.title}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.label}>Матеріали (через кому)</Text>
      <TextInput
        style={styles.input}
        value={materials}
        onChangeText={setMaterials}
        placeholder="paper, PET, glass bottles..."
      />

      <Text style={styles.label}>Телефон</Text>
      <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="+380..." />

      <Text style={styles.label}>Сайт</Text>
      <TextInput style={styles.input} value={website} onChangeText={setWebsite} placeholder="https://..." />

      <Text style={styles.label}>Примітка</Text>
      <TextInput
        style={[styles.input, { height: 90 }]}
        multiline
        value={note}
        onChangeText={setNote}
        placeholder="Напр. 'Навпроти будинку №3'"
      />

      <Pressable
        style={[styles.submitBtn, !canSend && { opacity: 0.5 }]}
        onPress={submit}
        disabled={!canSend || sending}
      >
        {sending ? <ActivityIndicator color="white" /> : <Text style={styles.submitText}>🚀 Надіслати</Text>}
      </Pressable>

      <Text style={styles.hint}>
        * Пункт зʼявиться на мапі після модерації (approved).
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 28 },
  title: { fontSize: 22, fontWeight: "900", marginBottom: 12 },

  label: { fontSize: 13, fontWeight: "800", marginTop: 10, marginBottom: 6, opacity: 0.9 },

  input: {
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.2)",
    borderRadius: 12,
    padding: 12,
  },

  row: { flexDirection: "row", gap: 10, marginTop: 10 },

  secondaryBtn: {
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.2)",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  secondaryText: { fontSize: 13, fontWeight: "900" },

  ok: { marginTop: 8, fontSize: 12, fontWeight: "700", opacity: 0.85 },
  bad: { marginTop: 8, fontSize: 12, fontWeight: "700", opacity: 0.85 },

  mapWrap: { marginTop: 12, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: "rgba(0,0,0,0.12)" },
  map: { height: 220 },

  section: { marginTop: 16, marginBottom: 10, fontSize: 16, fontWeight: "900" },

  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.15)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipActive: { backgroundColor: "#e6f6ef" },
  chipText: { fontSize: 13, fontWeight: "700" },

  submitBtn: {
    backgroundColor: "#2ecc71",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 18,
  },
  submitText: { fontSize: 16, fontWeight: "900", color: "white" },

  hint: { marginTop: 10, fontSize: 12, opacity: 0.75, lineHeight: 16 },
});
