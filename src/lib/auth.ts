// src/lib/auth.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";

const KEY = "guest_creds_v1";

function rand(n = 16) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let s = "";
  for (let i = 0; i < n; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export async function ensureAuth() {
  // уже есть сессия?
  const s = await supabase.auth.getSession();
  if (s.data.session?.user) return s.data.session.user;

  // 1) анонимный вход (если включен в Supabase)
  try {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const anon = await supabase.auth.signInAnonymously();
    if (anon?.data?.user) return anon.data.user;
  } catch (e) {
    // тихо идём дальше
  }

  // 2) пробуем гостевые креды из AsyncStorage
  const saved = await AsyncStorage.getItem(KEY);
  if (saved) {
    try {
      const { email, password } = JSON.parse(saved);
      const signIn = await supabase.auth.signInWithPassword({ email, password });
      if (signIn.data.user) return signIn.data.user;

      if (signIn.error) {
        console.log("signInWithPassword(saved) error:", signIn.error.message);
      }
    } catch (e) {
      // если JSON битый — просто пересоздадим
      await AsyncStorage.removeItem(KEY);
    }
  }

  // 3) создаём гостя (email+pass)
  const email = `guest_${rand(12)}@ecolife.app`;
  const password = `P@ss_${rand(24)}`;

  const signUp = await supabase.auth.signUp({ email, password });

  // если у тебя включено подтверждение email — логин будет "Email not confirmed"
  // поэтому Confirm email должен быть OFF (как ты уже делала).
  if (signUp.error) {
    console.log("signUp error:", signUp.error.message);
  }

  await AsyncStorage.setItem(KEY, JSON.stringify({ email, password }));

  // пробуем войти
  const signIn = await supabase.auth.signInWithPassword({ email, password });

  if (signIn.error) {
    console.log("signInWithPassword error:", signIn.error.message);
    throw new Error(signIn.error.message);
  }
  if (!signIn.data.user) throw new Error("Auth failed");

  return signIn.data.user;
}
