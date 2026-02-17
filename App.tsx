import "react-native-gesture-handler";
import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, useColorScheme } from "react-native";
import { NavigationContainer, DefaultTheme, DarkTheme } from "@react-navigation/native";
import * as Linking from "expo-linking";
import OnboardingScreen from "./src/screens/OnboardingScreen";

import { supabase } from "./src/lib/supabase";
import BottomTabs from "./src/navigation/BottomTabs";
import AuthScreen from "./src/screens/AuthScreen";
import { SettingsProvider, useSettings } from "./src/context/SettingsContext";
import { GestureHandlerRootView } from "react-native-gesture-handler";

function getParam(url: string, key: string) {
  const re = new RegExp(`[?#&]${key}=([^&]+)`);
  const m = url.match(re);
  return m?.[1] ? decodeURIComponent(m[1]) : null;
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SettingsProvider>
        <AppRoot />
      </SettingsProvider>
    </GestureHandlerRootView>
  );
}



function AppRoot() {
  const [loading, setLoading] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const system = useColorScheme();
  const { theme, lang } = useSettings();

  const refresh = async () => {
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    setHasSession(!!session);

    if (!session?.user) {
      setNeedsOnboarding(false);
      return;
    }

    const u = session.user;
    const fullName = (u.user_metadata as any)?.full_name ?? (u.user_metadata as any)?.name ?? null;
    const avatar = (u.user_metadata as any)?.avatar_url ?? (u.user_metadata as any)?.picture ?? null;

    await supabase.from("profiles").upsert(
      {
        id: u.id,
        first_name: fullName,
        avatar_url: avatar,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    const { data: p } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", u.id)
      .maybeSingle();

    setNeedsOnboarding(!(p?.onboarding_completed ?? false));
  };

  useEffect(() => {
    let mounted = true;

    const boot = async () => {
      await refresh();
      if (!mounted) return;
      setLoading(false);
    };

   const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
  console.log("AUTH EVENT:", _event);

  setHasSession(!!session);

  if (!session) {
    setNeedsOnboarding(false);
  }
});

    const handleUrl = async (url: string) => {
      try {
        const code = getParam(url, "code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error) await refresh();
          return;
        }

        const access_token = getParam(url, "access_token");
        const refresh_token = getParam(url, "refresh_token");
        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (!error) await refresh();
          return;
        }
      } catch {}
    };

    Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url);
    });

    const urlSub = Linking.addEventListener("url", (ev) => handleUrl(ev.url));

    boot();

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
      urlSub.remove();
    };
  }, []);

  const resolvedTheme = theme === "system" ? (system ?? "dark") : theme;

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
  <NavigationContainer
    key={hasSession ? "app" : "auth"}
    theme={resolvedTheme === "dark" ? DarkTheme : DefaultTheme}
  >
    {!hasSession ? (
      <AuthScreen />
    ) : needsOnboarding ? (
      <OnboardingScreen lang={lang === "ua" ? "ua" : "en"} onDone={() => setNeedsOnboarding(false)} />
    ) : (
      <BottomTabs />
    )}
  </NavigationContainer>
);

}
