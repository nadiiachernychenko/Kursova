import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Modal,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Image,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar, DateData } from "react-native-calendars";
import { useAppTheme } from "../../lib/theme";
import { useT } from "../../lib/i18n";
import { supabase } from "../../lib/supabase";

type Gender = "female" | "male" | null;

type Country = {
  code: string;
  dial: string;
  label: string;
  flag: string;
};

const COUNTRIES: Country[] = [
  { code: "UA", dial: "+380", label: "Україна", flag: "🇺🇦" },
  { code: "PL", dial: "+48", label: "Polska", flag: "🇵🇱" },
  { code: "MD", dial: "+373", label: "Moldova", flag: "🇲🇩" },
  { code: "DE", dial: "+49", label: "Deutschland", flag: "🇩🇪" },
  { code: "US", dial: "+1", label: "United States", flag: "🇺🇸" },
];

type ProfileRow = {
  id: string;
  first_name: string;
  last_name: string;
  gender: "female" | "male" | null;
  birth_date: string | null;
  country_code: string;
  phone: string;
};

const LEAVES = require("../../../assets/leaves-texture.png");

function kyivTodayISO() {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Kyiv",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date());

    const y = parts.find((p) => p.type === "year")?.value;
    const m = parts.find((p) => p.type === "month")?.value;
    const d = parts.find((p) => p.type === "day")?.value;
    const key = `${y}-${m}-${d}`;
    return /^\d{4}-\d{2}-\d{2}$/.test(key) ? key : null;
  } catch {
    return null;
  }
}

function ymdToMs(iso: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return NaN;
  const y = Number(m[1]);
  const mm = Number(m[2]);
  const d = Number(m[3]);
  return Date.UTC(y, mm - 1, d);
}

function formatBirthDDMMYYYY(iso: string | null): string {
  if (!iso) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return "";
  return `${m[3]}.${m[2]}.${m[1]}`;
}

function isValidBirthISO(iso: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return false;
  const yyyy = Number(m[1]);
  const mm = Number(m[2]);
  const dd = Number(m[3]);
  if (yyyy < 1900 || yyyy > 2100) return false;
  if (mm < 1 || mm > 12) return false;
  const maxDay = new Date(yyyy, mm, 0).getDate();
  if (dd < 1 || dd > maxDay) return false;
  return true;
}

function stripToDigits(s: string) {
  return s.replace(/[^\d]/g, "");
}

function formatPhonePretty(digits: string) {
  const d = stripToDigits(digits).slice(0, 15);
  if (!d) return "";
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
  if (d.length <= 8) return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 8)} ${d.slice(8)}`;
}

function getGoogleDisplayName(user: any) {
  const md = user?.user_metadata ?? {};
  const full = (md.full_name || md.name || "").trim();
  const given = (md.given_name || "").trim();
  const family = (md.family_name || "").trim();

  const combined = [given, family].filter(Boolean).join(" ").trim();
  if (full) return full;
  if (combined) return combined;

  const email = (user?.email ?? "").trim();
  if (email.includes("@")) return email.split("@")[0];
  return "";
}

function parseStoredPhoneToCountryAndDigits(stored: string | null | undefined) {
  const raw = (stored ?? "").trim();
  if (!raw) return { country: COUNTRIES[0], digits: "" };

  const sorted = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);
  const found = sorted.find((c) => raw.startsWith(c.dial));
  if (found) {
    return { country: found, digits: stripToDigits(raw.slice(found.dial.length)).slice(0, 15) };
  }

  return { country: COUNTRIES[0], digits: stripToDigits(raw).slice(0, 15) };
}

type Pal = {
  bg: string;
  card: string;
  text: string;
  sub: string;
  line: string;
  accent: string;
  accentSoft: string;
  placeholder: string;
  dangerSoft: string;
  dangerText: string;
};

function makePal(colors: any, isDark: boolean): Pal {
  const accent = "#2F6F4E";
  const bg = colors?.background ?? (isDark ? "#0E0F11" : "#F6F7F4");
  const text = colors?.text ?? (isDark ? "#F2F3F4" : "#111214");
  const line = colors?.border ?? (isDark ? "rgba(242,243,244,0.10)" : "rgba(17,18,20,0.08)");
  return {
    bg,
    card: colors?.card ?? (isDark ? "#15171A" : "#FFFFFF"),
    text,
    sub: isDark ? "rgba(242,243,244,0.72)" : "rgba(17,18,20,0.62)",
    line,
    accent,
    accentSoft: isDark ? "rgba(47,111,78,0.22)" : "#E7F2EC",
    placeholder: isDark ? "rgba(242,243,244,0.40)" : "rgba(17,18,20,0.38)",
    dangerSoft: isDark ? "rgba(255,99,99,0.16)" : "rgba(255,99,99,0.14)",
    dangerText: isDark ? "rgba(255,190,190,0.95)" : "rgba(180,40,40,0.95)",
  };
}

const shadow = Platform.select({
  ios: { shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 18, shadowOffset: { width: 0, height: 10 } },
  android: { elevation: 5 },
  default: {},
});

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function setISOYear(iso: string, year: number) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  const mm = Number(m[2]);
  const dd = Number(m[3]);
  const maxDay = new Date(year, mm, 0).getDate();
  const safeDay = Math.min(dd, maxDay);
  return `${year}-${pad2(mm)}-${pad2(safeDay)}`;
}

function setISOMonth(iso: string, month1to12: number) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  const yyyy = Number(m[1]);
  const dd = Number(m[3]);
  const maxDay = new Date(yyyy, month1to12, 0).getDate();
  const safeDay = Math.min(dd, maxDay);
  return `${yyyy}-${pad2(month1to12)}-${pad2(safeDay)}`;
}

function clampISOToToday(iso: string, todayISO: string) {
  return iso > todayISO ? todayISO : iso;
}

function ymOf(iso: string) {
  return iso.slice(0, 7);
}

function createStyles(P: Pal, isDark: boolean) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: P.bg },
    root: { flex: 1, backgroundColor: "transparent" },
    content: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 22 },

    bgLeaves: { ...StyleSheet.absoluteFillObject, opacity: isDark ? 0.08 : 0.1, transform: [{ scale: 1.08 }] },
    bgOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: isDark ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.18)" },

    headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
    h1: { fontSize: 20, color: P.text, fontFamily: "Nunito_800ExtraBold" },
    syncText: { fontSize: 12, color: P.sub, fontFamily: "Manrope_700Bold" },

    card: {
      borderRadius: 22,
      backgroundColor: isDark ? "rgba(21,24,27,0.72)" : "rgba(255,255,255,0.86)",
      overflow: "hidden",
      ...shadow,
    },
    cardInner: { padding: 14 },

    sectionTitle: { fontSize: 12, color: P.sub, fontFamily: "Manrope_700Bold" },
    fieldWrap: { marginTop: 10, gap: 10 },

    inputBlock: {
      borderRadius: 18,
      backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
      paddingHorizontal: 12,
      paddingVertical: 0,
      height: 56,
      justifyContent: "center",
    },

    label: { fontSize: 11, color: P.sub, fontFamily: "Manrope_700Bold" },
    input: { marginTop: 4, fontSize: 14, color: P.text, fontFamily: "Manrope_600SemiBold", paddingVertical: 0 },

    row: { flexDirection: "row", gap: 10, alignItems: "center" },

    pressField: {
      borderRadius: 18,
      backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
      paddingHorizontal: 12,
      paddingVertical: 12,
    },
    pressFieldLeft: { flex: 1 },
    pressValue: { marginTop: 4, fontSize: 14, color: P.text, fontFamily: "Manrope_600SemiBold" },
    pressPlaceholder: { marginTop: 4, fontSize: 14, color: P.placeholder, fontFamily: "Manrope_600SemiBold" },

    phoneRow: { marginTop: 6, flexDirection: "row", alignItems: "center", gap: 10 },

    countryInline: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 10,
      height: 36,
      borderRadius: 14,
      backgroundColor: isDark ? "rgba(47,111,78,0.18)" : "rgba(47,111,78,0.12)",
    },
    countryFlag: { fontSize: 14, lineHeight: 16 },
    countryDial: { fontSize: 12, lineHeight: 16, color: P.accent, fontFamily: "Manrope_700Bold" },
    countryChevron: { fontSize: 12, lineHeight: 16, color: P.sub, fontFamily: "Manrope_700Bold", marginLeft: 2 },

    phoneInlineInput: {
      flex: 1,
      fontSize: 14,
      color: P.text,
      fontFamily: "Manrope_700Bold",
      paddingVertical: 0,
      letterSpacing: 0.6,
    },

    footer: { marginTop: 6, alignItems: "center" },
    note: { marginTop: 6, textAlign: "center", fontSize: 12, color: P.sub, lineHeight: 18, fontFamily: "Manrope_600SemiBold" },

    dangerBtn: {
      marginTop: 12,
      borderRadius: 18,
      backgroundColor: isDark ? "rgba(21,24,27,0.58)" : "rgba(255,255,255,0.78)",
      padding: 14,
    },

    dangerInner: {
      borderRadius: 14,
      backgroundColor: P.dangerSoft,
      paddingVertical: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    dangerText: { color: P.dangerText, fontSize: 13, fontFamily: "Manrope_700Bold" },

    modalBg: { flex: 1, backgroundColor: isDark ? "rgba(0,0,0,0.65)" : "rgba(0,0,0,0.35)", padding: 14, justifyContent: "center" },
    modalCard: { backgroundColor: isDark ? "#14171A" : "#FFFFFF", borderRadius: 20, padding: 14, ...shadow },
    modalTitle: { fontSize: 16, color: P.text, fontFamily: "Nunito_800ExtraBold" },
    modalSub: { marginTop: 6, fontSize: 12, color: P.sub, fontFamily: "Manrope_600SemiBold" },

    errorText: { marginTop: 10, color: P.dangerText, fontSize: 12, fontFamily: "Manrope_700Bold" },

    actionsRow: { marginTop: 12, flexDirection: "row", gap: 10 },
    btnGhost: { flex: 1, borderRadius: 16, paddingVertical: 12, backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)", alignItems: "center" },
    btnGhostText: { color: P.text, fontSize: 12, fontFamily: "Manrope_700Bold" },
    btnPrimary: { flex: 1, borderRadius: 16, paddingVertical: 12, backgroundColor: P.accent, alignItems: "center" },
    btnPrimaryText: { color: "#fff", fontSize: 12, fontFamily: "Manrope_700Bold" },

    listCard: { marginTop: 12, borderRadius: 18, backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)", overflow: "hidden" },
    listItem: { paddingHorizontal: 14, paddingVertical: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    listItemText: { fontSize: 13, color: P.text, fontFamily: "Manrope_700Bold" },

    birthHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    birthBadge: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: P.accentSoft },
    birthBadgeText: { color: P.accent, fontSize: 12, fontFamily: "Manrope_700Bold" },

    pickerCard: {
      marginTop: 10,
      borderRadius: 16,
      overflow: "hidden",
      backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
      borderWidth: 1,
      borderColor: isDark ? "rgba(47,111,78,0.35)" : "rgba(47,111,78,0.22)",
    },
    calendar: { borderRadius: 16 },
  });
}

export function ProfileStubScreen() {
  const { colors, isDark } = useAppTheme() as any;
  const t = useT();

  const PAL = useMemo(() => makePal(colors, !!isDark), [colors, isDark]);
  const styles = useMemo(() => createStyles(PAL, !!isDark), [PAL, isDark]);

  const todayISO = useMemo(() => kyivTodayISO() ?? new Date().toISOString().slice(0, 10), []);
  const monthsUA = useMemo(
    () => ["Січень", "Лютий", "Березень", "Квітень", "Травень", "Червень", "Липень", "Серпень", "Вересень", "Жовтень", "Листопад", "Грудень"],
    []
  );

  const [userId, setUserId] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState<string>("");

  const [gender, setGender] = useState<Gender>(null);

  const [birthISO, setBirthISO] = useState<string | null>(null);
  const [birthTemp, setBirthTemp] = useState<string | null>(null);
  const [birthError, setBirthError] = useState<string | null>(null);

  const [yearOpen, setYearOpen] = useState(false);
  const [monthOpen, setMonthOpen] = useState(false);
  const [calCursor, setCalCursor] = useState<string>(todayISO);

  const years = useMemo(() => {
    const nowY = Number(todayISO.slice(0, 4));
    const out: number[] = [];
    for (let y = nowY; y >= 1900; y--) out.push(y);
    return out;
  }, [todayISO]);
const cursorISO = birthTemp ?? birthISO ?? todayISO;
const cursorYear = Number(cursorISO.slice(0, 4));
const todayYear = Number(todayISO.slice(0, 4));
const todayMonth = Number(todayISO.slice(5, 7));
const maxMonthAllowed = cursorYear === todayYear ? todayMonth : 12;
  const [country, setCountry] = useState<Country>(COUNTRIES[0]);
  const [phoneDigits, setPhoneDigits] = useState("");

  const [genderOpen, setGenderOpen] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);
  const [birthOpen, setBirthOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const hydratedRef = useRef(false);
  const saveTimerRef = useRef<any>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);

      const { data: authData, error: authErr } = await supabase.auth.getUser();
      if (authErr) {
        setLoading(false);
        return;
      }

      const user = authData?.user;
      setEmail(user?.email ?? "");
      setUserId(user?.id ?? null);

      if (!user?.id) {
        setLoading(false);
        return;
      }

      const googleName = getGoogleDisplayName(user);

      const { data: prof, error: profErr } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, gender, birth_date, country_code, phone")
        .eq("id", user.id)
        .maybeSingle<ProfileRow>();

      if (!profErr && prof) {
        const combined = `${(prof.first_name ?? "").trim()} ${(prof.last_name ?? "").trim()}`.trim();
        setDisplayName(combined || googleName || "");

        setGender((prof.gender as any) ?? null);
        setBirthISO(prof.birth_date ?? null);

        const parsed = parseStoredPhoneToCountryAndDigits(prof.phone);
        setCountry(parsed.country);
        setPhoneDigits(parsed.digits);
      } else {
        setDisplayName(googleName || "");
      }

      hydratedRef.current = true;
      setLoading(false);
    })();
  }, []);

  const scheduleSave = () => {
    if (!hydratedRef.current) return;
    if (!userId) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(async () => {
      setSaving(true);

      const payload: ProfileRow = {
        id: userId,
        first_name: displayName.trim(),
        last_name: "",
        gender: gender ?? null,
        birth_date: birthISO ?? null,
        country_code: country.code,
        phone: phoneDigits.trim() ? `${country.dial}${phoneDigits.trim()}` : "",
      };

      await supabase.from("profiles").upsert(payload, { onConflict: "id" });

      setSaving(false);
    }, 650);
  };

  useEffect(() => {
    scheduleSave();
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [displayName, gender, birthISO, country.code, phoneDigits, userId]);

  useEffect(() => {
    setCalCursor(birthTemp ?? birthISO ?? todayISO);
  }, [birthTemp, birthISO, todayISO]);

  const openBirth = () => {
    Keyboard.dismiss();
    setBirthError(null);
    setBirthTemp(birthISO ?? null);
    setBirthOpen(true);
  };

  const onPickBirthDay = (d: DateData) => {
    const iso = d.dateString;
    if (!isValidBirthISO(iso)) return;

    if (ymdToMs(iso) > ymdToMs(todayISO)) {
      setBirthError("Дата народження не може бути в майбутньому.");
      return;
    }

    setBirthError(null);
    setBirthTemp(iso);
  };

  const markedBirth = useMemo(() => {
    const marked: Record<string, any> = {};
    const pick = birthTemp ?? birthISO;
    if (pick) marked[pick] = { selected: true, selectedColor: PAL.accent, selectedTextColor: "#fff" };
    return marked;
  }, [birthTemp, birthISO, PAL.accent]);

  const applyBirth = () => {
    if (!birthTemp) {
      setBirthError("Обери дату народження.");
      return;
    }
    if (birthTemp > todayISO) {
      setBirthError("Дата народження не може бути в майбутньому.");
      return;
    }
    setBirthISO(birthTemp);
    setBirthOpen(false);
    setBirthError(null);
  };

  const closeBirth = () => {
    setBirthOpen(false);
    setBirthError(null);
  };

  const genderLabel = gender === "female" ? "Жінка" : gender === "male" ? "Чоловік" : "";
  const birthLabel = birthISO ? formatBirthDDMMYYYY(birthISO) : "";

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={[styles.root, { justifyContent: "center", alignItems: "center" }]}>
          <ActivityIndicator />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={StyleSheet.absoluteFill}>
        <Image source={LEAVES} resizeMode="cover" style={styles.bgLeaves} />
        <View style={styles.bgOverlay} pointerEvents="none" />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.root}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <Text style={styles.h1}>{t("profile")}</Text>
            <Text style={styles.syncText}>{saving ? "Збереження…" : " "}</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.cardInner}>
              <Text style={styles.sectionTitle}>Дані профілю</Text>

              <View style={styles.fieldWrap}>
                <View style={styles.inputBlock}>
                  <Text style={styles.label}>Імʼя</Text>
                  <TextInput
                    value={displayName}
                    onChangeText={setDisplayName}
                    placeholder="Наприклад: Надя"
                    placeholderTextColor={PAL.placeholder}
                    style={styles.input}
                    autoCapitalize="words"
                    returnKeyType="done"
                  />
                </View>

                <View style={[styles.inputBlock, { opacity: 0.92 }]}>
                  <Text style={styles.label}>Електронна пошта</Text>
                  <TextInput value={email} editable={false} style={styles.input} />
                </View>

                <Pressable onPress={() => setGenderOpen(true)} style={({ pressed }) => [styles.pressField, { opacity: pressed ? 0.9 : 1 }]}>
                  <View style={styles.pressFieldLeft}>
                    <Text style={styles.label}>Стать</Text>
                    <Text style={genderLabel ? styles.pressValue : styles.pressPlaceholder}>{genderLabel || "Не обрано"}</Text>
                  </View>
                </Pressable>

                <Pressable onPress={openBirth} style={({ pressed }) => [styles.pressField, { opacity: pressed ? 0.9 : 1 }]}>
                  <View style={styles.pressFieldLeft}>
                    <Text style={styles.label}>Дата народження</Text>
                    <Text style={birthLabel ? styles.pressValue : styles.pressPlaceholder}>{birthLabel || "Натисни, щоб вибрати дату"}</Text>
                  </View>
                </Pressable>

                <View style={styles.inputBlock}>
                  <Text style={styles.label}>Номер телефону</Text>

                  <View style={styles.phoneRow}>
                    <Pressable onPress={() => setCountryOpen(true)} style={({ pressed }) => [styles.countryInline, pressed && { opacity: 0.9 }]}>
                      <Text style={styles.countryFlag}>{country.flag}</Text>
                      <Text style={styles.countryDial}>{country.dial}</Text>
                      <Text style={styles.countryChevron}>▾</Text>
                    </Pressable>

                    <TextInput
                      value={formatPhonePretty(phoneDigits)}
                      onChangeText={(tt) => setPhoneDigits(stripToDigits(tt).slice(0, 15))}
                      placeholder="Наприклад: 67 123 45 67"
                      placeholderTextColor={PAL.placeholder}
                      keyboardType="phone-pad"
                      style={styles.phoneInlineInput}
                      returnKeyType="done"
                    />
                  </View>
                </View>
              </View>

              <Pressable style={({ pressed }) => [styles.dangerBtn, { opacity: pressed ? 0.9 : 1 }]} onPress={() => {}}>
                <View style={styles.dangerInner}>
                  <Text style={styles.dangerText}>Видалити обліковий запис</Text>
                </View>
              </Pressable>

              <View style={styles.footer}>
                <Text style={styles.note}>Дякую за турботу про нашу планету 💚</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <GenderSheet
          visible={genderOpen}
          onClose={() => setGenderOpen(false)}
          onPick={(g: Gender) => {
            setGender(g);
            setGenderOpen(false);
          }}
          styles={styles}
          pal={PAL}
        />

        <CountrySheet
          visible={countryOpen}
          onClose={() => setCountryOpen(false)}
          onPick={(c: Country) => {
            setCountry(c);
            setCountryOpen(false);
          }}
          styles={styles}
          pal={PAL}
        />

        <Modal visible={birthOpen} transparent animationType="fade" onRequestClose={closeBirth}>
          <Pressable style={styles.modalBg} onPress={closeBirth}>
            <Pressable style={styles.modalCard} onPress={() => {}}>
              <View style={styles.birthHeader}>
                <Text style={styles.modalTitle}>Дата народження</Text>
                <View style={styles.birthBadge}>
                  <Text style={styles.birthBadgeText}>{birthTemp ? formatBirthDDMMYYYY(birthTemp) : "Не обрано"}</Text>
                </View>
              </View>

              <Text style={styles.modalSub}>Оберіть дату</Text>

              <View style={styles.pickerCard}>
                <Calendar
                  key={calCursor}
                  firstDay={1}
                  enableSwipeMonths={false}
                  current={calCursor}
                  markedDates={markedBirth}
                  onDayPress={onPickBirthDay}
                  maxDate={todayISO}
                  disableAllTouchEventsForDisabledDays
                  disableArrowRight={ymOf(calCursor) >= ymOf(todayISO)}
                  onMonthChange={(m) => {
                    const next = `${m.year}-${pad2(m.month)}-01`;
                    const clamped = clampISOToToday(next, todayISO);
                    setCalCursor(clamped);
                  }}
                  renderArrow={(direction) => (
                    <Text style={{ color: PAL.accent, fontSize: 22, fontFamily: "Manrope_700Bold", paddingHorizontal: 6, paddingVertical: 2 }}>
                      {direction === "left" ? "‹" : "›"}
                    </Text>
                  )}
                  renderHeader={(date) => {
                    const m = date.getMonth();
                    const y = date.getFullYear();
                    return (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                        <Pressable onPress={() => setMonthOpen(true)} style={{ paddingVertical: 4 }}>
                          <Text style={{ color: PAL.text, fontSize: 16, fontFamily: "Nunito_800ExtraBold" }}>
                            {monthsUA[m]} ▾
                          </Text>
                        </Pressable>

                        <Pressable onPress={() => setYearOpen(true)} style={{ paddingVertical: 4 }}>
                          <Text style={{ color: PAL.text, fontSize: 16, fontFamily: "Nunito_800ExtraBold" }}>
                            {y} ▾
                          </Text>
                        </Pressable>
                      </View>
                    );
                  }}
                  theme={{
                    backgroundColor: "transparent",
                    calendarBackground: "transparent",
                    textSectionTitleColor: PAL.sub,
                    dayTextColor: PAL.text,
                    monthTextColor: PAL.text,
                    arrowColor: PAL.accent,
                    todayTextColor: PAL.accent,
                    selectedDayBackgroundColor: PAL.accent,
                    selectedDayTextColor: "#fff",
                    textDisabledColor: "rgba(200,200,200,0.35)",
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

              {birthError ? <Text style={styles.errorText}>{birthError}</Text> : null}

              <View style={styles.actionsRow}>
                <Pressable onPress={closeBirth} style={({ pressed }) => [styles.btnGhost, { opacity: pressed ? 0.85 : 1 }]}>
                  <Text style={styles.btnGhostText}>Скасувати</Text>
                </Pressable>
                <Pressable onPress={applyBirth} style={({ pressed }) => [styles.btnPrimary, { opacity: pressed ? 0.85 : 1 }]}>
                  <Text style={styles.btnPrimaryText}>Застосувати</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        <YearSheet
          visible={yearOpen}
          onClose={() => setYearOpen(false)}
          years={years}
          styles={styles}
          pal={PAL}
          onPick={(y) => {
            const base = birthTemp ?? birthISO ?? todayISO;
            const next = clampISOToToday(setISOYear(base, y), todayISO);
            setBirthTemp(next);
            setCalCursor(`${next.slice(0, 7)}-01`);
            setYearOpen(false);
            setBirthError(null);
          }}
        />

        <MonthSheet
  visible={monthOpen}
  onClose={() => setMonthOpen(false)}
  months={monthsUA}
  styles={styles}
  pal={PAL}
  maxMonthAllowed={maxMonthAllowed}
  onPick={(m1to12) => {
    const base = birthTemp ?? birthISO ?? todayISO;
    const next = setISOMonth(base, m1to12); 
    setBirthTemp(next);
    setCalCursor(`${next.slice(0, 7)}-01`);
    setMonthOpen(false);
    setBirthError(null);
  }}
/>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function GenderSheet({
  visible,
  onClose,
  onPick,
  styles,
  pal,
}: {
  visible: boolean;
  onClose: () => void;
  onPick: (g: Gender) => void;
  styles: any;
  pal: Pal;
}) {
  const items: Array<{ key: Gender; label: string }> = [
    { key: "female", label: "Жінка" },
    { key: "male", label: "Чоловік" },
    { key: null, label: "Не вказувати" },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBg} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={() => {}}>
          <Text style={styles.modalTitle}>Стать</Text>
          <Text style={styles.modalSub}>Обери варіант.</Text>

          <View style={styles.listCard}>
            {items.map((it, idx) => (
              <Pressable
                key={String(it.key)}
                onPress={() => onPick(it.key)}
                style={({ pressed }) => [
                  styles.listItem,
                  { opacity: pressed ? 0.9 : 1 },
                  idx !== items.length - 1 ? { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: pal.line } : null,
                ]}
              >
                <Text style={styles.listItemText}>{it.label}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.actionsRow}>
            <Pressable onPress={onClose} style={({ pressed }) => [styles.btnGhost, { opacity: pressed ? 0.85 : 1 }]}>
              <Text style={styles.btnGhostText}>Закрити</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function CountrySheet({
  visible,
  onClose,
  onPick,
  styles,
  pal,
}: {
  visible: boolean;
  onClose: () => void;
  onPick: (c: Country) => void;
  styles: any;
  pal: Pal;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBg} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={() => {}}>
          <Text style={styles.modalTitle}>Код країни</Text>
          <Text style={styles.modalSub}>Обери країну.</Text>

          <View style={styles.listCard}>
            {COUNTRIES.map((c, idx) => (
              <Pressable
                key={c.code}
                onPress={() => onPick(c)}
                style={({ pressed }) => [
                  styles.listItem,
                  { opacity: pressed ? 0.9 : 1 },
                  idx !== COUNTRIES.length - 1 ? { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: pal.line } : null,
                ]}
              >
                <Text style={styles.listItemText}>
                  {c.flag} {c.label} ({c.dial})
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.actionsRow}>
            <Pressable onPress={onClose} style={({ pressed }) => [styles.btnGhost, { opacity: pressed ? 0.85 : 1 }]}>
              <Text style={styles.btnGhostText}>Закрити</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function YearSheet({
  visible,
  onClose,
  onPick,
  styles,
  pal,
  years,
}: {
  visible: boolean;
  onClose: () => void;
  onPick: (y: number) => void;
  styles: any;
  pal: any;
  years: number[];
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBg} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={() => {}}>
          <Text style={styles.modalTitle}>Обрати рік</Text>

          <View style={[styles.listCard, { maxHeight: 420 }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {years.map((y, idx) => (
                <Pressable
                  key={String(y)}
                  onPress={() => onPick(y)}
                  style={({ pressed }) => [
                    styles.listItem,
                    { opacity: pressed ? 0.9 : 1 },
                    idx !== years.length - 1 ? { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: pal.line } : null,
                  ]}
                >
                  <Text style={styles.listItemText}>{y}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <View style={styles.actionsRow}>
            <Pressable onPress={onClose} style={({ pressed }) => [styles.btnGhost, { opacity: pressed ? 0.85 : 1 }]}>
              <Text style={styles.btnGhostText}>Закрити</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function MonthSheet({
  visible,
  onClose,
  onPick,
  styles,
  pal,
  months,
  maxMonthAllowed,
}: {
  visible: boolean;
  onClose: () => void;
  onPick: (m1to12: number) => void;
  styles: any;
  pal: any;
  months: string[];
  maxMonthAllowed: number; 
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBg} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={() => {}}>
          <Text style={styles.modalTitle}>Обрати місяць</Text>

          <View style={[styles.listCard, { maxHeight: 420 }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {months.map((name, idx) => {
                const m = idx + 1;
                const disabled = m > maxMonthAllowed;

                return (
                  <Pressable
                    key={String(m)}
                    onPress={() => {
                      if (disabled) return;
                      onPick(m);
                    }}
                    style={({ pressed }) => [
                      styles.listItem,
                      { opacity: disabled ? 0.35 : pressed ? 0.9 : 1 },
                      idx !== months.length - 1
                        ? { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: pal.line }
                        : null,
                    ]}
                  >
                    <Text style={styles.listItemText}>{name}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.actionsRow}>
            <Pressable onPress={onClose} style={({ pressed }) => [styles.btnGhost, { opacity: pressed ? 0.85 : 1 }]}>
              <Text style={styles.btnGhostText}>Закрити</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}