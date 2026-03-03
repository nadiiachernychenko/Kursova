import { supabase } from "./supabase";

export type MythItem = {
  id: string;
  statement: string;
  truth: boolean;
  explanation: string;
  category: string | null;
  rarity: "common" | "rare" | "epic";
};

export async function getNextMythItem(lang: string = "uk"): Promise<MythItem | null> {
  const { data, error } = await supabase.rpc("edu_next_myth_item", { p_lang: lang });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  return {
    id: row.id,
    statement: row.statement,
    truth: row.truth,
    explanation: row.explanation,
    category: row.category ?? null,
    rarity: row.rarity,
  };
}

export async function saveMythAnswer(itemId: string, pickedTruth: boolean, isCorrect: boolean) {
  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  const uid = userRes?.user?.id;
  if (!uid) throw new Error("No user");

  const { error } = await supabase
    .from("edu_myth_answered")
    .insert({ user_id: uid, item_id: itemId, picked_truth: pickedTruth, is_correct: isCorrect });

  if (error && (error as any).code !== "23505") throw error;
}