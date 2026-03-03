import { supabase } from "./supabase";

export type SortBin = "paper" | "plastic" | "glass" | "organic" | "other";

export type SortItem = {
  id: string;
  item_title: string;
  correct_bin: SortBin;
  hint: string | null;
  explanation: string | null;
  category: string | null;
};

export async function getNextSortItem(lang: string = "uk"): Promise<SortItem | null> {
  const { data, error } = await supabase.rpc("edu_next_sort_item", { p_lang: lang });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  return {
    id: row.id,
    item_title: row.item_title,
    correct_bin: row.correct_bin,
    hint: row.hint ?? null,
    explanation: row.explanation ?? null,
    category: row.category ?? null,
  };
}

export async function saveSortAnswer(itemId: string, pickedBin: SortBin, isCorrect: boolean) {
  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  const uid = userRes?.user?.id;
  if (!uid) throw new Error("No user");

  const { error } = await supabase
    .from("edu_sort_answered")
    .insert({ user_id: uid, item_id: itemId, picked_bin: pickedBin, is_correct: isCorrect });

  if (error && error.code !== "23505") throw error;
}