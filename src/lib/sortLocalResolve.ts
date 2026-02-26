import type { WasteCategoryId } from "../data/sorting";

type LocalResolve =
  | { kind: "hit"; categoryId: WasteCategoryId; title?: string; confidence: number }
  | { kind: "none"; confidence: number };

function n(s: string) {
  return s.trim().toLowerCase();
}

function has(q: string, ...arr: string[]) {
  return arr.some((x) => q.includes(x));
}

export function resolveLocalSorting(query: string): LocalResolve {
  const q = n(query);
  if (!q) return { kind: "none", confidence: 0 };

  const pet = /\bpet\b|пет|поліетилентерефталат/.test(q);
  const pp = /\bpp\b|поліпропілен|полипропилен/.test(q);
  const hdpe = /\bhdpe\b|\bpe-hd\b|поліетилен високої щільності|полиэтилен высокой плотности/.test(q);
  const ldpe = /\bldpe\b|\bpe-ld\b|пакет|плівк|пленк/.test(q);
  const alu = /\balu\b|алюмін|алюмин|банка/.test(q);
  const gl = /\bgl\b|скло|склян|бутилк(а|и)\s*скло/.test(q);

  if (has(q, "батар", "акум", "ртут", "термометр", "ламп", "ліки", "просроч", "простроч")) {
    return { kind: "hit", categoryId: "hazard", confidence: 0.92, title: "Небезпечні" };
  }

  if (has(q, "аерозол", "балончик", "спрей")) {
    return { kind: "hit", categoryId: "hazard", confidence: 0.88, title: "Небезпечні" };
  }

  if (has(q, "чек", "термопапір", "термопапир")) {
    return { kind: "hit", categoryId: "hazard", confidence: 0.9, title: "Небезпечні" };
  }

  if (has(q, "тетрапак", "tетра пак", "tетра", "tетраpak", "tetra", "tetrapak", "пакет з фольгою")) {
    return { kind: "hit", categoryId: "plastic", confidence: 0.72, title: "Пластик" };
  }

  if (pet || pp || hdpe) return { kind: "hit", categoryId: "plastic", confidence: 0.86, title: "Пластик" };
  if (ldpe) return { kind: "hit", categoryId: "plastic", confidence: 0.72, title: "Пластик" };
  if (gl) return { kind: "hit", categoryId: "glass", confidence: 0.82, title: "Скло" };
  if (alu) return { kind: "hit", categoryId: "metal", confidence: 0.78, title: "Метал" };

  if (has(q, "картон", "папір", "бумага", "газета", "коробк", "зошит")) {
    return { kind: "hit", categoryId: "paper", confidence: 0.78, title: "Папір" };
  }

  if (has(q, "очистк", "шкірк", "шкурк", "кава", "чай", "органік", "харчов")) {
    return { kind: "hit", categoryId: "organic", confidence: 0.74, title: "Органіка" };
  }

  return { kind: "none", confidence: 0.35 };
}