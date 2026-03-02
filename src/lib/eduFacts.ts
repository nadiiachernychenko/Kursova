import { supabase } from "./supabase";

export type EduFact = {
  id: string;
  text: string;
  category: string | null;
};

export async function getNextEduFact(lang: string = "uk"): Promise<EduFact | null> {
  const { data, error } = await supabase.rpc("edu_next_fact", { p_lang: lang });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  return { id: row.id, text: row.text, category: row.category ?? null };
}

export async function markEduFactSeen(factId: string) {
  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  const uid = userRes?.user?.id;
  if (!uid) throw new Error("No user");

  const { error } = await supabase.from("edu_fact_seen").insert({ user_id: uid, fact_id: factId });
  if (error && error.code !== "23505") throw error;
}