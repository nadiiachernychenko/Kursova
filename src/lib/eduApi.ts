import { supabase } from "./supabase";

export type EduSource = "facts" | "myth" | "asks" | "sorting" | "lesson_bonus" | "beginner";;

function errMsg(e: any) {
  return e?.message || e?.error_description || e?.details || String(e ?? "Unknown error");
}

export async function ensureUserEdu() {
  const { data, error } = await supabase.rpc("ensure_user_edu");
  if (error) throw new Error(errMsg(error));
  return data;
}

export async function getEduProfile() {
  const { data: sess } = await supabase.auth.getSession();
  const uid = sess.session?.user?.id;
  if (!uid) throw new Error("No session");

  await ensureUserEdu();

  const { data, error } = await supabase
    .from("user_edu_profile")
    .select("user_id, points_total")
    .eq("user_id", uid)
    .single();

  if (error) throw new Error(errMsg(error));
  return data as { user_id: string; points_total: number };
}

export async function earnEduPoints(source: EduSource, amount: number) {
  const { data, error } = await supabase.rpc("earn_edu_points", {
    p_source: source,
    p_amount: amount,
  });
  if (error) throw new Error(errMsg(error));
  return data;
}

export async function getShopItems() {
  const { data, error } = await supabase
    .from("edu_shop_items")
    .select("id, title, cost, is_active, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(errMsg(error));
  return data ?? [];
}

export async function buyShopItem(itemId: string) {
  const { data, error } = await supabase.rpc("buy_shop_item", { p_item_id: itemId });
  if (error) throw new Error(errMsg(error));
  return data;
}

export async function getInventoryIds() {
  const { data: sess } = await supabase.auth.getSession();
  const uid = sess.session?.user?.id;
  if (!uid) throw new Error("No session");

  const { data, error } = await supabase
    .from("user_edu_inventory")
    .select("item_id")
    .eq("user_id", uid);

  if (error) throw new Error(errMsg(error));
  return (data ?? []).map((r: any) => r.item_id as string);
}
