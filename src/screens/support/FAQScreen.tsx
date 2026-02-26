import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Platform,
  LayoutAnimation,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useAppTheme } from "../../lib/theme";
import { useT } from "../../lib/i18n";
import { FAQ, FAQ_CATEGORY_KEYS, type FaqItem, type FaqCategory } from "../../data/faq";

type CatFilter = "all" | FaqCategory;

export default function FAQScreen() {
  const nav = useNavigation<any>();
  const { colors, isDark } = useAppTheme() as any;
  const t = useT();

  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<CatFilter>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const PAL = useMemo(() => makePal(colors, !!isDark), [colors, isDark]);
  const styles = useMemo(() => createStyles(PAL), [PAL]);

  const itemText = (x: FaqItem) => {
  const qKey = ("faqQ_" + x.id) as any;
  const aKey = ("faqA_" + x.id) as any;

  const q = t(qKey) || x.id;        
  const a = t(aKey) || "";          
  const catKey = FAQ_CATEGORY_KEYS[x.category].titleKey as any;
  const catTitle = t(catKey) || x.category;

  return { q, a, catTitle };
};


  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FAQ.filter((x) => {
      const catOk = activeCat === "all" ? true : x.category === activeCat;
      if (!catOk) return false;
      if (!q) return true;

      const { q: qq, a: aa, catTitle } = itemText(x);

      const hay = [qq, aa, catTitle, (x.tags ?? []).join(" ")].join(" ").toLowerCase();
      return hay.includes(q);
    });
 }, [query, activeCat, t]);


  const toggle = (id: string) => {
    if (Platform.OS === "ios" || Platform.OS === "android") {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => nav.goBack()}
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.9 }]}
          >
            <Text style={styles.backTxt}>←</Text>
          </Pressable>

          <Text style={styles.h1}>{t("faqTitle")}</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔎</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t("faqSearchPh")}
            placeholderTextColor={PAL.placeholder}
            style={styles.searchInput}
          />
          {!!query && (
            <Pressable
              onPress={() => setQuery("")}
              style={({ pressed }) => [styles.clearBtn, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.clearTxt}>✕</Text>
            </Pressable>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
          <Chip styles={styles} active={activeCat === "all"} text={`✨ ${t("faqAll")}`} onPress={() => setActiveCat("all")} />

          {(Object.keys(FAQ_CATEGORY_KEYS) as FaqCategory[]).map((k) => (
            <Chip
              key={k}
              styles={styles}
              active={activeCat === k}
              text={`${FAQ_CATEGORY_KEYS[k].emoji} ${t(FAQ_CATEGORY_KEYS[k].titleKey)}`}
              onPress={() => setActiveCat(k)}
            />
          ))}
        </ScrollView>

        <View style={{ height: 10 }} />

        {list.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>{t("faqNothingFoundTitle")}</Text>
            <Text style={styles.emptySub}>{t("faqNothingFoundSub")}</Text>
          </View>
        ) : (
          list.map((item) => {
            const isOpen = openId === item.id;
            const { q, a, catTitle } = itemText(item);

            return (
              <Pressable
                key={item.id}
                onPress={() => toggle(item.id)}
                style={({ pressed }) => [styles.card, pressed && { opacity: 0.96 }]}
              >
                <View style={styles.cardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.q}>{q}</Text>
                    <Text style={styles.meta}>
                      {FAQ_CATEGORY_KEYS[item.category].emoji} {catTitle}
                    </Text>
                  </View>
                  <Text style={styles.chev}>{isOpen ? "⌃" : "⌄"}</Text>
                </View>

                {isOpen && (
                  <View style={styles.answerBox}>
                    <Text style={styles.a}>{a}</Text>

                    <View style={styles.helpRow}>
                      <Text style={styles.helpText}>{t("faqHelped")}</Text>
                      <Pressable style={({ pressed }) => [styles.helpBtn, pressed && { opacity: 0.9 }]}>
                        <Text style={styles.helpBtnTxt}>{t("faqYes")}</Text>
                      </Pressable>
                      <Pressable style={({ pressed }) => [styles.helpBtn, pressed && { opacity: 0.9 }]}>
                        <Text style={styles.helpBtnTxt}>{t("faqNo")}</Text>
                      </Pressable>
                    </View>

                    <Pressable
                      onPress={() => nav.navigate("Feedback")}
                      style={({ pressed }) => [styles.ctaBtn, pressed && { opacity: 0.9 }]}
                    >
                      <Text style={styles.ctaTxt}>{t("faqCta")}</Text>
                    </Pressable>
                  </View>
                )}
              </Pressable>
            );
          })
        )}

        <View style={{ height: 18 }} />
        <Text style={styles.footer}>{t("faqFooter")}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Chip({
  styles,
  active,
  text,
  onPress,
}: {
  styles: any;
  active: boolean;
  text: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && { opacity: 0.9 }]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{text}</Text>
    </Pressable>
  );
}

/* ---------- theme ---------- */

type Pal = {
  bg: string;
  card: string;
  text: string;
  sub: string;
  border: string;
  placeholder: string;
};

function makePal(colors: any, isDark: boolean): Pal {
  const bg = colors?.bg ?? colors?.background ?? (isDark ? "#0E0F11" : "#FFFFFF");
  const card = colors?.card ?? (isDark ? "#15171A" : "#FFFFFF");
  const text = colors?.textOnDark ?? colors?.text ?? (isDark ? "#F2F3F4" : "#111214");
  const border = colors?.border ?? (isDark ? "rgba(242,243,244,0.10)" : "rgba(17,18,20,0.10)");
  const muted = colors?.muted ?? (isDark ? "rgba(242,243,244,0.70)" : "rgba(17,18,20,0.60)");
  return { bg, card, text, sub: muted, border, placeholder: muted };
}

function createStyles(C: Pal) {
  const shadow = Platform.select({
    ios: { shadowColor: "#000", shadowOpacity: 0.10, shadowRadius: 14, shadowOffset: { width: 0, height: 8 } },
    android: { elevation: 3 },
    default: {},
  });

  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.bg },
    container: { padding: 14, paddingBottom: 24, backgroundColor: C.bg },

    headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: C.border,
      backgroundColor: C.card,
      ...shadow,
    },
    backTxt: { fontSize: 18, fontWeight: "900", color: C.text },
    h1: { fontSize: 20, fontWeight: "900", color: C.text },

    searchBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: C.border,
      backgroundColor: C.card,
      ...shadow,
    },
    searchIcon: { fontSize: 16 },
    searchInput: { flex: 1, fontSize: 14, fontWeight: "700", color: C.text, paddingVertical: 2 },
    clearBtn: {
      width: 28,
      height: 28,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: C.border,
      backgroundColor: C.card,
    },
    clearTxt: { fontSize: 12, fontWeight: "900", color: C.sub },

    catRow: { paddingVertical: 12, gap: 10 },
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: C.border,
      backgroundColor: C.card,
    },
    chipActive: { borderColor: "rgba(0,0,0,0)" },
    chipText: { fontSize: 12, fontWeight: "800", color: C.text, opacity: 0.9 },
    chipTextActive: { opacity: 1 },

    card: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: C.border,
      backgroundColor: C.card,
      padding: 12,
      marginBottom: 10,
      ...shadow,
    },
    cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
    q: { fontSize: 14, fontWeight: "900", color: C.text, lineHeight: 19 },
    meta: { marginTop: 6, fontSize: 12, fontWeight: "800", color: C.sub },
    chev: { fontSize: 16, fontWeight: "900", color: C.sub, paddingLeft: 6 },

    answerBox: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border },
    a: { fontSize: 13, fontWeight: "600", color: C.text, lineHeight: 19, opacity: 0.95 },

    helpRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 12, flexWrap: "wrap" },
    helpText: { fontSize: 12, fontWeight: "800", color: C.sub },
    helpBtn: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: C.border,
      backgroundColor: C.card,
    },
    helpBtnTxt: { fontSize: 12, fontWeight: "900", color: C.text },

    ctaBtn: {
      marginTop: 10,
      paddingVertical: 10,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: C.border,
      backgroundColor: C.card,
      alignItems: "center",
    },
    ctaTxt: { fontSize: 12, fontWeight: "900", color: C.text },

    emptyBox: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: C.border,
      backgroundColor: C.card,
      padding: 14,
      ...shadow,
    },
    emptyTitle: { fontSize: 14, fontWeight: "900", color: C.text },
    emptySub: { marginTop: 6, fontSize: 12, fontWeight: "700", color: C.sub, lineHeight: 18 },

    footer: { textAlign: "center", fontSize: 11, fontWeight: "800", color: C.sub, opacity: 0.9 },
  });
}
