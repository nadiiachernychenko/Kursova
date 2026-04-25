import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, Alert } from "react-native";
import { buyShopItem } from "../lib/eduApi";
import { useShop } from "../lib/useShop";
import { useEduProfile } from "../lib/useEduProfile";

export default function ShopScreen() {
  const { items } = useShop();
  const { points, refresh } = useEduProfile();
  const [msg, setMsg] = useState<string | null>(null);

  const handleBuy = async (id: string) => {
    try {
      const res = await await buyShopItem(id);
      await refresh();
      setMsg(
        res.reward?.type === "badge"
          ? `🎉 Вам випав: ${res.reward.title}`
          : "🔓 Доступ відкрито"
      );
    } catch (e: any) {
      Alert.alert("Помилка", e.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.points}>⭐ Балів: {points}</Text>

      {items.map((item) => (
        <View key={item.id} style={styles.card}>
          <View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.price}>{item.price} балів</Text>
          </View>

          <Pressable style={styles.btn} onPress={() => handleBuy(item.id)}>
            <Text style={styles.btnText}>Купити</Text>
          </Pressable>
        </View>
      ))}

      {msg && <Text style={styles.msg}>{msg}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 16 },
  points: { fontWeight: "800", fontSize: 16 },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { fontWeight: "700" },
  price: { opacity: 0.6, marginTop: 4 },
  btn: { borderWidth: 1, padding: 10, borderRadius: 12 },
  btnText: { fontWeight: "700" },
  msg: { marginTop: 10 },
});