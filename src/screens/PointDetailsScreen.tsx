import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Linking,
  Alert,
} from "react-native";

import { CATEGORIES, type WasteCategoryId } from "../data/sorting";
import { getFavorites, toggleFavorite } from "../lib/favorites";

type HoursSlot = { open: string; close: string };
type HoursJson = Partial<
  Record<"mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun", HoursSlot[]>
>;

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
  hours_json?: HoursJson | null;
  website?: string | null;
  note?: string | null;
  status: "pending" | "approved" | "rejected";
};

const DOW: Array<{ key: keyof HoursJson; title: string }> = [
  { key: "mon", title: "Пн" },
  { key: "tue", title: "Вт" },
  { key: "wed", title: "Ср" },
  { key: "thu", title: "Чт" },
  { key: "fri", title: "Пт" },
  { key: "sat", title: "Сб" },
  { key: "sun", title: "Нд" },
];

function formatSlots(slots?: HoursSlot[]) {
  if (!slots || slots.length === 0) return "зачинено";
  return slots.map((s) => `${s.open}–${s.close}`).join(", ");
}

function todayKey(): keyof HoursJson {
  const d = new Date().getDay(); // 0=Sun
  return d === 0
    ? "sun"
    : (["mon", "tue", "wed", "thu", "fri", "sat"][d - 1] as any);
}

function isOpenNow(hoursJson?: HoursJson | null): { label: string; ok: boolean } | null {
  if (!hoursJson) return null;

  const key = todayKey();
  const slots = hoursJson[key];
  if (!slots || slots.length === 0) return { label: "Сьогодні зачинено", ok: false };

  const now = new Date();
  const minutesNow = now.getHours() * 60 + now.getMinutes();

  const parse = (t: string) => {
    const [hh, mm] = t.split(":").map(Number);
    return hh * 60 + (mm || 0);
  };

  for (const s of slots) {
    const a = parse(s.open);
    const b = parse(s.close);
    if (minutesNow >= a && minutesNow <= b) {
      return { label: `Відкрито зараз до ${s.close}`, ok: true };
    }
  }

  return { label: `Зачинено зараз • ${formatSlots(slots)}`, ok: false };
}

function normalizePhone(p: string) {
  return p.replace(/[^\d+]/g, "");
}

export default function PointDetailsScreen({ route }: any) {
  const point: EcoPoint = route.params.point;

  const [fav, setFav] = useState(false);

  useEffect(() => {
    (async () => {
      const ids = await getFavorites();
      setFav(ids.includes(point.id));
    })();
  }, [point.id]);

  async function onToggleFav() {
    const ids = await toggleFavorite(point.id);
    setFav(ids.includes(point.id));
  }

  const catsLine = point.categories
    .map((id) => {
      const c = CATEGORIES.find((x) => x.id === id);
      return c ? `${c.emoji} ${c.title}` : id;
    })
    .join(" • ");

  const openInfo = isOpenNow(point.hours_json);

  const openDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${point.lat},${point.lng}`;
    Linking.openURL(url);
  };

  const callPhone = () => {
    const p = (point.phone ?? "").trim();
    if (!p) return Alert.alert("Немає телефону");
    Linking.openURL(`tel:${normalizePhone(p)}`);
  };

  const openSite = () => {
    const s = (point.website ?? "").trim();
    if (!s) return Alert.alert("Немає сайту");
    Linking.openURL(s);
  };

  const showCallBtn = (point.phone ?? "").trim().length > 0;
  const showSiteBtn = (point.website ?? "").trim().length > 0;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{point.name}</Text>
      <Text style={styles.addr}>{point.address}</Text>

      <Text style={styles.cats}>{catsLine}</Text>

      {openInfo ? (
        <View style={[styles.badge, openInfo.ok ? styles.badgeOk : styles.badgeBad]}>
          <Text style={styles.badgeText}>{openInfo.label}</Text>
        </View>
      ) : point.hours ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>🕒 {point.hours}</Text>
        </View>
      ) : null}

      {point.note ? <Text style={styles.note}>{point.note}</Text> : null}

      {/* КНОПКИ ДЕЙСТВИЙ — одинаковые */}
      <View style={styles.actionsRow}>
        <Pressable style={styles.actionBtn} onPress={openDirections}>
          <Text style={styles.actionText}>🧭 Маршрут</Text>
        </Pressable>

        <Pressable style={styles.actionBtn} onPress={onToggleFav}>
          <Text style={styles.actionText}>
            {fav ? "⭐ В обраному" : "☆ Додати в обране"}
          </Text>
        </Pressable>

        <Pressable
          style={[styles.actionBtn, !showCallBtn && styles.actionBtnDisabled]}
          onPress={callPhone}
          disabled={!showCallBtn}
        >
          <Text style={[styles.actionText, !showCallBtn && styles.actionTextDisabled]}>
            📞 Дзвінок
          </Text>
        </Pressable>

        <Pressable
          style={[styles.actionBtn, !showSiteBtn && styles.actionBtnDisabled]}
          onPress={openSite}
          disabled={!showSiteBtn}
        >
          <Text style={[styles.actionText, !showSiteBtn && styles.actionTextDisabled]}>
            🌐 Сайт
          </Text>
        </Pressable>
      </View>

      {point.materials && point.materials.length > 0 ? (
        <>
          <Text style={styles.section}>Матеріали</Text>
          <View style={styles.chips}>
            {point.materials.map((m) => (
              <View key={m} style={styles.chip}>
                <Text style={styles.chipText}>{m}</Text>
              </View>
            ))}
          </View>
        </>
      ) : null}

      {point.hours_json ? (
        <>
          <Text style={styles.section}>Графік</Text>
          <View style={styles.hoursBox}>
            {DOW.map((d) => (
              <View key={d.key} style={styles.hoursRow}>
                <Text style={styles.hoursDay}>{d.title}</Text>
                <Text style={styles.hoursVal}>{formatSlots(point.hours_json?.[d.key])}</Text>
              </View>
            ))}
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 28 },

  title: { fontSize: 22, fontWeight: "900", color: "#111" },
  addr: { marginTop: 6, fontSize: 14, opacity: 0.8, color: "#111" },
  cats: { marginTop: 10, fontSize: 12, opacity: 0.75, lineHeight: 16, color: "#111" },

  badge: {
    marginTop: 12,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "white",
  },
  badgeOk: {},
  badgeBad: {},
  badgeText: { fontSize: 13, fontWeight: "700", color: "#111" },

  note: { marginTop: 12, fontSize: 13, opacity: 0.85, lineHeight: 18, color: "#111" },

  section: { marginTop: 18, marginBottom: 10, fontSize: 16, fontWeight: "900", color: "#111" },

  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: "white",
  },
  chipText: { fontSize: 12, fontWeight: "700", opacity: 0.9, color: "#111" },

  hoursBox: {
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    borderRadius: 16,
    padding: 12,
    backgroundColor: "white",
  },
  hoursRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  hoursDay: { fontSize: 13, fontWeight: "900", color: "#111" },
  hoursVal: { fontSize: 13, opacity: 0.9, color: "#111" },

  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
    flexWrap: "wrap",
  },
  actionBtn: {
    flexGrow: 1,
    flexBasis: 140,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.15)",
    backgroundColor: "white",
  },
  actionText: { fontSize: 13, fontWeight: "900", color: "#111" },

  actionBtnDisabled: { opacity: 0.5 },
  actionTextDisabled: { color: "#111" },
});
