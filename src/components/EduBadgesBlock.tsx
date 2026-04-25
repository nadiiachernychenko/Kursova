import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { getEduBadges } from "../lib/eduApi";

export default function EduBadgesBlock() {
  const [badges, setBadges] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const list = await getEduBadges();
      setBadges(list);
    })();
  }, []);

  return (
    <View style={styles.wrap}>
      <Text style={styles.h}>🎖 Значки</Text>
      {badges.length ? (
        badges.slice(0, 12).map((b: any) => (
          <Text key={b.badge_id} style={styles.item}>
            {b.edu_badges?.title} ({b.edu_badges?.rarity})
          </Text>
        ))
      ) : (
        <Text style={styles.empty}>Ще немає значків</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 12 },
  h: { fontSize: 14, fontFamily: "Manrope_700Bold" },
  item: { marginTop: 6, fontSize: 12, fontFamily: "Manrope_600SemiBold", opacity: 0.9 },
  empty: { marginTop: 6, fontSize: 12, fontFamily: "Manrope_600SemiBold", opacity: 0.6 },
});