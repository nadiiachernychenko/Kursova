import { supabase } from "./supabase";
import { ensureAuth } from "./auth";
import * as FileSystem from "expo-file-system/legacy";

const BUCKET = "proofs";

export type EcoDayUpsert = {
  day: string;
  eco_done?: boolean;
  eco_proof_url?: string | null;

  challenge_done?: boolean;
  challenge_seconds?: number | null;
  challenge_text?: string | null;
  challenge_proof_url?: string | null;
};

export type EcoDayRow = {
  id?: string;
  user_id: string;
  day: string;

  eco_done: boolean | null;
  eco_proof_url: string | null;

  challenge_done: boolean | null;
  challenge_seconds: number | null;
  challenge_text: string | null;
  challenge_proof_url: string | null;

  created_at?: string;
  updated_at?: string;
};

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

function formatDayInKyiv(date: Date): string | null {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Kyiv",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);

    const y = parts.find((p) => p.type === "year")?.value;
    const m = parts.find((p) => p.type === "month")?.value;
    const d = parts.find((p) => p.type === "day")?.value;

    const key = `${y}-${m}-${d}`;
    return DAY_RE.test(key) ? key : null;
  } catch {
    return null;
  }
}

export function kyivDayKey(input: any = new Date()): string {
  const base = input instanceof Date ? input : new Date(input);

  if (!(base instanceof Date) || Number.isNaN(base.getTime())) {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  const kyiv = formatDayInKyiv(base);
  if (kyiv) return kyiv;

  const y = base.getFullYear();
  const m = String(base.getMonth() + 1).padStart(2, "0");
  const d = String(base.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function assertDay(day: string) {
  if (!DAY_RE.test(day)) {
    console.log("🚨 Invalid day format:", day);
    throw new Error(`Invalid day format: ${day}`);
  }
}

let cachedUserId: string | null = null;

async function requireUserId(): Promise<string> {
  if (cachedUserId) return cachedUserId;
  const user = await ensureAuth();
  if (!user?.id) throw new Error("No user");
  cachedUserId = user.id;
  return user.id;
}

function guessExt(uri: string) {
  const m = uri.toLowerCase().match(/\.(jpg|jpeg|png|webp|heic|heif|jfif)(\?.*)?$/);
  if (!m) return "jpg";
  const ext = m[1];
  if (ext === "jpeg" || ext === "jfif") return "jpg";
  return ext;
}

function guessContentType(uri: string) {
  const ext = guessExt(uri);
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "heic" || ext === "heif") return "image/heic";
  return "image/jpeg";
}

export async function uploadProof(kind: "eco" | "challenge", uri: string, day: string) {
  const { data: u } = await supabase.auth.getUser();
  const userId = u.user?.id;
  if (!userId) throw new Error("No user");

  assertDay(day);

  const ext = guessExt(uri);
  const fileName = `${day}_${Date.now()}.${ext}`;
  const path = `${kind}/${userId}/${fileName}`;

  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  // В RN/Expo обычно есть atob. Если вдруг нет — скажи, дам безопасный polyfill.
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

  const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, {
    contentType: guessContentType(uri),
    upsert: false,
  });

  if (error) throw error;

  return path;
}

export async function getProofSignedUrl(path: string, expiresInSec = 60 * 60 * 24 * 7) {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, expiresInSec);
  if (error) throw error;
  return data.signedUrl;
}

export async function getEcoDay(day: string): Promise<EcoDayRow | null> {
  assertDay(day);
  const userId = await requireUserId();

  const { data, error } = await supabase
    .from("eco_days")
    .select("*")
    .eq("user_id", userId)
    .eq("day", day)
    .maybeSingle();

  if (error) throw error;
  return (data as EcoDayRow) ?? null;
}

export async function upsertEcoDay(payload: EcoDayUpsert): Promise<EcoDayRow> {
  assertDay(payload.day);
  const userId = await requireUserId();
  const existing = await getEcoDay(payload.day);

  const merged: Partial<EcoDayRow> & { user_id: string; day: string } = {
    user_id: userId,
    day: payload.day,

    eco_done: payload.eco_done ?? existing?.eco_done ?? false,
    challenge_done: payload.challenge_done ?? existing?.challenge_done ?? false,

    challenge_seconds:
      payload.challenge_seconds !== undefined
        ? payload.challenge_seconds
        : existing?.challenge_seconds ?? null,

    challenge_text:
      payload.challenge_text !== undefined
        ? payload.challenge_text
        : existing?.challenge_text ?? null,
  };

  merged.eco_proof_url = payload.eco_proof_url ? payload.eco_proof_url : existing?.eco_proof_url ?? null;
  merged.challenge_proof_url = payload.challenge_proof_url
    ? payload.challenge_proof_url
    : existing?.challenge_proof_url ?? null;

  const { data, error } = await supabase
    .from("eco_days")
    .upsert(merged, { onConflict: "user_id,day" })
    .select("*")
    .single();

  if (error) throw error;
  return data as EcoDayRow;
}

export async function getEcoHistory(limit = 200): Promise<EcoDayRow[]> {
  const userId = await requireUserId();

  const { data, error } = await supabase
    .from("eco_days")
    .select("*")
    .eq("user_id", userId)
    .eq("challenge_done", true)
    .not("challenge_text", "is", null)
    .order("day", { ascending: false })
    .limit(limit);

  if (error) throw error;

  const rows = (data as EcoDayRow[]) ?? [];
  return rows.filter((r: any) => typeof r?.day === "string" && DAY_RE.test(r.day));
}

export async function deleteEcoDay(day: string) {
  assertDay(day);
  const userId = await requireUserId();

  // 1) прочитать пути (если есть)
  const { data: row, error: readErr } = await supabase
    .from("eco_days")
    .select("challenge_proof_url, eco_proof_url")
    .eq("user_id", userId)
    .eq("day", day)
    .maybeSingle();

  if (readErr) throw readErr;

  // 2) удалить строку из БД
  const { error: delErr } = await supabase
    .from("eco_days")
    .delete()
    .eq("user_id", userId)
    .eq("day", day);

  if (delErr) throw delErr;

  // 3) опционально удалить файлы в storage
  const paths = [row?.challenge_proof_url, row?.eco_proof_url].filter(Boolean) as string[];
  if (paths.length) {
    try {
      await supabase.storage.from(BUCKET).remove(paths);
    } catch {
      // если нет прав на remove — игнор, запись уже удалена
    }
  }
}

export async function getEcoDaysRange(fromDay: string, toDay: string): Promise<EcoDayRow[]> {
  assertDay(fromDay);
  assertDay(toDay);

  const userId = await requireUserId();

  const { data, error } = await supabase
    .from("eco_days")
    .select("*")
    .eq("user_id", userId)
    .gte("day", fromDay)
    .lte("day", toDay)
    .order("day", { ascending: true });

  if (error) throw error;

  const rows = (data as EcoDayRow[]) ?? [];
  return rows.filter((r: any) => typeof r?.day === "string" && DAY_RE.test(r.day));
}

export async function getLastNDays(n: number): Promise<EcoDayRow[]> {
  const to = kyivDayKey(new Date());

  const d = new Date();
  d.setDate(d.getDate() - (n - 1));
  const from = kyivDayKey(d);

  assertDay(from);
  assertDay(to);

  return getEcoDaysRange(from, to);
}
