import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Modal,
  Image,
} from "react-native";
import Svg, { Circle } from "react-native-svg";

import { ensureAuth } from "../lib/auth";
import { getLastNDays, kyivDayKey, type EcoDayRow } from "../lib/ecoStats";

/* ---------------- utils ---------------- */

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

type DayUI = {
  day: string;
  eco_done: boolean;
  challenge_done: boolean;
  eco_proof_url: string | null;
  challenge_proof_url: string | null;
};

function toBool(v: any) {
  return v === true;
}

function shortDayLabel(day: string) {
  const [, m, d] = day.split("-");
  return `${d}.${m}`;
}

function makeLastNDaysKeys(n: number) {
  const arr: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    arr.push(kyivDayKey(t));
  }
  return arr;
}

function normalizeRows(raw: EcoDayRow[]): DayUI[] {
  const out: DayUI[] = [];
  for (const r of raw ?? []) {
    const day = String((r as any)?.day ?? "");
    if (!DAY_RE.test(day)) continue;

    out.push({
      day,
      eco_done: toBool((r as any).eco_done),
      challenge_done: toBool((r as any).challenge_done),
      eco_proof_url: (r as any).eco_proof_url ?? null,
      challenge_proof_url: (r as any).challenge_proof_url ?? null,
    });
  }
  out.sort((a, b) => a.day.localeCompare(b.day));
  return out;
}

function calcStreak(byDay: Map<string, DayUI>, key: "eco_done" | "challenge_done") {
  let streak = 0;
  const d = new Date();
  while (true) {
    const k = kyivDayKey(d);
    if (byDay.get(k)?.[key]) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else break;
  }
  return streak;
}

/* ---------------- panda ---------------- */

function DancingPanda({ mood }: { mood: "calm" | "happy" | "pro" }) {
  const bob = useRef(new Animated.Value(0)).current;
  const rot = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const bobAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: -6, duration: 650, useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 650, useNativeDriver: true }),
      ])
    );

    const rotAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(rot, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(rot, { toValue: -1, duration: 900, useNativeDriver: true }),
      ])
    );

    bobAnim.start();
    rotAnim.start();

    return () => {
      bob.stopAnimation();
      rot.stopAnimation();
    };
  }, [bob, rot]);

  const pandaFace = mood === "pro" ? "🐼🕶️" : mood === "happy" ? "🐼✨" : "🐼";
  const title =
    mood === "pro" ? "Ти на рівні PRO" : mood === "happy" ? "Крутий темп!" : "Початок — найважливіший";

  const subtitle =
    mood === "pro"
      ? "Тримай — це виглядає дуже сильно."
      : mood === "happy"
      ? "Ще трохи — і буде серія 🔥"
      : "Давай м’яко і стабільно.";

  const rotate = rot.interpolate({
    inputRange: [-1, 1],
    outputRange: ["-3deg", "3deg"],
  });

  return (
    <View style={styles.pandaCard}>
      <View style={{ flex: 1 }}>
        <Text style={styles.pandaTitle}>{title}</Text>
        <Text style={styles.pandaSub}>{subtitle}</Text>
      </View>

      <Animated.Text style={[styles.pandaEmoji, { transform: [{ translateY: bob }, { rotate }] }]}>
        {pandaFace}
      </Animated.Text>
    </View>
  );
}

/* ---------------- rings ---------------- */

function Ring({ label, value, total }: { label: string; value: number; total: number }) {
  const size = 92;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = total > 0 ? Math.max(0, Math.min(1, value / total)) : 0;
  const dash = c * pct;

  return (
    <View style={styles.ringCard}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(17,18,20,0.10)" strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={COLORS.accent}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          rotation={-90}
          originX={size / 2}
          originY={size / 2}
          fill="none"
        />
      </Svg>

      <View style={styles.ringCenter}>
        <Text style={styles.ringValue}>
          {value}/{total}
        </Text>
        <Text style={styles.ringLabel}>{label}</Text>
      </View>
    </View>
  );
}

/* ---------------- modal (photos) ---------------- */

function ProofModal({
  visible,
  onClose,
  day,
  ecoUrl,
  chUrl,
}: {
  visible: boolean;
  onClose: () => void;
  day: string;
  ecoUrl: string | null;
  chUrl: string | null;
}) {
  const hasAny = !!ecoUrl || !!chUrl;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={() => {}}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Докази за день</Text>
            <Text style={styles.modalDay}>{day}</Text>
          </View>

          {!hasAny ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>Фото немає</Text>
              <Text style={styles.emptySub}>На цей день не було додано доказів.</Text>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {ecoUrl ? (
                <View style={styles.proofBlock}>
                  <Text style={styles.proofLabel}>Eco</Text>
                  <Image source={{ uri: ecoUrl }} style={styles.proofImage} />
                </View>
              ) : null}

              {chUrl ? (
                <View style={styles.proofBlock}>
                  <Text style={styles.proofLabel}>Challenge</Text>
                  <Image source={{ uri: chUrl }} style={styles.proofImage} />
                </View>
              ) : null}
            </View>
          )}

          <Pressable style={styles.modalClose} onPress={onClose}>
            <Text style={styles.modalCloseText}>Закрити</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/* ---------------- screen ---------------- */

export default function StatisticsScreen() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<DayUI[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalDay, setModalDay] = useState<string>(kyivDayKey());
  const [modalEco, setModalEco] = useState<string | null>(null);
  const [modalCh, setModalCh] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      await ensureAuth();
      const raw = await getLastNDays(45);
      setRows(normalizeRows(raw));
    } catch (e: any) {
      console.log("Statistics error", e);
      setError(e?.message ?? "Stats load failed");
      setRows([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const byDay = useMemo(() => {
    const m = new Map<string, DayUI>();
    for (const r of rows) {
      if (DAY_RE.test(r.day)) m.set(r.day, r);
    }
    return m;
  }, [rows]);

  const last7Keys = useMemo(() => makeLastNDaysKeys(7), []);
  const last7 = useMemo(() => {
    return last7Keys.map((day) => byDay.get(day) ?? {
      day,
      eco_done: false,
      challenge_done: false,
      eco_proof_url: null,
      challenge_proof_url: null,
    });
  }, [byDay, last7Keys]);

  const eco7 = useMemo(() => last7.filter((d) => d.eco_done).length, [last7]);
  const ch7 = useMemo(() => last7.filter((d) => d.challenge_done).length, [last7]);

  const ecoStreak = useMemo(() => calcStreak(byDay, "eco_done"), [byDay]);
  const chStreak = useMemo(() => calcStreak(byDay, "challenge_done"), [byDay]);

  const mood: "calm" | "happy" | "pro" =
    eco7 + ch7 >= 10 ? "pro" : eco7 + ch7 >= 4 ? "happy" : "calm";

  const gridKeys = useMemo(() => makeLastNDaysKeys(45), []);
  const grid = useMemo(() => {
    return gridKeys.map((day) => {
      const r = byDay.get(day);
      const eco = r?.eco_done ?? false;
      const ch = r?.challenge_done ?? false;
      const hasPhoto = !!(r?.eco_proof_url || r?.challenge_proof_url);
      const level = eco && ch ? 3 : eco || ch ? 2 : 1;
      return { day, level, hasPhoto };
    });
  }, [gridKeys, byDay]);

  const totals = useMemo(() => {
    const ecoTotal = rows.filter((r) => r.eco_done).length;
    const chTotal = rows.filter((r) => r.challenge_done).length;
    return { ecoTotal, chTotal };
  }, [rows]);

  function openDay(day: DayUI) {
    setModalDay(day.day);
    setModalEco(day.eco_proof_url);
    setModalCh(day.challenge_proof_url);
    setModalOpen(true);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.muted}>Завантаження…</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      >
        <View style={styles.headerRow}>
          <Text style={styles.title}>Статистика</Text>
          <Pressable onPress={() => { setRefreshing(true); load(); }} style={({ pressed }) => [styles.refreshBtn, { opacity: pressed ? 0.7 : 1 }]}>
            <Text style={styles.refreshText}>↻</Text>
          </Pressable>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <DancingPanda mood={mood} />

        <View style={styles.topRow}>
          <View style={styles.bigCard}>
            <Text style={styles.bigTitle}>Серії</Text>
            <Text style={styles.bigValue}>Eco: {ecoStreak}  •  Challenge: {chStreak}</Text>
            <Text style={styles.bigSub}>рахується до сьогодні (Kyiv)</Text>
          </View>
        </View>

        <View style={styles.ringsRow}>
          <Ring label="Eco за 7" value={eco7} total={7} />
          <Ring label="Challenge за 7" value={ch7} total={7} />
        </View>

        <View style={styles.cardsRow}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Eco</Text>
            <Text style={styles.cardValue}>{totals.ecoTotal}</Text>
            <Text style={styles.cardSub}>за 45 днів</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>Challenge</Text>
            <Text style={styles.cardValue}>{totals.chTotal}</Text>
            <Text style={styles.cardSub}>за 45 днів</Text>
          </View>
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Останні 7 днів</Text>
          <Text style={styles.sectionHint}>натисни день → фото</Text>
        </View>

        <View style={styles.daysRow}>
          {last7.map((d, idx) => {
            const chipTone = d.eco_done && d.challenge_done ? styles.dayChipStrong : d.eco_done || d.challenge_done ? styles.dayChipMid : styles.dayChipEmpty;
            const hasPhoto = !!(d.eco_proof_url || d.challenge_proof_url);
            return (
              <Pressable
                key={`last7-${d.day}-${idx}`}
                onPress={() => openDay(d)}
                style={({ pressed }) => [styles.dayChip, chipTone, { opacity: pressed ? 0.85 : 1 }]}
              >
                <Text style={styles.dayDate}>{shortDayLabel(d.day)}</Text>
                <Text style={styles.dayMarks}>
                  {d.eco_done ? "Eco ✓" : "Eco ·"}  {d.challenge_done ? "Ch ✓" : "Ch ·"}
                </Text>
                <Text style={styles.dayPhoto}>{hasPhoto ? "Фото" : "—"}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Календар 45 днів</Text>
          <Text style={styles.sectionHint}>як contributions</Text>
        </View>

        <View style={styles.gridWrap}>
          {grid.map((g, idx) => {
            const tone =
              g.level === 3 ? styles.cell2 : g.level === 2 ? styles.cell1 : styles.cell0;

            return (
              <Pressable
                key={`grid-${g.day}-${idx}`}
                onPress={() => {
                  const d = byDay.get(g.day) ?? {
                    day: g.day,
                    eco_done: false,
                    challenge_done: false,
                    eco_proof_url: null,
                    challenge_proof_url: null,
                  };
                  openDay(d);
                }}
                style={({ pressed }) => [
                  styles.cell,
                  tone,
                  g.hasPhoto && styles.cellPhoto,
                  { opacity: pressed ? 0.75 : 1 },
                ]}
              />
            );
          })}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      <ProofModal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        day={modalDay}
        ecoUrl={modalEco}
        chUrl={modalCh}
      />
    </View>
  );
}

/* ---------------- styles ---------------- */

const COLORS = {
  bg: "#F6F7F4",
  card: "#FFFFFF",
  text: "#111214",
  sub: "rgba(17,18,20,0.68)",
  line: "rgba(17,18,20,0.10)",
  accent: "#2F6F4E",
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 14 },

  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.bg },
  muted: { marginTop: 8, color: COLORS.sub, fontWeight: "700" },

  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 22, fontWeight: "900", color: COLORS.text },
  refreshBtn: {
    width: 42,
    height: 42,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
  },
  refreshText: { fontWeight: "900", color: COLORS.text, fontSize: 16 },

  errorBox: {
    marginTop: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(200,0,0,0.25)",
    backgroundColor: "rgba(200,0,0,0.06)",
  },
  errorText: { color: "rgba(160,0,0,1)", fontWeight: "800" },

  pandaCard: {
    marginTop: 12,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.card,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  pandaTitle: { fontWeight: "900", fontSize: 14, color: COLORS.text },
  pandaSub: { marginTop: 6, color: COLORS.sub, fontWeight: "800" },
  pandaEmoji: { fontSize: 46 },

  topRow: { marginTop: 12 },
  bigCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.card,
    padding: 14,
  },
  bigTitle: { fontSize: 12, fontWeight: "900", color: COLORS.sub },
  bigValue: { marginTop: 8, fontSize: 18, fontWeight: "900", color: COLORS.text },
  bigSub: { marginTop: 6, fontSize: 12, fontWeight: "700", color: COLORS.sub },

  ringsRow: { flexDirection: "row", gap: 12, marginTop: 12 },
  ringCard: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.card,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  ringCenter: { position: "absolute", alignItems: "center" },
  ringValue: { fontSize: 14, fontWeight: "900", color: COLORS.text },
  ringLabel: { marginTop: 2, fontSize: 11, fontWeight: "800", color: COLORS.sub, textAlign: "center" },

  cardsRow: { flexDirection: "row", gap: 12, marginTop: 12 },
  card: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.card,
    padding: 12,
  },
  cardLabel: { color: COLORS.sub, fontWeight: "900", fontSize: 12 },
  cardValue: { marginTop: 6, fontSize: 22, fontWeight: "900", color: COLORS.text },
  cardSub: { marginTop: 4, color: COLORS.sub, fontWeight: "700", fontSize: 12 },

  sectionRow: { marginTop: 18, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  sectionTitle: { fontSize: 16, fontWeight: "900", color: COLORS.text },
  sectionHint: { fontSize: 12, fontWeight: "800", color: COLORS.sub },

  daysRow: { flexDirection: "row", gap: 10, marginTop: 10, flexWrap: "wrap" },
  dayChip: {
    width: 98,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.card,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  dayChipEmpty: { backgroundColor: COLORS.card },
  dayChipMid: { backgroundColor: "rgba(47,111,78,0.10)", borderColor: "rgba(47,111,78,0.25)" },
  dayChipStrong: { backgroundColor: "rgba(47,111,78,0.18)", borderColor: "rgba(47,111,78,0.40)" },
  dayDate: { fontWeight: "900", color: COLORS.text, fontSize: 12 },
  dayMarks: { marginTop: 6, fontWeight: "800", color: COLORS.sub, fontSize: 11 },
  dayPhoto: { marginTop: 6, fontWeight: "900", color: COLORS.text, fontSize: 11 },

  gridWrap: {
    marginTop: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.card,
    padding: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  cell: { width: 14, height: 14, borderRadius: 4 },
  cell0: { backgroundColor: "rgba(17,18,20,0.08)" },
  cell1: { backgroundColor: "rgba(47,111,78,0.35)" },
  cell2: { backgroundColor: "rgba(47,111,78,1)" },
  cellPhoto: { borderWidth: 1, borderColor: "rgba(17,18,20,0.18)" },

  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.28)", padding: 14, justifyContent: "center" },
  modalCard: { backgroundColor: COLORS.card, borderRadius: 22, borderWidth: 1, borderColor: "rgba(0,0,0,0.10)", padding: 14 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  modalTitle: { fontSize: 16, fontWeight: "900", color: COLORS.text },
  modalDay: { fontSize: 12, fontWeight: "800", color: COLORS.sub },

  emptyBox: { marginTop: 12, padding: 12, borderRadius: 16, borderWidth: 1, borderColor: COLORS.line, backgroundColor: "rgba(17,18,20,0.02)" },
  emptyTitle: { fontWeight: "900", color: COLORS.text },
  emptySub: { marginTop: 6, fontWeight: "800", color: COLORS.sub },

  proofBlock: { marginTop: 10 },
  proofLabel: { fontSize: 12, fontWeight: "900", color: COLORS.sub, marginBottom: 8 },
  proofImage: { width: "100%", height: 220, borderRadius: 18, backgroundColor: "rgba(0,0,0,0.06)" },

  modalClose: { alignSelf: "flex-end", marginTop: 12, borderWidth: 1, borderColor: COLORS.line, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: COLORS.card },
  modalCloseText: { fontSize: 12, fontWeight: "900", color: COLORS.text },
});
