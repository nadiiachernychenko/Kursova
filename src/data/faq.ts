export type FaqCategory = "start" | "points" | "reminders" | "account";

export type FaqItem = {
  id: string; 
  category: FaqCategory;
  tags?: string[];
};

export const FAQ: FaqItem[] = [
  { id: "what_is_ecolife", category: "start", tags: ["ecolife", "app", "habits"] },
  { id: "how_to_start", category: "start", tags: ["start", "how"] },

  { id: "points_how", category: "points", tags: ["points", "level"] },
  { id: "streak_what", category: "points", tags: ["streak"] },

  { id: "reminders_how_work", category: "reminders", tags: ["reminders", "19:00"] },
  { id: "reminders_no_work", category: "reminders", tags: ["expo go"] },
  { id: "reminders_change_time", category: "reminders", tags: ["time"] },

  { id: "profile_where_saved", category: "account", tags: ["supabase", "profile"] },
  { id: "phone_optional", category: "account", tags: ["phone"] },

];

export const FAQ_CATEGORY_KEYS: Record<FaqCategory, { titleKey: any; emoji: string }> = {
  start: { titleKey: "faqCat_start", emoji: "🚀" },
  points: { titleKey: "faqCat_points", emoji: "🏆" },
  reminders: { titleKey: "faqCat_reminders", emoji: "⏰" },
  account: { titleKey: "faqCat_account", emoji: "👤" },

};
