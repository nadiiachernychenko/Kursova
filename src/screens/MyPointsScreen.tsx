import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";
import { useAppTheme } from "../lib/theme";

const LEAVES = require("../../assets/leaves-texture.png");

type PointStatus = "pending" | "approved" | "rejected";

type MyPoint = {
  id: string;
  name: string;
  address: string;
  status: PointStatus;
};

function statusUi(s: PointStatus) {
  if (s === "approved") return { label: "Одобрено", color: "#3F7D5C" };
  if (s === "pending") return { label: "На модерації", color: "#D3A84A" };
  return { label: "Відхилено", color: "#D96B6B" };
}

export default function MyPointsScreen({ navigation }: any) {
  const { colors, isDark } = useAppTheme() as any;
  const styles = useMemo(() => createStyles(colors, !!isDark), [colors, isDark]);

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
    return {
      pending: items.filter((x) => x.status === "pending"),
      approved: items.filter((x) => x.status === "approved"),
      rejected: items.filter((x) => x.status === "rejected"),
    };
  }, [items]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={StyleSheet.absoluteFill}>
        <View style={styles.bgBase} />
        <Image source={LEAVES} resizeMode="cover" style={styles.bgLeaves} />
        <View style={styles.bgOverlay} pointerEvents="none" />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator />
            <Text style={styles.muted}>Завантаження...</Text>
          </View>
        ) : error ? (
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Помилка</Text>
            <Text style={styles.infoSub}>{error}</Text>

            <Pressable style={styles.retryBtn} onPress={load}>
              <Text style={styles.retryBtnText}>Спробувати ще</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <Section title="На модерації" items={groups.pending} styles={styles} />
            <Section title="Одобрені" items={groups.approved} styles={styles} />
            <Section title="Відхилені" items={groups.rejected} styles={styles} />

            {items.length === 0 ? (
              <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>Поки порожньо</Text>
                <Text style={styles.infoSub}>
                  Додай перший пункт — він з’явиться тут зі статусом.
                </Text>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>

      <Pressable style={styles.fab} onPress={() => navigation.navigate("AddPoint")}>
        <Text style={styles.fabText}>Додати</Text>
      </Pressable>
    </SafeAreaView>
  );
}

function Section({
  title,
  items,
  styles,
}: {
  title: string;
  items: MyPoint[];
  styles: any;
}) {
  return (
    <View style={styles.sectionWrap}>
      <Text style={styles.section}>{title}</Text>

      {items.length === 0 ? (
        <Text style={styles.emptyText}>Поки немає</Text>
      ) : (
        items.map((p) => {
          const s = statusUi(p.status);

          return (
            <View key={p.id} style={styles.card}>
              <Text style={styles.cardTitle}>{p.name}</Text>

              <Text style={styles.cardSub}>{p.address}</Text>

              <View style={[styles.badge, { backgroundColor: `${s.color}18` }]}>
                <Text style={[styles.badgeText, { color: s.color }]}>{s.label}</Text>
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}

function createStyles(colors: any, isDark: boolean) {
  const bg = colors?.bg ?? (isDark ? "#0F1113" : "#F6F7F4");
  const text = colors?.textOnDark ?? (isDark ? "#F2F3F4" : "#111214");
  const sub = colors?.muted ?? (isDark ? "rgba(242,243,244,0.68)" : "rgba(17,18,20,0.62)");
  const border = colors?.border ?? (isDark ? "rgba(255,255,255,0.08)" : "rgba(17,18,20,0.08)");
  const card = colors?.card ?? (isDark ? "rgba(21,24,27,0.74)" : "rgba(255,255,255,0.9)");
  const accent = "#3A7D5C";
  const soft = isDark ? "rgba(58,125,92,0.18)" : "rgba(58,125,92,0.10)";

  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: bg,
    },

    container: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 110,
    },

    bgBase: {
      flex: 1,
      backgroundColor: isDark ? "#0F1113" : "#FFFFFF",
    },

    bgLeaves: {
      ...StyleSheet.absoluteFillObject,
      opacity: isDark ? 0.08 : 0.1,
      transform: [{ scale: 1.08 }],
    },

    bgOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: isDark ? "rgba(0,0,0,0.14)" : "rgba(255,255,255,0.14)",
    },

    center: {
      marginTop: 40,
      alignItems: "center",
      justifyContent: "center",
    },

    muted: {
      marginTop: 8,
      fontSize: 13,
      color: sub,
      fontFamily: "Manrope_600SemiBold",
    },

    sectionWrap: {
      marginTop: 8,
    },

    section: {
      marginTop: 12,
      marginBottom: 4,
      fontSize: 15,
      color: sub,
      fontFamily: "Manrope_700Bold",
    },

    emptyText: {
      marginTop: 8,
      fontSize: 13,
      color: sub,
      fontFamily: "Manrope_600SemiBold",
    },

    card: {
      marginTop: 10,
      borderRadius: 20,
      padding: 14,
      borderWidth: 1,
      borderColor: border,
      backgroundColor: card,
    },

    cardTitle: {
      fontSize: 15,
      color: text,
      fontFamily: "Nunito_800ExtraBold",
      lineHeight: 20,
    },

    cardSub: {
      marginTop: 6,
      fontSize: 13,
      lineHeight: 20,
      color: sub,
      fontFamily: "Manrope_600SemiBold",
    },

    badge: {
      marginTop: 10,
      alignSelf: "flex-start",
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
    },

    badgeText: {
      fontSize: 11,
      fontFamily: "Manrope_700Bold",
    },

    infoCard: {
      marginTop: 20,
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: border,
      backgroundColor: card,
    },

    infoTitle: {
      fontSize: 16,
      color: text,
      fontFamily: "Nunito_800ExtraBold",
    },

    infoSub: {
      marginTop: 6,
      fontSize: 13,
      lineHeight: 18,
      color: sub,
      fontFamily: "Manrope_600SemiBold",
    },

    retryBtn: {
      alignSelf: "flex-start",
      marginTop: 12,
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 999,
      backgroundColor: soft,
      borderWidth: 1,
      borderColor: border,
    },

    retryBtnText: {
      fontSize: 12,
      color: text,
      fontFamily: "Manrope_700Bold",
    },

    fab: {
      position: "absolute",
      right: 18,
      bottom: 22,
      minWidth: 108,
      height: 52,
      paddingHorizontal: 18,
      borderRadius: 18,
      backgroundColor: accent,
      alignItems: "center",
      justifyContent: "center",

      shadowColor: "#000",
      shadowOpacity: isDark ? 0.28 : 0.16,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 7,
    },

    fabText: {
      color: "#FFFFFF",
      fontSize: 14,
      fontFamily: "Nunito_800ExtraBold",
    },
  });
}