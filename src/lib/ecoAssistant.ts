// src/lib/ecoAssistant.ts
import type { WasteCategoryId } from "../data/sorting";
export type EcoAssistantPayload = {
  query?: string;
  barcode?: string;
  hint?: string;


  wantStructured?: boolean;
};

export type EcoAssistantProduct = {
  title?: string;
  brand?: string;
  source?: string;
  image_url?: string;
  cached?: boolean;
};

export type EcoAssistantResult = {
  answer: string;

  categoryId?: WasteCategoryId;
  confidence?: number; // 0..1
  followUp?: string;

  resolved?: boolean;
  product?: EcoAssistantProduct;
};

function clamp01(x: any): number | undefined {
  const n = typeof x === "number" ? x : Number(x);
  if (!Number.isFinite(n)) return undefined;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}
const ALLOWED_CATS: WasteCategoryId[] = ["paper", "plastic", "glass", "metal", "organic", "hazard"];

function normalizeCatId(v: any): WasteCategoryId | undefined {
  const s = typeof v === "string" ? v.trim().toLowerCase() : "";
  return (ALLOWED_CATS as string[]).includes(s) ? (s as WasteCategoryId) : undefined;
}
function safeJsonParse(text: string): any | null {
  try {
    return JSON.parse(text);
  } catch {
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return null;
    try {
      return JSON.parse(m[0]);
    } catch {
      return null;
    }
  }
}

function normalizeResult(raw: any): EcoAssistantResult {
  if (typeof raw === "string") {
    return { answer: raw };
  }

  const answer =
    typeof raw?.answer === "string"
      ? raw.answer
      : typeof raw?.text === "string"
      ? raw.text
      : typeof raw?.message === "string"
      ? raw.message
            : "Не зміг сформувати відповідь. Спробуй уточнити предмет/упаковку.";;

const categoryId = normalizeCatId(raw?.categoryId);
  const confidence = clamp01(raw?.confidence);
  const followUp = typeof raw?.followUp === "string" ? raw.followUp : undefined;

  const resolved = typeof raw?.resolved === "boolean" ? raw.resolved : undefined;

  const product =
    raw?.product && typeof raw.product === "object"
      ? {
          title: typeof raw.product.title === "string" ? raw.product.title : undefined,
          brand: typeof raw.product.brand === "string" ? raw.product.brand : undefined,
          source: typeof raw.product.source === "string" ? raw.product.source : undefined,
          image_url: typeof raw.product.image_url === "string" ? raw.product.image_url : undefined,
cached: typeof raw.product.cached === "boolean" ? raw.product.cached : undefined,
}      : undefined;

  return {
    answer,
    categoryId,
    confidence,
    followUp,
    resolved,
    product,
  };
}

export async function askEcoAssistant(payload: EcoAssistantPayload): Promise<EcoAssistantResult> {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) throw new Error("Missing Supabase env");

  const bodyToSend = {
    ...payload,
    wantStructured: payload.wantStructured ?? true,
  };

  const r = await fetch(`${url}/functions/v1/eco-assistant`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      apikey: anon,
      authorization: `Bearer ${anon}`,
    } as any,
    body: JSON.stringify(bodyToSend),
  });

  const text = await r.text();
  const parsed = safeJsonParse(text);
  const body = parsed ?? text;

  if (!r.ok) {
    throw new Error(typeof body === "string" ? body : JSON.stringify(body));
  }

  return normalizeResult(body);
}