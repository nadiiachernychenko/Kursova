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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
  birth_date: string | null; // YYYY-MM-DD
  country_code: string;
  phone: string;
};

export function ProfileStubScreen() {
  const { colors, isDark } = useAppTheme() as any;
  const t = useT();

  const PAL = useMemo(() => makePal(colors, !!isDark), [colors, isDark]);
  const styles = useMemo(() => createStyles(PAL), [PAL]);

  const [userId, setUserId] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("Чікчак");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState<string>("");
  const [gender, setGender] = useState<Gender>(null);
  const [birth, setBirth] = useState(""); // DD.MM.YYYY

  const [country, setCountry] = useState<Country>(COUNTRIES[0]);
  const [phone, setPhone] = useState(""); 

  const [genderOpen, setGenderOpen] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);

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

      const { data: prof, error: profErr } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, gender, birth_date, country_code, phone")
        .eq("id", user.id)
        .maybeSingle<ProfileRow>();

      if (!profErr && prof) {
        setFirstName(prof.first_name ?? "");
        setLastName(prof.last_name ?? "");
        setGender((prof.gender as any) ?? null);

        setBirth(prof.birth_date ? formatBirthDDMMYYYY(prof.birth_date) : "");

        const found = prof.country_code
          ? COUNTRIES.find((x) => x.code === prof.country_code)
          : null;
        if (found) setCountry(found);

        
        setPhone((prof.phone ?? "").toString());
      } else {
        
      }

      hydratedRef.current = true;
      setLoading(false);
    })();
  }, []);

  const maskBirth = (s: string) => {
    const d = s.replace(/\D/g, "").slice(0, 8);
    const dd = d.slice(0, 2);
    const mm = d.slice(2, 4);
    const yyyy = d.slice(4, 8);
    return [dd, mm, yyyy].filter(Boolean).join(".");
  };

  const cleanPhone = (s: string) => s.replace(/[^\d]/g, "").slice(0, 15);

  const genderLabel =
    gender === "female" ? "Жінка" : gender === "male" ? "Чоловік" : " ";

  const scheduleSave = () => {
    if (!hydratedRef.current) return;
    if (!userId) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(async () => {
      setSaving(true);

      const birthISO = parseBirthDDMMYYYYToISO(birth); // YYYY-MM-DD or null

      const payload: ProfileRow = {
        id: userId,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        gender: gender ?? null,
        birth_date: birthISO,
        country_code: country.code,
        phone: phone.trim(), 
      };

      const { error } = await supabase.from("profiles").upsert(payload, {
        onConflict: "id",
      });

      setSaving(false);
    }, 700);
  };

  useEffect(() => {
    scheduleSave();
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstName, lastName, gender, birth, country.code, phone, userId]);

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.headerRow}>
            <Text style={styles.h1}>{t("profile")}</Text>
            {loading ? (
              <ActivityIndicator />
            ) : (
              <Text style={styles.syncText}>{saving ? "Збереження…" : " "}</Text>
            )}
          </View>

          <Field
            styles={styles}
            pal={PAL}
            icon="👤"
            label="Імʼя *"
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Надя"
          />

          <Field
            styles={styles}
            pal={PAL}
            icon="👤"
            label="Прізвище"
            value={lastName}
            onChangeText={setLastName}
            placeholder=" "
          />

          <Field
            styles={styles}
            pal={PAL}
            icon="✉️"
            label="Електронна пошта"
            value={email}
            onChangeText={() => {}}
            placeholder=" "
            editable={false}
          />

          {/* gender */}
          <Pressable
            onPress={() => setGenderOpen(true)}
            style={({ pressed }) => [styles.rowItem, pressed && { opacity: 0.9 }]}
          >
            <Text style={styles.icon}>🙂</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Стать</Text>
              <Text style={[styles.value, !gender && styles.placeholder]}>
                {genderLabel}
              </Text>
            </View>
            <Text style={styles.chev}>⌄</Text>
          </Pressable>

          <Field
            styles={styles}
            pal={PAL}
            icon="📅"
            label="Дата народження"
            value={birth}
            onChangeText={(tt: string) => setBirth(maskBirth(tt))}
            placeholder="20.01.2006"
            keyboardType="number-pad"
          />

          {/* phone */}
          <View style={styles.phoneRow}>
            <Pressable
              onPress={() => setCountryOpen(true)}
              style={({ pressed }) => [styles.countryBtn, pressed && { opacity: 0.9 }]}
            >
              <Text style={styles.countryFlag}>{country.flag}</Text>
              <Text style={styles.countryDial}>{country.dial}</Text>
              <Text style={styles.countryChev}>⌄</Text>
            </Pressable>

            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Номер телефону</Text>
              <TextInput
                value={phone}
                onChangeText={(tt) => setPhone(cleanPhone(tt))}
                placeholder="0637556233"
                placeholderTextColor={PAL.placeholder}
                keyboardType="phone-pad"
                style={styles.input}
              />
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.deleteBtn,
              { opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <Text style={styles.deleteText}>Видалити обліковий запис</Text>
          </Pressable>

         <View style={styles.center}>
           <Text style={styles.note}>
                   Дякую за турботу до нашої планети💚
          </Text>
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
        />

        <CountrySheet
          visible={countryOpen}
          onClose={() => setCountryOpen(false)}
          onPick={(c: Country) => {
            setCountry(c);
            setCountryOpen(false);
          }}
          styles={styles}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ---------------- helpers ---------------- */

function parseBirthDDMMYYYYToISO(s: string): string | null {
  const d = s.trim();
  if (!d) return null;

  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(d);
  if (!m) return null;

  const dd = Number(m[1]);
  const mm = Number(m[2]);
  const yyyy = Number(m[3]);

  if (yyyy < 1900 || yyyy > 2100) return null;
  if (mm < 1 || mm > 12) return null;

  const maxDay = new Date(yyyy, mm, 0).getDate();
  if (dd < 1 || dd > maxDay) return null;

  const iso = `${String(yyyy).padStart(4, "0")}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
  return iso;
}

function formatBirthDDMMYYYY(iso: string): string {
  // iso: YYYY-MM-DD
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return "";
  return `${m[3]}.${m[2]}.${m[1]}`;
}

/* ---------------- UI pieces ---------------- */

function Field(props: {
  styles: any;
  pal: { placeholder: string };
  icon: string;
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  keyboardType?: any;
  editable?: boolean;
}) {
  const {
    styles,
    pal,
    icon,
    label,
    value,
    onChangeText,
    placeholder,
    keyboardType,
    editable = true,
  } = props;

  return (
    <View style={styles.rowItem}>
      <Text style={styles.icon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.label}>{label}</Text>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={pal.placeholder}
          editable={editable}
          keyboardType={keyboardType}
          style={[styles.input, !editable && styles.disabled]}
        />
      </View>
    </View>
  );
}

function GenderSheet({
  visible,
  onClose,
  onPick,
  styles,
}: {
  visible: boolean;
  onClose: () => void;
  onPick: (g: Gender) => void;
  styles: any;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBg} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <Text style={styles.sheetTitle}>Оберіть стать</Text>

          <View style={styles.genderRow}>
            <Pressable
              style={({ pressed }) => [styles.genderBtn, pressed && { opacity: 0.9 }]}
              onPress={() => onPick("female")}
            >
              <Text style={styles.genderIcon}>🐼🎀</Text>
              <Text style={styles.genderText}>ЖІНКА</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.genderBtn, pressed && { opacity: 0.9 }]}
              onPress={() => onPick("male")}
            >
              <Text style={styles.genderIcon}>🐼🕶️</Text>
              <Text style={styles.genderText}>ЧОЛОВІК</Text>
            </Pressable>
          </View>

          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.sheetClose, pressed && { opacity: 0.9 }]}
          >
            <Text style={styles.sheetCloseText}>Закрити</Text>
          </Pressable>
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
}: {
  visible: boolean;
  onClose: () => void;
  onPick: (c: Country) => void;
  styles: any;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBg} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <Text style={styles.sheetTitle}>Код країни</Text>

          <View style={{ marginTop: 10 }}>
            {COUNTRIES.map((c) => (
              <Pressable
                key={c.code}
                onPress={() => onPick(c)}
                style={({ pressed }) => [styles.countryRow, pressed && { opacity: 0.9 }]}
              >
                <Text style={styles.countryRowFlag}>{c.flag}</Text>
                <Text style={styles.countryRowLabel}>{c.label}</Text>
                <Text style={styles.countryRowDial}>{c.dial}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.sheetClose, pressed && { opacity: 0.9 }]}
          >
            <Text style={styles.sheetCloseText}>Закрити</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/* ---------------- theme + styles ---------------- */

type Pal = {
  bg: string;
  card: string;
  text: string;
  sub: string;
  border: string;
  placeholder: string;
  danger: string;
};

function makePal(colors: any, isDark: boolean): Pal {
  const bg = colors?.bg ?? colors?.background ?? (isDark ? "#0E0F11" : "#FFFFFF");
  const card = colors?.card ?? (isDark ? "#15171A" : "#FFFFFF");
  const text =
    colors?.textOnDark ?? colors?.text ?? (isDark ? "#F2F3F4" : "#111214");
  const border =
    colors?.border ??
    (isDark ? "rgba(242,243,244,0.10)" : "rgba(17,18,20,0.10)");
  const muted =
    colors?.muted ??
    (isDark ? "rgba(242,243,244,0.70)" : "rgba(17,18,20,0.60)");

  return {
    bg,
    card,
    text,
    sub: muted,
    border,
    placeholder: muted,
    danger: "#ff5a5f",
  };
}

function createStyles(C: Pal) {
  const shadow = Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOpacity: 0.10,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 8 },
    },
    android: { elevation: 4 },
    default: {},
  });

  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.bg },
    container: { padding: 14, paddingBottom: 22, backgroundColor: C.bg },

    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 2,
    },
    center:
{
  flex:1,
  justifyContent:"center",
  alignItems:"center",
},

    h1: { fontSize: 20, fontWeight: "900", color: C.text },
    syncText: { fontSize: 12, fontWeight: "800", color: C.sub },

    rowItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: C.border,
    },

    icon: { width: 26, textAlign: "center", fontSize: 17 },

    label: { fontSize: 11, fontWeight: "800", color: C.sub },
    value: { marginTop: 4, fontSize: 16, fontWeight: "800", color: C.text },
    placeholder: { opacity: 0.35 },

    input: {
      marginTop: 4,
      fontSize: 16,
      fontWeight: "800",
      color: C.text,
      paddingVertical: 4, 
    },
    disabled: { opacity: 0.6 },

    chev: { fontSize: 16, fontWeight: "900", color: C.sub, paddingLeft: 6 },

    phoneRow: {
      flexDirection: "row",
      gap: 10,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: C.border,
      alignItems: "flex-start",
    },

    countryBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
      paddingHorizontal: 10,
      paddingVertical: 9, 
      borderRadius: 14,
      borderWidth: 1,
      borderColor: C.border,
      backgroundColor: C.card,
      ...shadow,
    },
    countryFlag: { fontSize: 15 },
    countryDial: { fontSize: 13, fontWeight: "900", color: C.text },
    countryChev: { fontSize: 13, fontWeight: "900", color: C.sub },

    deleteBtn: {
      marginTop: 16,
      paddingVertical: 12,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: C.border,
      backgroundColor: C.card,
      alignItems: "center",
      justifyContent: "center",
    },
    deleteText: { color: C.danger, fontWeight: "900", fontSize: 15 },

    note: { marginTop: 10, textAlign:"center", fontSize: 12, color: C.sub, lineHeight: 18 },

    modalBg: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.35)",
      padding: 14,
      justifyContent: "flex-end",
    },

    sheet: {
      backgroundColor: C.card,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: C.border,
      padding: 14,
      ...shadow,
    },
    sheetTitle: { fontSize: 17, fontWeight: "900", color: C.text },

    genderRow: { flexDirection: "row", gap: 12, marginTop: 12 },
    genderBtn: {
      flex: 1,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: C.border,
      backgroundColor: C.card,
      alignItems: "center",
      paddingVertical: 14, 
      gap: 6,
    },
    genderIcon: { fontSize: 30 },
    genderText: { fontSize: 12, fontWeight: "900", color: C.text, opacity: 0.9 },

    sheetClose: {
      alignSelf: "flex-end",
      marginTop: 12,
      borderWidth: 1,
      borderColor: C.border,
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 9,
      backgroundColor: C.card,
    },
    sheetCloseText: { fontSize: 12, fontWeight: "900", color: C.text },

    countryRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 11,
      paddingHorizontal: 12,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: C.border,
      backgroundColor: C.card,
      marginBottom: 10,
    },
    countryRowFlag: { fontSize: 18 },
    countryRowLabel: { flex: 1, fontSize: 14, fontWeight: "900", color: C.text },
    countryRowDial: { fontSize: 14, fontWeight: "900", color: C.sub },
  });
}
