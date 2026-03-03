import { supabase } from "./supabase";

export type EduAsk = {
  id: string;
  q: string;
  options: string[];
  correct_index: number;
  explain: string;
  category: string | null;
};

export async function getNextEduAsk(lang: string = "uk"): Promise<EduAsk | null> {
  const { data, error } = await supabase.rpc("edu_next_ask", { p_lang: lang });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  return {
    id: row.id,
    q: row.q,
    options: (row.options ?? []) as string[],
    correct_index: row.correct_index,
    explain: row.explain,
    category: row.category ?? null,
  };
}

export async function saveEduAskAnswer(askId: string, pickedIndex: number, isCorrect: boolean) {
  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  const uid = userRes?.user?.id;
  if (!uid) throw new Error("No user");

  const { error } = await supabase
    .from("edu_asks_answered")
    .insert({ user_id: uid, ask_id: askId, picked_index: pickedIndex, is_correct: isCorrect });

  if (error && error.code !== "23505") throw error;
}