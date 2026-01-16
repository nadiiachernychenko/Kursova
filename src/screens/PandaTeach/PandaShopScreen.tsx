import React, { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, Alert } from "react-native";
import { getEduProfile, buyShopItem, getShopItems } from "../../lib/eduApi";
import { useEduProfile } from "../../lib/useEduProfile";

type ShopItem = { id: string; title: string; cost: number };

export default function PandaShopScreen() {
  const { points, refresh } = useEduProfile();
  const [items, setItems] = useState<ShopItem[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const list = await getShopItems();
        // если таблицы нет — покажем дефолт
        if (!list?.length) {
          setItems([
            { id: "leaf_hat", title: "🌿 Листочок на голову", cost: 40 },
            { id: "glasses", title: "🕶 Окуляри", cost: 80 },
            { id: "sprout", title: "🌱 Росток в лапах", cost: 60 },
          ]);
        } else {
          setItems(list.map((x: any) => ({ id: x.id, title: x.title, cost: Number(x.cost) })));
        }
      } catch {
        setItems([
          { id: "leaf_hat", title: "🌿 Листочок на голову", cost: 40 },
          { id: "glasses", title: "🕶 Окуляри", cost: 80 },
          { id: "sprout", title: "🌱 Росток в лапах", cost: 60 },
        ]);
      }
    })();
  }, []);

  const buy = async (item: ShopItem) => {
    try {
      setMsg(null);
      const res: any = await buyShopItem(item.id);
      await refresh();

      if (res?.ok === false) setMsg(res?.reason ?? "Не вдалося купити");
      else setMsg(`✅ Куплено: ${item.title}`);
    } catch (e: any) {
      Alert.alert("Помилка", e?.message ?? "Не вдалося купити");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.points}>⭐ Бали: {points}</Text>

      <View style={{ gap: 10 }}>
        {items.map((it) => (
          <View key={it.id} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{it.title}</Text>
              <Text style={styles.cost}>Ціна: {it.cost}</Text>
            </View>
            <Pressable onPress={() => buy(it)} style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }]}>
              <Text style={styles.btnText}>Купити</Text>
            </Pressable>
          </View>
        ))}
      </View>

      {msg ? <Text style={styles.msg}>{msg}</Text> : null}

      <Text style={styles.note}>
        Далі додамо: інвентар, «одягнути», і збереження вигляду панди.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 14 },
  points: { fontSize: 16, fontWeight: "800" },
  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderWidth: 1, borderRadius: 16 },
  title: { fontSize: 15, fontWeight: "700" },
  cost: { fontSize: 12, opacity: 0.7, marginTop: 4 },
  btn: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 14, borderWidth: 1 },
  btnText: { fontWeight: "800" },
  msg: { fontSize: 14, opacity: 0.9 },
  note: { fontSize: 12, opacity: 0.65, lineHeight: 18 },
});
