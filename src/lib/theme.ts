import { useColorScheme } from "react-native";
import { useSettings } from "../context/SettingsContext";

export function useAppTheme() {
  const system = useColorScheme();
  const { theme } = useSettings();

  const resolved = theme === "system" ? (system ?? "dark") : theme;
  const isDark = resolved === "dark";

  return {
    isDark,
    colors: {
      bg: isDark ? "#050B16" : "#F6F7FB",
      card: isDark
        ? "rgba(255,255,255,0.07)"
        : "rgba(2,6,23,0.04)",
      border: isDark
        ? "rgba(148,163,184,0.18)"
        : "rgba(15,23,42,0.12)",
      textOnDark: isDark ? "#EAF0FF" : "#0F172A",
      muted: isDark ? "rgba(203,213,225,0.75)" : "#475569",
      accent: "#7DD3FC",
      danger: "#EF4444",
    },
  };
}
