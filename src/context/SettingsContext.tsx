import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type AppTheme = "light" | "dark" | "system";
export type AppLang = "ua" | "en";

type SettingsState = {
  theme: AppTheme;
  lang: AppLang;
  remindersEnabled: boolean;
};

type SettingsContextValue = SettingsState & {
  setTheme: (t: AppTheme) => void;
  setLang: (l: AppLang) => void;
  setRemindersEnabled: (v: boolean) => void;
  hydrated: boolean;
};

const STORAGE_KEY = "ecolife_settings_v1";

const defaultState: SettingsState = {
  theme: "system",
  lang: "ua",
  remindersEnabled: false,
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SettingsState>(defaultState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setState({ ...defaultState, ...(JSON.parse(raw) as Partial<SettingsState>) });
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state, hydrated]);

  const value = useMemo<SettingsContextValue>(
    () => ({
      ...state,
      hydrated,
      setTheme: (theme) => setState((s) => ({ ...s, theme })),
      setLang: (lang) => setState((s) => ({ ...s, lang })),
      setRemindersEnabled: (remindersEnabled) => setState((s) => ({ ...s, remindersEnabled })),
    }),
    [state, hydrated]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
