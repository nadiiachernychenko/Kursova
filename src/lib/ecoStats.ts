// src/lib/ecoStats.ts
import { supabase } from "./supabase";
import { ensureAuth } from "./auth";
import * as FileSystem from "expo-file-system";
import { decode } from "base64-arraybuffer";

const BUCKET = "proofs";// или "proofs" если реально грузишь туда

// -------------------- types --------------------
export type EcoDayUpsert = {
  day: string; // YYYY-MM-DD
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

// -------------------- day utils --------------------
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Надёжно получает YYYY-MM-DD для Europe/Kyiv без toLocaleString,
 * чтобы НЕ получать NaN-NaN-NaN на Android/Hermes.
 */
function formatDayInKyiv(date: Date): string | null {
  try {
    // formatToParts обычно работает стабильнее, чем toLocaleString->new Date(...)
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
    if (DAY_RE.test(key)) return key;
    return null;
  } catch {
    return null;
  }
}

/**
 * Всегда возвращает валидный YYYY-MM-DD (без NaN),
 * fallback — локальная дата устройства.
 */
export function kyivDayKey(input: any = new Date()): string {
  const base = input instanceof Date ? input : new Date(input);

  // если base вообще Invalid Date
  if (!(base instanceof Date) || Number.isNaN(base.getTime())) {
    // fallback: локальная сегодняшняя дата
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  const kyiv = formatDayInKyiv(base);
  if (kyiv) return kyiv;

  // fallback если Intl/timeZone недоступны
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

// -------------------- auth cache --------------------
let cachedUserId: string | null = null;

async function requireUserId(): Promise<string> {
  if (cachedUserId) return cachedUserId;
  const user = await ensureAuth();
  if (!user?.id) throw new Error("No user");
  cachedUserId = user.id;
  return user.id;
}

// -------------------- file helpers --------------------
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


async function getPublicOrSignedUrl(path: string): Promise<string> {
  // всегда signed — меньше магии и “почему не грузится”
  const signed = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60 * 24 * 7);
  if (signed.error) throw signed.error;
  if (!signed.data?.signedUrl) throw new Error("No signed URL");
  return signed.data.signedUrl;
}


// -------------------- upload --------------------
export async function uploadProof(
  kind: "eco" | "challenge",
  localUri: string,
  day: string
): Promise<string> {
  assertDay(day);
  const userId = await requireUserId();

  // читаем как base64
// читаем как base64
const b64 = await FileSystem.readAsStringAsync(localUri, {
  encoding: "base64" as any,
});

// важно: декодируем base64 → ArrayBuffer
const bytes = decode(b64);



  const ext = guessExt(localUri);
  const contentType = guessContentType(localUri);

  const fileName = `${day}_${Date.now()}.${ext}`;
  const path = `${kind}/${userId}/${fileName}`;
console.log("ENV supabaseUrl:", process.env.EXPO_PUBLIC_SUPABASE_URL);
console.log("ENV bucket:", BUCKET);
console.log("UPLOAD path:", path);

const upload = await supabase.storage.from(BUCKET).upload(path, bytes, {
  contentType,
  upsert: true,
});

if (upload.error) {
  console.log("❌ uploadProof error:", upload.error);
  console.log("debug:", { BUCKET, path, contentType, len: (bytes as any)?.byteLength });
  throw upload.error;
}


  const url = await getPublicOrSignedUrl(path);
  console.log("✅ uploaded:", { bucket: BUCKET, path, url });
  return url;
}

// -------------------- db --------------------
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

  // не затираем null
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

export async function getEcoDaysRange(fromDay: string, toDay: string): Promise<EcoDayRow[]> {
  // ВАЖНО: чтобы не было NaN-NaN-NaN в запросе
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

  // защита
  assertDay(from);
  assertDay(to);

  return getEcoDaysRange(from, to);
}
