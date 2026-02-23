import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
  Modal,
  Pressable,
  TextInput,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Calendar, DateData } from "react-native-calendars";

import { useAppTheme } from "../../lib/theme";
import {
  getEcoHistory,
  getProofSignedUrl,
  kyivDayKey,
  deleteEcoDay,
  type EcoDayRow,
} from "../../lib/ecoStats";

const LEAVES = require("../../../assets/leaves-texture.png");

type PeriodPreset = "all" | "7" | "30" | "range";

function parseChallengeText(s: string | null) {
  if (!s) return { title: "Добра справа", note: "" };
  const parts = s.split("—");
  const title = (parts[0] ?? "").trim() || "Добра справа";
  const note = parts.slice(1).join("—").trim();
  return { title, note };
}

function formatNiceDay(day: string) {
  const today = kyivDayKey(new Date());
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const yesterday = kyivDayKey(d);

  if (day === today) return "Сьогодні";
  if (day === yesterday) return "Вчора";

  const [yy, mm, dd] = day.split("-");
  return `${dd}.${mm}.${yy}`;
}

function ymdToDate(ymd: string) {
  const [y, m, d] = ymd.split("-").map((x) => parseInt(x, 10));
  return new Date(y, m - 1, d);
}

function isSameOrAfter(a: string, b: string) {
  return ymdToDate(a).getTime() >= ymdToDate(b).getTime();
}

function addDaysKyiv(daysBack: number) {
  const d = new Date();
  d.setDate(d.getDate() - daysBack);
  return kyivDayKey(d);
}

function buildMarkedDates(start: string | null, end: string | null, accent: string, accentSoft: string) {
  const marked: Record<string, any> = {};
  if (!start) return marked;

  if (!end) {
    marked[start] = { startingDay: true, endingDay: true, color: accent, textColor: "#fff" };
    return marked;
  }

  const startTime = ymdToDate(start).getTime();
  const endTime = ymdToDate(end).getTime();

  marked[start] = { startingDay: true, color: accent, textColor: "#fff" };
  marked[end] = { endingDay: true, color: accent, textColor: "#fff" };

  const oneDay = 24 * 60 * 60 * 1000;
  for (let t = startTime + oneDay; t < endTime; t += oneDay) {
    const dt = new Date(t);
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const d = String(dt.getDate()).padStart(2, "0");
    const key = `${y}-${m}-${d}`;
    marked[key] = { color: accentSoft, textColor: "#fff" };
  }

  return marked;
}

export function GoodDeedsHistoryScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme() as any;

  const styles = useMemo(() => createStyles(colors, !!isDark, insets.bottom), [colors, isDark, insets.bottom]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [allRows, setAllRows] = useState<EcoDayRow[]>([]);
  const [rows, setRows] = useState<EcoDayRow[]>([]);
  const [imgMap, setImgMap] = useState<Record<string, string>>({});

  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerImage, setViewerImage] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [preset, setPreset] = useState<PeriodPreset>("all");
  const [calVisible, setCalVisible] = useState(false);

  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [rangeEnd, setRangeEnd] = useState<string | null>(null);
  const [rangeError, setRangeError] = useState<string | null>(null);

  const accent = "#2F6F4E";
  const accentSoft = isDark ? "rgba(47,111,78,0.22)" : "rgba(47,111,78,0.14)";

  const applyFilters = useCallback(
    (data: EcoDayRow[], q: string, p: PeriodPreset, start: string | null, end: string | null) => {
      let out = [...data];

      if (p === "7") {
        const from = addDaysKyiv(6);
        out = out.filter((r) => isSameOrAfter(r.day, from));
      } else if (p === "30") {
        const from = addDaysKyiv(29);
        out = out.filter((r) => isSameOrAfter(r.day, from));
      } else if (p === "range" && start && end) {
        out = out.filter((r) => isSameOrAfter(r.day, start) && isSameOrAfter(end, r.day));
      }

      const qq = q.trim().toLowerCase();
      if (qq) out = out.filter((r) => (r.challenge_text ?? "").toLowerCase().includes(qq));

      setRows(out);
    },
    []
  );

  const load = useCallback(async () => {
    const data = await getEcoHistory(400);
    setAllRows(data);
    applyFilters(data, query, preset, rangeStart, rangeEnd);

    const withPhoto = data.filter((r) => !!r.challenge_proof_url).slice(0, 80);
    const pairs = await Promise.all(
      withPhoto.map(async (r) => {
        try {
          const url = await getProofSignedUrl(r.challenge_proof_url!);
          return [r.day, url] as const;
        } catch {
          return [r.day, ""] as const;
        }
      })
    );

    const map: Record<string, string> = {};
    for (const [day, url] of pairs) if (url) map[day] = url;
    setImgMap(map);
  }, [applyFilters, preset, query, rangeEnd, rangeStart]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        await load();
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        try {
          if (!active) return;
          await load();
        } catch {}
      })();
      return () => {
        active = false;
      };
    }, [load])
  );

  useEffect(() => {
    applyFilters(allRows, query, preset, rangeStart, rangeEnd);
  }, [allRows, query, preset, rangeStart, rangeEnd, applyFilters]);

  const onPullRefresh = async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  const periodLabel = useMemo(() => {
    if (preset === "all") return "Усі";
    if (preset === "7") return "7 днів";
    if (preset === "30") return "30 днів";
    if (preset === "range") {
      if (rangeStart && rangeEnd) return `${rangeStart} → ${rangeEnd}`;
      return "Обрати період";
    }
    return "Усі";
  }, [preset, rangeStart, rangeEnd]);

  const markedDates = useMemo(() => buildMarkedDates(rangeStart, rangeEnd, accent, accentSoft), [rangeStart, rangeEnd, accent, accentSoft]);

  const handleCalendarDayPress = (d: DateData) => {
    setRangeError(null);
    const pressed = d.dateString;

    if (!rangeStart) {
      setRangeStart(pressed);
      setRangeEnd(null);
      return;
    }

    if (rangeStart && !rangeEnd) {
      if (isSameOrAfter(pressed, rangeStart)) {
        setRangeEnd(pressed);
      } else {
        setRangeError("Дата «до» не може бути раніше «від». Обери інший день.");
      }
      return;
    }

    setRangeStart(pressed);
    setRangeEnd(null);
  };

  const closeCalendar = () => {
    setCalVisible(false);
    setRangeError(null);
  };

  const applyCalendar = () => {
    if (rangeStart && rangeEnd) {
      setPreset("range");
      setCalVisible(false);
      setRangeError(null);
    } else {
      setRangeError("Обери дві дати: «від» і «до».");
    }
  };

  const quickSet = (p: PeriodPreset) => {
    Keyboard.dismiss();
    setRangeError(null);

    if (p === "all" || p === "7" || p === "30") {
      setPreset(p);
      return;
    }

    setPreset("range");
    setCalVisible(true);
  };

  const handleDelete = async (day: string) => {
    const prevAll = allRows;
    const prevRows = rows;

    setAllRows((x) => x.filter((r) => r.day !== day));
    setRows((x) => x.filter((r) => r.day !== day));

    try {
      await deleteEcoDay(day);
    } catch {
      setAllRows(prevAll);
      setRows(prevRows);
    }
  };

  const monthNames = useMemo(
    () => ["Січень", "Лютий", "Березень", "Квітень", "Травень", "Червень", "Липень", "Серпень", "Вересень", "Жовтень", "Листопад", "Грудень"],
    []
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={StyleSheet.absoluteFill}>
        <View style={styles.bgGradient} />
        <Image source={LEAVES} resizeMode="cover" style={styles.bgLeaves} />
        <View style={styles.bgOverlay} pointerEvents="none" />
      </View>

      <FlatList
        style={{ flex: 1 }}
        data={rows}
        keyExtractor={(item) => item.day}
        refreshing={refreshing}
        onRefresh={onPullRefresh}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.h1}>Історія добрих справ</Text>
            <Text style={styles.sub}>Тут зібрані всі твої еко-кроки 💚</Text>

            <View style={styles.filtersRow}>
              <View style={styles.searchBox}>
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Пошук по тексту…"
                  placeholderTextColor={styles._placeholder.color}
                  style={styles.searchInput}
                  returnKeyType="search"
                />
              </View>

              <Pressable style={({ pressed }) => [styles.periodBtn, { opacity: pressed ? 0.85 : 1 }]} onPress={() => setCalVisible(true)}>
                <Text style={styles.periodBtnText} numberOfLines={1}>
                  Період
                </Text>
                <Text style={styles.periodBtnSub} numberOfLines={1}>
                  {periodLabel}
                </Text>
              </Pressable>
            </View>

            <View style={styles.chipsRow}>
              <Pressable onPress={() => quickSet("all")} style={({ pressed }) => [styles.chip, preset === "all" && styles.chipActive, { opacity: pressed ? 0.85 : 1 }]}>
                <Text style={[styles.chipText, preset === "all" && styles.chipTextActive]}>Усі</Text>
              </Pressable>
              <Pressable onPress={() => quickSet("7")} style={({ pressed }) => [styles.chip, preset === "7" && styles.chipActive, { opacity: pressed ? 0.85 : 1 }]}>
                <Text style={[styles.chipText, preset === "7" && styles.chipTextActive]}>7 днів</Text>
              </Pressable>
              <Pressable onPress={() => quickSet("30")} style={({ pressed }) => [styles.chip, preset === "30" && styles.chipActive, { opacity: pressed ? 0.85 : 1 }]}>
                <Text style={[styles.chipText, preset === "30" && styles.chipTextActive]}>30 днів</Text>
              </Pressable>
              <Pressable onPress={() => quickSet("range")} style={({ pressed }) => [styles.chip, preset === "range" && styles.chipActive, { opacity: pressed ? 0.85 : 1 }]}>
                <Text style={[styles.chipText, preset === "range" && styles.chipTextActive]}>Період</Text>
              </Pressable>
            </View>

            {preset === "range" && rangeStart && rangeEnd ? (
              <View style={styles.rangeLine}>
                <Text style={styles.rangeText}>
                  Від {formatNiceDay(rangeStart)} до {formatNiceDay(rangeEnd)}
                </Text>
              </View>
            ) : null}
          </View>
        }
        renderItem={({ item }) => {
          const { title, note } = parseChallengeText(item.challenge_text);
          const dayLabel = formatNiceDay(item.day);
          const photo = imgMap[item.day];

          return (
            <View style={styles.card}>
              <View style={styles.topRow}>
                <Text style={styles.date}>{dayLabel}</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Збережено</Text>
                </View>
              </View>

              <View style={styles.row}>
                <Pressable
                  onPress={() => {
                    if (photo) {
                      setViewerImage(photo);
                      setViewerVisible(true);
                    }
                  }}
                  disabled={!photo}
                  style={({ pressed }) => [styles.thumbWrap, { opacity: pressed ? 0.9 : 1 }]}
                >
                  {photo ? (
                    <Image source={{ uri: photo }} style={styles.thumb} />
                  ) : (
                    <View style={styles.thumbNoPhoto}>
                      <Text style={styles.thumbNoPhotoText}>Без фото</Text>
                    </View>
                  )}
                </Pressable>

                <View style={{ flex: 1 }}>
                  <Text style={styles.item} numberOfLines={2}>
                    {title}
                  </Text>

                  {!!note && (
                    <Text style={styles.note} numberOfLines={3}>
                      {note}
                    </Text>
                  )}

                  <View style={styles.actionsRow}>
                    <Pressable onPress={() => handleDelete(item.day)} style={({ pressed }) => [styles.deleteBtn, { opacity: pressed ? 0.85 : 1 }]}>
                      <Text style={styles.deleteBtnText}>Видалити</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Поки що порожньо</Text>
            <Text style={styles.emptySub}>Зроби перший еко-крок на головній сторінці ✨</Text>
          </View>
        }
      />

      <Modal visible={viewerVisible} transparent animationType="fade" onRequestClose={() => setViewerVisible(false)}>
        <View style={styles.viewerBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setViewerVisible(false)} />
          {viewerImage ? <Image source={{ uri: viewerImage }} style={styles.viewerImage} resizeMode="contain" /> : null}
          <Pressable style={styles.viewerClose} onPress={() => setViewerVisible(false)}>
            <Text style={styles.viewerCloseText}>✕</Text>
          </Pressable>
        </View>
      </Modal>

      <Modal visible={calVisible} transparent animationType="fade" onRequestClose={closeCalendar}>
        <Pressable style={styles.calBackdrop} onPress={closeCalendar}>
          <Pressable style={styles.calCard} onPress={() => {}}>
            <Text style={styles.calTitle}>Обрати період</Text>
            <Text style={styles.calSub}>Обери «від», потім «до». «До» не може бути раніше «від».</Text>

            <View style={styles.calMetaRow}>
              <View style={styles.calMetaPill}>
                <Text style={styles.calMetaLabel}>Від</Text>
                <Text style={styles.calMetaValue}>{rangeStart ? formatNiceDay(rangeStart) : "—"}</Text>
              </View>
              <View style={styles.calMetaPill}>
                <Text style={styles.calMetaLabel}>До</Text>
                <Text style={styles.calMetaValue}>{rangeEnd ? formatNiceDay(rangeEnd) : "—"}</Text>
              </View>
            </View>

            <View style={styles.calendarWrap}>
              <Calendar
                firstDay={1}
                enableSwipeMonths
                markingType="period"
                markedDates={markedDates}
                onDayPress={handleCalendarDayPress}
                renderArrow={(direction) => (
                  <Text
                    style={{
                      color: accent,
                      fontSize: 22,
                      fontFamily: "Manrope_700Bold",
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                    }}
                  >
                    {direction === "left" ? "‹" : "›"}
                  </Text>
                )}
                renderHeader={(date) => {
                  const m = date.getMonth();
                  const y = date.getFullYear();
                  return (
                    <Text style={{ color: styles._text.color, fontSize: 16, fontFamily: "Nunito_800ExtraBold" }}>
                      {monthNames[m]} {y}
                    </Text>
                  );
                }}
                theme={{
                  backgroundColor: "transparent",
                  calendarBackground: "transparent",
                  monthTextColor: styles._text.color,
                  textSectionTitleColor: styles._sub.color,
                  dayTextColor: styles._text.color,
                  todayTextColor: accent,
                  textDisabledColor: isDark ? "rgba(242,243,244,0.28)" : "rgba(17,18,20,0.22)",
                  selectedDayBackgroundColor: accent,
                  selectedDayTextColor: "#fff",
                  textDayFontFamily: "Manrope_700Bold",
                  textMonthFontFamily: "Nunito_800ExtraBold",
                  textDayHeaderFontFamily: "Manrope_700Bold",
                  textDayFontSize: 13,
                  textMonthFontSize: 16,
                  textDayHeaderFontSize: 11,
                }}
                style={styles.calendar}
              />
            </View>

            {rangeError ? <Text style={styles.calError}>{rangeError}</Text> : null}

            <View style={styles.calActions}>
              <Pressable onPress={closeCalendar} style={({ pressed }) => [styles.calBtnGhost, { opacity: pressed ? 0.85 : 1 }]}>
                <Text style={styles.calBtnGhostText}>Скасувати</Text>
              </Pressable>

              <Pressable onPress={applyCalendar} style={({ pressed }) => [styles.calBtnPrimary, { opacity: pressed ? 0.85 : 1 }]}>
                <Text style={styles.calBtnPrimaryText}>Застосувати</Text>
              </Pressable>
            </View>

            <Pressable
              onPress={() => {
                setRangeStart(null);
                setRangeEnd(null);
                setRangeError(null);
                setPreset("all");
                closeCalendar();
              }}
              style={({ pressed }) => [styles.calReset, { opacity: pressed ? 0.85 : 1 }]}
            >
              <Text style={styles.calResetText}>Скинути фільтр</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function createStyles(colors: any, isDark: boolean, bottomInset: number) {
  const bg = colors?.background ?? (isDark ? "#0E0F11" : "#F6F7F4");
  const text = colors?.text ?? (isDark ? "#F2F3F4" : "#111214");
  const sub = isDark ? "rgba(242,243,244,0.72)" : "rgba(17,18,20,0.62)";
  const accent = "#2F6F4E";
  const card = isDark ? "rgba(21,24,27,0.70)" : "rgba(255,255,255,0.86)";

  return StyleSheet.create({
    _text: { color: text },
    _sub: { color: sub },
    _placeholder: { color: isDark ? "rgba(242,243,244,0.40)" : "rgba(17,18,20,0.38)" },

    root: { flex: 1, backgroundColor: bg },
    center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: bg },

    bgGradient: { flex: 1, backgroundColor: isDark ? "#111315" : "#FFFFFF" },
    bgLeaves: { ...StyleSheet.absoluteFillObject, opacity: isDark ? 0.08 : 0.1, transform: [{ scale: 1.08 }] },
    bgOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: isDark ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.18)" },

    listContent: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: bottomInset + 16 },

    header: { marginBottom: 10 },
    h1: { fontSize: 20, color: text, fontFamily: "Nunito_800ExtraBold" },
    sub: { marginTop: 6, marginBottom: 12, fontSize: 13, color: sub, fontFamily: "Manrope_600SemiBold" },

    filtersRow: { flexDirection: "row", gap: 10, alignItems: "center" },

    searchBox: { flex: 1, borderRadius: 16, backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)", paddingHorizontal: 12, paddingVertical: 10 },
    searchInput: { color: text, fontSize: 13, fontFamily: "Manrope_600SemiBold", padding: 0 },

    periodBtn: { width: 140, borderRadius: 16, backgroundColor: isDark ? "rgba(47,111,78,0.18)" : "rgba(47,111,78,0.12)", paddingHorizontal: 12, paddingVertical: 10 },
    periodBtnText: { color: accent, fontSize: 12, fontFamily: "Manrope_700Bold" },
    periodBtnSub: { marginTop: 2, color: sub, fontSize: 11, fontFamily: "Manrope_600SemiBold" },

    chipsRow: { marginTop: 10, flexDirection: "row", gap: 8, flexWrap: "wrap" },
    chip: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)" },
    chipActive: { backgroundColor: isDark ? "rgba(47,111,78,0.22)" : "#E7F2EC" },
    chipText: { fontSize: 12, color: sub, fontFamily: "Manrope_700Bold" },
    chipTextActive: { color: accent },

    rangeLine: { marginTop: 10 },
    rangeText: { fontSize: 12, color: sub, fontFamily: "Manrope_600SemiBold" },

    card: { backgroundColor: card, borderRadius: 18, padding: 12 },

    topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
    date: { fontSize: 12, color: sub, fontFamily: "Manrope_700Bold" },

    badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: isDark ? "rgba(47,111,78,0.22)" : "rgba(47,111,78,0.14)" },
    badgeText: { fontSize: 12, color: accent, fontFamily: "Manrope_700Bold" },

    row: { flexDirection: "row", gap: 10, alignItems: "center" },
inputBlock: {
  borderRadius: 18,
  backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
  paddingHorizontal: 12,
  paddingVertical: 8,
  height: 56,
  justifyContent: "center",
},
countryBtn: {
  minWidth: 108,
  height: 56,
  borderRadius: 18,
  backgroundColor: isDark ? "rgba(47,111,78,0.18)" : "rgba(47,111,78,0.12)",
  paddingHorizontal: 12,
  paddingVertical: 0,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
},
    thumbWrap: { borderRadius: 16, overflow: "hidden" },
    thumb: { width: 74, height: 74, borderRadius: 16 },
    thumbNoPhoto: { width: 74, height: 74, borderRadius: 16, backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", justifyContent: "center", alignItems: "center" },
    thumbNoPhotoText: { fontSize: 12, color: sub, fontFamily: "Manrope_700Bold" },

    item: { fontSize: 14, color: text, fontFamily: "Nunito_700Bold" },
    note: { marginTop: 6, fontSize: 12, color: sub, fontFamily: "Manrope_600SemiBold", lineHeight: 16 },

    actionsRow: { marginTop: 10, flexDirection: "row", justifyContent: "flex-start" },

    deleteBtn: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: isDark ? "rgba(255,99,99,0.16)" : "rgba(255,99,99,0.14)" },
    deleteBtnText: { color: isDark ? "rgba(255,190,190,0.95)" : "rgba(180,40,40,0.95)", fontSize: 12, fontFamily: "Manrope_700Bold" },

    empty: { padding: 18, borderRadius: 18, backgroundColor: card },
    emptyTitle: { fontSize: 14, color: text, fontFamily: "Nunito_700Bold" },
    emptySub: { marginTop: 6, fontSize: 12, color: sub, fontFamily: "Manrope_600SemiBold" },

    viewerBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.92)", justifyContent: "center", alignItems: "center" },
    viewerImage: { width: "92%", height: "75%" },
    viewerClose: { position: "absolute", top: 50, right: 20, width: 40, height: 40, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.15)", justifyContent: "center", alignItems: "center" },
    viewerCloseText: { color: "#fff", fontSize: 18, fontWeight: "800" },

    calBackdrop: { flex: 1, backgroundColor: isDark ? "rgba(0,0,0,0.65)" : "rgba(0,0,0,0.35)", padding: 14, justifyContent: "center" },
    calCard: { borderRadius: 20, backgroundColor: isDark ? "#14171A" : "#FFFFFF", padding: 14 },
    calTitle: { fontSize: 16, color: text, fontFamily: "Nunito_800ExtraBold" },
    calSub: { marginTop: 6, fontSize: 12, color: sub, fontFamily: "Manrope_600SemiBold" },

    calMetaRow: { marginTop: 12, flexDirection: "row", gap: 10 },
    calMetaPill: { flex: 1, borderRadius: 16, padding: 10, backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)" },
    calMetaLabel: { fontSize: 11, color: sub, fontFamily: "Manrope_700Bold" },
    calMetaValue: { marginTop: 3, fontSize: 12, color: text, fontFamily: "Manrope_700Bold" },

    calendarWrap: { marginTop: 10, borderRadius: 16, overflow: "hidden", backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(47,111,78,0.06)", borderWidth: 1, borderColor: isDark ? "rgba(47,111,78,0.22)" : "rgba(47,111,78,0.18)" },
    calendar: { borderRadius: 16 },

    calError: { marginTop: 10, color: isDark ? "rgba(255,180,180,0.95)" : "rgba(180,40,40,0.95)", fontSize: 12, fontFamily: "Manrope_700Bold" },

    calActions: { marginTop: 12, flexDirection: "row", gap: 10 },
    calBtnGhost: { flex: 1, borderRadius: 16, paddingVertical: 12, backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)", alignItems: "center" },
    calBtnGhostText: { color: text, fontSize: 12, fontFamily: "Manrope_700Bold" },

    calBtnPrimary: { flex: 1, borderRadius: 16, paddingVertical: 12, backgroundColor: accent, alignItems: "center" },
    calBtnPrimaryText: { color: "#fff", fontSize: 12, fontFamily: "Manrope_700Bold" },

    calReset: { marginTop: 10, alignSelf: "center", paddingVertical: 8 },
    calResetText: { color: sub, fontSize: 12, fontFamily: "Manrope_700Bold" },
  });
}
