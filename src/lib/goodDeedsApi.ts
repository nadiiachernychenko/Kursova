import { supabase } from "./supabase";

export type GoodDeedRow = {
  day: string; 
  eco_done: boolean | null;
  challenge_done: boolean | null;
  challenge_text: string | null;
  eco_proof_url: string | null;
  challenge_proof_url: string | null;
  updated_at?: string | null;
};

export async function fetchGoodDeeds(limit = 60): Promise<GoodDeedRow[]> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return [];

  const { data, error } = await supabase
    .from("eco_days")
    .select("day, eco_done, challenge_done, challenge_text, eco_proof_url, challenge_proof_url, updated_at")
    .order("day", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as GoodDeedRow[];
}