import "react-native-gesture-handler";
import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, useColorScheme } from "react-native";
import { NavigationContainer, DefaultTheme, DarkTheme } from "@react-navigation/native";
import * as Linking from "expo-linking";
import * as SplashScreen from "expo-splash-screen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useFonts } from "expo-font";
import { Nunito_800ExtraBold, Nunito_700Bold } from "@expo-google-fonts/nunito";
import { Manrope_600SemiBold, Manrope_700Bold } from "@expo-google-fonts/manrope";
import RootStack from "./src/navigation/RootStack";
import OnboardingScreen from "./src/screens/OnboardingScreen";
import BottomTabs from "./src/navigation/BottomTabs";
import AuthScreen from "./src/screens/AuthScreen";
import LaunchOverlay from "./src/components/LaunchOverlay";

import { supabase } from "./src/lib/supabase";
import { SettingsProvider, useSettings } from "./src/context/SettingsContext";

SplashScreen.preventAutoHideAsync();

function getParam(url: string, key: string) {
  const re = new RegExp(`[?#&]${key}=([^&]+)`);
  const m = url.match(re);
  return m?.[1] ? decodeURIComponent(m[1]) : null;
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Nunito_800ExtraBold,
    Nunito_700Bold,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });

  const [appReady, setAppReady] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);

  useEffect(() => {
    if (!fontsLoaded) return;

    (async () => {
      try {
        await new Promise((r) => setTimeout(r, 250));
      } finally {
        setAppReady(true);
        SplashScreen.hideAsync();
        setTimeout(() => setShowOverlay(false), 1600);
      }
    })();
  }, [fontsLoaded]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SettingsProvider>
        <View style={{ flex: 1 }}>
          <AppRoot />
          <LaunchOverlay visible={showOverlay || !fontsLoaded || !appReady} />
        </View>
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
      setHasSession(!!session);
      if (!session) setNeedsOnboarding(false);
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
    <NavigationContainer key={hasSession ? "app" : "auth"} theme={resolvedTheme === "dark" ? DarkTheme : DefaultTheme}>
      {!hasSession ? (
        <AuthScreen />
      ) : needsOnboarding ? (
        <OnboardingScreen lang={lang === "ua" ? "ua" : "en"} onDone={() => setNeedsOnboarding(false)} />
      ) : (
          <RootStack />
      )}
    </NavigationContainer>
  );
}