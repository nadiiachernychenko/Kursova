import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "../lib/theme";

type Props = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightText?: string;
  danger?: boolean;
    showChevron?: boolean;

};

export function ListItem({ icon, title, subtitle, onPress, rightText, danger, showChevron = true }: Props) {
  const { colors } = useAppTheme();

  return (
   <Pressable
  hitSlop={12}
  onPress={onPress}
  style={({ pressed }) => [
    styles.row,
    pressed && styles.pressed,
    { backgroundColor: colors.card, borderColor: colors.border },
  ]}
>

      <View style={styles.left}>
        <View style={[styles.iconWrap, { borderColor: colors.border, backgroundColor: "transparent" }]}>
          <Ionicons name={icon} size={18} color={danger ? colors.danger : colors.muted} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: danger ? colors.danger : colors.textOnDark }]} numberOfLines={1}>
            {title}
          </Text>
          {!!subtitle && (
            <Text style={[styles.subtitle, { color: colors.muted }]} numberOfLines={2}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.right}>
        {!!rightText && <Text style={[styles.rightText, { color: colors.muted }]}>{rightText}</Text>}
        {showChevron && <Ionicons name="chevron-forward" size={18} color={colors.muted} />}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  pressed: { opacity: 0.88, transform: [{ scale: 0.997 }] },
  left: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  title: { fontSize: 15, fontWeight: "700" },
  subtitle: { fontSize: 12, marginTop: 2, lineHeight: 16 },
  right: { flexDirection: "row", alignItems: "center", gap: 8 },
  rightText: { fontSize: 12 },
});
