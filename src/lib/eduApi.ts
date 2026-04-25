import { supabase } from "./supabase";

export type EduSource = "facts" | "myth" | "asks" | "sorting" | "lesson_bonus" | "beginner";

type Rarity = "common" | "rare" | "epic";

function errMsg(e: any) {
  return e?.message || e?.error_description || e?.details || String(e ?? "Unknown error");
}

export type EduProfile = {
  user_id: string;
  points_total: number;
  expert_unlocked: boolean;
  expert_level: number;
};

export async function ensureUserEdu() {
  const { data, error } = await supabase.rpc("ensure_user_edu");
  if (error) throw new Error(errMsg(error));
  return data;
}

export async function getEduProfile(): Promise<EduProfile> {
  const { data: sess } = await supabase.auth.getSession();
  const uid = sess.session?.user?.id;
  if (!uid) throw new Error("No session");

  await ensureUserEdu();

  const { data, error } = await supabase
    .from("user_edu_profile")
    .select("user_id, points_total, expert_unlocked, expert_level")
    .eq("user_id", uid)
    .single();

  if (error) throw new Error(errMsg(error));

  return data as EduProfile;
}

export async function earnEduPoints(source: EduSource, amount: number) {
  const { data, error } = await supabase.rpc("earn_edu_points", {
    p_source: source,
    p_amount: amount,
  });
  if (error) throw new Error(errMsg(error));
  return data;
}

export type AccessItemRow = {
  id: string;
  type: "expert_access" | "expert_upgrade";
  name: string;
  cost: number;
  rarity: Rarity;
  is_active: boolean;
  created_at: string;
  expert_level: number | null;
};

export async function getShopItems(): Promise<AccessItemRow[]> {
  const { data, error } = await supabase
    .from("edu_access_items")
    .select("id, type, name, cost, rarity, is_active, created_at, expert_level")
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (error) throw new Error(errMsg(error));
  return (data ?? []) as AccessItemRow[];
}

export type BuyAccessResult = {
  ok: boolean;
  pointsLeft?: number;
  reward?: { type: string; level?: number; title?: string; rarity?: string; icon?: string | null; value?: string };
  reason?: string;
  current_level?: number;
  need?: number;
};

export async function buyShopItem(itemId: string): Promise<BuyAccessResult> {
  const { data, error } = await supabase.rpc("buy_access_item", { p_item_id: itemId });
  if (error) throw new Error(errMsg(error));
  return data as BuyAccessResult;
}

export type ExpertLesson = {
  id: string;
  level: number;
  title: string;
  content: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  explain_answer: string;
  points_reward: number;
  sort_order: number;
  is_done: boolean;
};

export async function getExpertLessons(level = 2): Promise<ExpertLesson[]> {
  const { data, error } = await supabase.rpc("get_expert_lessons", { p_level: level });
  if (error) throw new Error(errMsg(error));
  return (data ?? []) as ExpertLesson[];
}

export async function resetExpertLessonProgress(lessonId: string) {
  const { data, error } = await supabase.rpc("reset_expert_lesson_progress", {
    p_lesson_id: lessonId,
  });
  if (error) throw new Error(errMsg(error));
  return data as {
    ok: boolean;
    points_removed?: number;
    reason?: string;
  };
}

export type ExpertLessonAnswerResult = {
  ok: boolean;
  correct?: boolean;
  completed?: boolean;
  try_again?: boolean;
  points_added?: number;
  explain?: string;
  reason?: string;
};

export async function answerExpertLesson(
  lessonId: string,
  choiceIndex: number,
  attemptNo: number
): Promise<ExpertLessonAnswerResult> {
  const { data, error } = await supabase.rpc("answer_expert_lesson", {
    p_lesson_id: lessonId,
    p_choice_index: choiceIndex,
    p_attempt_no: attemptNo,
  });
  if (error) throw new Error(errMsg(error));
  return data as ExpertLessonAnswerResult;
}

export type ExpertItem = {
  id: string;
  level: number;
  question: string;
  options: string[];
};

export type ExpertAnswerResult = {
  ok: boolean;
  correct?: boolean;
  points_added?: number;
  explain?: string;
  reason?: string;
};

export async function getExpertItem(level = 1): Promise<ExpertItem | null> {
  const { data, error } = await supabase.rpc("get_expert_item", { p_level: level });
  if (error) throw new Error(errMsg(error));
  const row = Array.isArray(data) ? data[0] : data;
  return (row ?? null) as ExpertItem | null;
}

export async function answerExpertItem(itemId: string, choiceIndex: number): Promise<ExpertAnswerResult> {
  const { data, error } = await supabase.rpc("answer_expert_item", {
    p_item_id: itemId,
    p_choice_index: choiceIndex,
  });
  if (error) throw new Error(errMsg(error));
  return data as ExpertAnswerResult;
}

export type ExpertCase = {
  id: string;
  level: number;
  story: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
  points: number;
  created_at?: string;
};

export type ExpertCaseAnswerResult = {
  ok: boolean;
  correct?: boolean;
  points_added?: number;
  explain?: string;
  reason?: string;
};

export async function getExpertCase(level = 3): Promise<ExpertCase | null> {
  const { data: sess } = await supabase.auth.getSession();
  const uid = sess.session?.user?.id;
  if (!uid) throw new Error("No session");

  const { data: answeredRows, error: answeredError } = await supabase
    .from("user_edu_expert_cases")
    .select("case_id")
    .eq("user_id", uid);

  if (answeredError) throw new Error(errMsg(answeredError));

  const answeredIds = (answeredRows ?? [])
    .map((x: any) => x.case_id)
    .filter(Boolean);

  let query = supabase
    .from("edu_expert_cases")
    .select("id, level, story, question, options, correct_index, explanation, points, created_at")
    .eq("level", level)
    .order("created_at", { ascending: true });

  if (answeredIds.length > 0) {
    const ids = answeredIds.map((x: string) => `"${x}"`).join(",");
    query = query.not("id", "in", `(${ids})`);
  }

  const { data, error } = await query.limit(1).maybeSingle();

  if (error) throw new Error(errMsg(error));
  if (!data) return null;

  return {
    id: data.id,
    level: Number(data.level ?? 0),
    story: data.story ?? "",
    question: data.question ?? "",
    options: Array.isArray(data.options) ? data.options : [],
    correct_index: Number(data.correct_index ?? 0),
    explanation: data.explanation ?? "",
    points: Number(data.points ?? 0),
    created_at: data.created_at ?? undefined,
  };
}

export async function answerExpertCase(caseId: string, choiceIndex: number): Promise<ExpertCaseAnswerResult> {
  const { data: sess } = await supabase.auth.getSession();
  const uid = sess.session?.user?.id;
  if (!uid) throw new Error("No session");

  const { data: existing, error: existingError } = await supabase
    .from("user_edu_expert_cases")
    .select("id")
    .eq("user_id", uid)
    .eq("case_id", caseId)
    .maybeSingle();

  if (existingError) throw new Error(errMsg(existingError));

  if (existing) {
    return {
      ok: false,
      reason: "already_answered",
    };
  }

  const { data: caseRow, error: caseError } = await supabase
    .from("edu_expert_cases")
    .select("id, correct_index, explanation, points")
    .eq("id", caseId)
    .single();

  if (caseError) throw new Error(errMsg(caseError));
  if (!caseRow) throw new Error("Ситуацію не знайдено");

  const correct = Number(caseRow.correct_index ?? 0) === Number(choiceIndex);
  const pointsToAdd = correct ? Number(caseRow.points ?? 0) : 0;

  const { error: insertError } = await supabase
    .from("user_edu_expert_cases")
    .insert({
      user_id: uid,
      case_id: caseId,
      chosen_index: choiceIndex,
      is_correct: correct,
    });

  if (insertError) throw new Error(errMsg(insertError));

  if (pointsToAdd > 0) {
    const { data: profile, error: profileError } = await supabase
      .from("user_edu_profile")
      .select("points_total")
      .eq("user_id", uid)
      .single();

    if (profileError) throw new Error(errMsg(profileError));

    const currentPoints = Number(profile?.points_total ?? 0);

    const { error: updateError } = await supabase
      .from("user_edu_profile")
      .update({
        points_total: currentPoints + pointsToAdd,
      })
      .eq("user_id", uid);

    if (updateError) throw new Error(errMsg(updateError));
  }

  return {
    ok: true,
    correct,
    explain: caseRow.explanation ?? "",
    points_added: pointsToAdd,
  };
}

export type BadgeRow = {
  id: string;
  title: string;
  rarity: Rarity;
  icon?: string | null;
};

export type MyBadge = {
  badge_id: string;
  created_at: string;
  badge: BadgeRow | null;
};

export async function getMyBadges(limit = 30): Promise<MyBadge[]> {
  const { data: sess } = await supabase.auth.getSession();
  const uid = sess.session?.user?.id;
  if (!uid) throw new Error("No session");

  const { data, error } = await supabase
    .from("user_badges")
    .select("badge_id, created_at, badge:badges(id, title, rarity, icon)")
    .eq("user_id", uid)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(errMsg(error));

  const rows = (data ?? []) as any[];
  return rows.map((r) => {
    const b = Array.isArray(r.badge) ? (r.badge[0] ?? null) : (r.badge ?? null);
    return { badge_id: r.badge_id, created_at: r.created_at, badge: b };
  });
}