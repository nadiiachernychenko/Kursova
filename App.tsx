import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import * as Linking from "expo-linking";

import { supabase } from "./src/lib/supabase";
import BottomTabs from "./src/navigation/BottomTabs";
import AuthScreen from "./src/screens/AuthScreen";

function getParam(url: string, key: string) {
  const re = new RegExp(`[?#&]${key}=([^&]+)`);
  const m = url.match(re);
  return m?.[1] ? decodeURIComponent(m[1]) : null;
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    let mounted = true;

    const refreshSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setHasSession(!!data.session);
      setLoading(false);
    };

    refreshSession();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasSession(!!session);
    });

    const handleUrl = async (url: string) => {
      try {
        console.log("OPENED URL:", url);

        const code = getParam(url, "code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error) await refreshSession();
          return;
        }

        const access_token = getParam(url, "access_token");
        const refresh_token = getParam(url, "refresh_token");
        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (!error) await refreshSession();
          return;
        }
      } catch {}
    };

    Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url);
    });

    const urlSub = Linking.addEventListener("url", (ev) => handleUrl(ev.url));

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
      urlSub.remove();
    };
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {hasSession ? <BottomTabs /> : <AuthScreen />}
    </NavigationContainer>
  );
}
