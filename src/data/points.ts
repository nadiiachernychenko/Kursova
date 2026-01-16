import type { WasteCategoryId } from "./sorting";

export type EcoPoint = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  categories: WasteCategoryId[];
  note?: string;
};

// ДЕМО точки (можно расширять). Координаты примерные по Киеву.
export const POINTS: EcoPoint[] = [
  {
    id: "p1",
    name: "Пункт прийому вторсировини",
    address: "Київ, Контрактова площа",
    lat: 50.4667,
    lng: 30.5133,
    categories: ["paper", "plastic", "glass", "metal"],
    note: "Прийом у будні 10:00–18:00",
  },
  {
    id: "p2",
    name: "Еко-станція",
    address: "Київ, Лук'янівка",
    lat: 50.4623,
    lng: 30.4816,
    categories: ["paper", "plastic", "hazard"],
    note: "Батарейки/лампи — тільки у контейнер",
  },
  {
    id: "p3",
    name: "Скло окремо",
    address: "Київ, Позняки",
    lat: 50.3944,
    lng: 30.6346,
    categories: ["glass"],
  },
];
