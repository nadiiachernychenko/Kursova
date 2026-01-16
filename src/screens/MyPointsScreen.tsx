import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from "react-native";
import { supabase } from "../lib/supabase";

type PointStatus = "pending" | "approved" | "rejected";

type MyPoint = {
  id: string;
  name: string;
  address: string;
  status: PointStatus;
  created_at?: string;
};

function statusUi(s: PointStatus) {
  if (s === "approved") return { label: "✅ Одобрено", hint: "Показується на карті" };
  if (s === "pending") return { label: "⏳ На модерації", hint: "Перевіряємо дані" };
  return { label: "❌ Відхилено", hint: "Не показується на карті" };
}

export default function MyPointsScreen({ navigation }: any) {
  const [items, setItems] = useState<MyPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const { data, error } = await supabase
        .from("eco_points")
        .select("id,name,address,status,created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setItems((data ?? []) as MyPoint[]);
    } catch (e: any) {
      setError(e?.message ?? "Unknown error");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const groups = useMemo(() => {
    const pending = items.filter((x) => x.status === "pending");
    const approved = items.filter((x) => x.status === "approved");
    const rejected = items.filter((x) => x.status === "rejected");
    return { pending, approved, rejected };
  }, [items]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Мої пункти</Text>
        <Pressable style={styles.addBtn} onPress={() => navigation.navigate("AddPoint")}>
          <Text style={styles.addBtnText}>➕ Додати</Text>
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
      ) : (
        <>
          <Section title="⏳ На модерації" items={groups.pending} />
          <Section title="✅ Одобрені" items={groups.approved} />
          <Section title="❌ Відхилені" items={groups.rejected} />

          {items.length === 0 ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Поки порожньо</Text>
              <Text style={styles.cardSub}>Додай перший пункт — він з’явиться тут зі статусом.</Text>
              <Pressable style={[styles.pill, { marginTop: 10 }]} onPress={() => navigation.navigate("AddPoint")}>
                <Text style={styles.pillText}>➕ Додати пункт</Text>
              </Pressable>
            </View>
          ) : null}
        </>
      )}
    </ScrollView>
  );
}

function Section({ title, items }: { title: string; items: MyPoint[] }) {
  return (
    <View style={{ marginTop: 14 }}>
      <Text style={styles.section}>{title}</Text>

      {items.length === 0 ? (
        <Text style={[styles.muted, { marginTop: 6 }]}>Нічого</Text>
      ) : (
        items.map((p) => {
          const s = statusUi(p.status);
          return (
            <View key={p.id} style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.cardTitle}>{p.name}</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{s.label}</Text>
                </View>
              </View>

              <Text style={styles.cardSub}>{p.address}</Text>
              <Text style={styles.cardHint}>{s.hint}</Text>
            </View>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 28 },

  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 22, fontWeight: "900" },

  addBtn: {
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.15)",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "white",
  },
  addBtnText: { fontSize: 13, fontWeight: "900" },

  section: { marginTop: 10, fontSize: 16, fontWeight: "900" },

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
  cardHint: { marginTop: 6, fontSize: 12, opacity: 0.65 },

  badge: {
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: { fontSize: 12, fontWeight: "800" },

  pill: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.15)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pillText: { fontSize: 12, fontWeight: "900" },
});
