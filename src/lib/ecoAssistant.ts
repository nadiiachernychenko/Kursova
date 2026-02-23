import { supabase } from "./supabase";

export async function askEcoAssistant(query: string): Promise<{ answer: string }> {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) throw new Error("Missing Supabase env");

  const r = await fetch(`${url}/functions/v1/eco-assistant`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      apikey: anon,
      authorization: `Bearer ${anon}`,
    } as any,
    body: JSON.stringify({ query }),
  });

  const text = await r.text();
  let body: any = null;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }

  if (!r.ok) throw new Error(typeof body === "string" ? body : JSON.stringify(body));

  if (body && typeof body.answer === "string") return { answer: body.answer };
  if (typeof body === "string") return { answer: body };
  return { answer: JSON.stringify(body) };
}