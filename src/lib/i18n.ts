import { useSettings } from "../context/SettingsContext";
import { FeedbackScreen } from "../screens/more/FeedbackScreen";

const ua = {
  // --- твои старые ключи ---
  profile: "Мій профіль",
  ecoLevel: "Мій еко-рівень",
  tabHome: "Головна",
  tabSort: "Сортування",
  tabPanda: "Панда вчить",
  tabMore: "Більше",
  tabMap: "Карта",

  userSection: "КОРИСТУВАЧ",
  goodDeeds: "Історія добрих справ",
  goodDeedsSub: "Усі твої еко-дії та бали",

  settings: "НАЛАШТУВАННЯ",
  theme: "Тема",
  reminders: "Нагадування",
  language: "Мова",

  support: "ПІДТРИМКА",
 supportTitle: "Підтримка",
supportCaption: "Звʼяжіться з нами наступними каналами",
supportFeedbackForm: "Форма зворотного звʼязку",
supportEmailLabel: "Email підтримки",
supportHotlineLabel: "Гаряча лінія",
supportFaq: "Часті питання (FAQ)",
supportClose: "Закрити",

feedbackTitle: "Зворотний звʼязок",
feedbackSub: "Опиши проблему або ідею — ми це прочитаємо",
feedbackSubjectLabel: "Тема",
feedbackSubjectPh: "Наприклад: Бали не нарахувались",
feedbackMessageLabel: "Повідомлення",
feedbackMessagePh: "Опиши, що сталося, і що ти очікувала",
feedbackSend: "Надіслати",
feedbackSending: "Надсилаємо...",
feedbackFillFieldsTitle: "Заповни поля",
feedbackFillFieldsMsg: "Тема і повідомлення обовʼязкові.",
feedbackDoneTitle: "Готово ✅",
feedbackDoneMsg: "Твоє звернення надіслано. Ми відповімо якнайшвидше.",
feedbackErrorTitle: "Помилка",
feedbackErrorMsg: "Не вдалося надіслати звернення. Спробуй пізніше.",
feedbackNote:
  "Якщо дуже терміново — скористайся гарячою лінією або email у розділі «Підтримка».",

  contact: "Зв'язатися з нами",
  contactSub: "FAQ, форма, email, гаряча лінія",

  logout: "Вийти з акаунту",

  enabled: "Увімкнено",
  disabled: "Вимкнено",
  chooseTheme: "Вибери вигляд додатку",
  chooseLanguage: "Вибери мову інтерфейсу",

  light: "Світла",
  dark: "Темна",
  system: "Автоматична",

  // --- FAQ ключи (добавляешь снизу) ---
  faqTitle: "Часті питання",
  faqSearchPh: "Пошук: нагадування, бали, профіль…",
  faqAll: "Усі",
  faqNothingFoundTitle: "Нічого не знайдено",
  faqNothingFoundSub: "Спробуй інші ключові слова або обери “Усі”.",
  faqHelped: "Це допомогло?",
  faqYes: "Так",
  faqNo: "Ні",
  faqCta: "Не знайшли відповідь? Напишіть нам",
  faqFooter: "Твій EcoLife 🐼",

  faqCat_start: "Початок",
  faqCat_points: "Бали та рівні",
  faqCat_reminders: "Нагадування",
  faqCat_account: "Профіль та акаунт",
 

  faqQ_what_is_ecolife: "Що таке EcoLife?",
  faqA_what_is_ecolife:
    "EcoLife — це застосунок з еко-звичками та мікро-челенджами. Він допомагає робити маленькі дії щодня (сортування, економія ресурсів, корисні звички), відстежувати прогрес і отримувати мотивацію.",
faqQ_how_to_start: "Як почати користуватися?",
faqA_how_to_start:
  "1) Відкрий «Головна».\n2) Обери еко-дію або челендж.\n3) Виконай дію — отримаєш бали.\n4) Дивись прогрес у «Еко-рівень».\n\nПорада: починай з простого (сортування або економія води) і роби це щодня — так швидше росте прогрес.",

faqQ_points_how: "Як нараховуються бали?",
faqA_points_how:
  "Бали нараховуються за виконання еко-дій у застосунку. У кожної дії є «цінність» у балах.\n\nЯк це виглядає:\n• ти обираєш дію → виконуєш → підтверджуєш (де потрібно) → система додає бали.",

faqQ_streak_what: "Що таке streak (серія днів)?",
faqA_streak_what:
  "Streak — це кількість днів поспіль, коли ти робиш хоча б одну корисну дію. Він потрібен, щоб тобі було легше сформувати екозвичку.\n\nЯк це працює:\n• зробив дію сьогодні → streak продовжився\n• пропустив день → streak може обнулитися або зменшитись.",

faqQ_reminders_how_work: "Як працюють нагадування?",
faqA_reminders_how_work:
  "Нагадування — це маленькі підказки, які допомагають щодня робити щось корисне для нашої планети.",

faqQ_reminders_no_work: "Чому нагадування можуть не приходити?",
faqA_reminders_no_work:
  "Іноді нагадування можуть не зʼявлятися через обмеження системи або налаштування телефону.\n\nЩо варто перевірити:\n• чи дозволені сповіщення для застосунку\n• чи не ввімкнений режим енергозбереження\n• чи застосунок не вимкнений у фоновому режимі\n\nЯкщо проблема повторюється — напиши нам, ми допоможемо.",

faqQ_reminders_change_time: "Коли приходить нагадування?",
faqA_reminders_change_time:
  "Кожного дня, о 19:00.",

faqQ_profile_where_saved: "Чи збережуться мої дані, якщо я перевстановлю застосунок?",
faqA_profile_where_saved:
  "Так. Твої основні дані профілю зберігаються разом з акаунтом.\n\nЦе означає:\n• після повторного входу дані відновляться\n• зміни в профілі зберігаються автоматично\n• ти можеш оновлювати або видаляти дані в будь-який момент",

faqQ_phone_optional: "Номер телефону обов’язковий?",
faqA_phone_optional:
  "Ні. Телефон — необов’язкове поле.",



} as const;

type Keys = keyof typeof ua;

const en: Record<Keys, string> = {
  // обязано содержать ВСЕ те же ключи что ua
  profile: "My profile",
  ecoLevel: "My eco level",
  tabHome: "Home",
  tabSort: "Sorting",
  tabPanda: "Panda teaches",
  tabMore: "More",
  tabMap: "Map",

  userSection: "USER",
  goodDeeds: "Good deeds history",
  goodDeedsSub: "All your eco actions and points",

  settings: "SETTINGS",
  theme: "Theme",
  reminders: "Reminders",
  language: "Language",

  support: "SUPPORT",
 supportTitle: "Support",
supportCaption: "Contact us using any of the options below",
supportFeedbackForm: "Feedback form",
supportEmailLabel: "Support email",
supportHotlineLabel: "Hotline",
supportFaq: "FAQ",
supportClose: "Close",

feedbackTitle: "Feedback",
feedbackSub: "Describe a problem or idea — we’ll read it",
feedbackSubjectLabel: "Subject",
feedbackSubjectPh: "For example: Points were not added",
feedbackMessageLabel: "Message",
feedbackMessagePh: "Describe what happened and what you expected",
feedbackSending: "Sending...",
feedbackSend: "Send",
feedbackFillFieldsTitle: "Fill in the fields",
feedbackFillFieldsMsg: "Subject and message are required.",
feedbackDoneTitle: "Done ✅",
feedbackDoneMsg: "Your message has been sent. We’ll get back to you as soon as possible.",
feedbackErrorTitle: "Error",
feedbackErrorMsg: "Could not send your message. Please try again later.",
feedbackNote: "If it’s urgent — use the hotline or email in the “Support” section.",

  contact: "Contact us",
  contactSub: "FAQ, form, email, hotline",

  logout: "Log out",

  enabled: "Enabled",
  disabled: "Disabled",
  chooseTheme: "Choose app appearance",
  chooseLanguage: "Choose interface language",

  light: "Light",
  dark: "Dark",
  system: "System",

  faqTitle: "FAQ",
  faqSearchPh: "Search: reminders, points, profile…",
  faqAll: "All",
  faqNothingFoundTitle: "Nothing found",
  faqNothingFoundSub: "Try different keywords or select “All”.",
  faqHelped: "Was this helpful?",
  faqYes: "Yes",
  faqNo: "No",
  faqCta: "Still no answer? Contact us",
  faqFooter: "EcoLife 🐼 • Local FAQ, works even offline",

  faqCat_start: "Getting started",
  faqCat_points: "Points & levels",
  faqCat_reminders: "Reminders",
  faqCat_account: "Profile & account",


  faqQ_what_is_ecolife: "What is EcoLife?",
  faqA_what_is_ecolife:
    "EcoLife is an app with eco-habits and micro-challenges. It helps you do small actions every day, track progress, and stay motivated.",
faqQ_how_to_start: "How do I start?",
faqA_how_to_start:
  "1) Open “Home”.\n2) Pick an eco-action or challenge.\n3) Complete it — you’ll get points.\n4) Track progress in “Eco level”.\n\nTip: start with simple habits (sorting or saving water) and repeat daily — progress grows faster.",

faqQ_points_how: "How are points awarded?",
faqA_points_how:
  "Points are awarded for completing eco-actions in the app. Each action has its own value.\n\nUser flow:\n• choose an action → complete it → confirm (if needed) → the app adds points.\n\nWhy: points drive your eco level and motivation.",

faqQ_streak_what: "What is a streak?",
faqA_streak_what:
  "A streak is the number of days in a row when you do at least one helpful action. It’s meant to build habits.\n\nLogic:\n• do an action today → streak continues\n• skip a day → streak may reset (depending on app rules).",
faqQ_reminders_how_work: "How do reminders work?",
faqA_reminders_how_work:
  "Reminders are small prompts that help you remember to do something good for the planet every day.",

faqQ_reminders_no_work: "Why might reminders not arrive?",
faqA_reminders_no_work:
  "Sometimes reminders may not appear because of system restrictions or phone settings.\n\nWhat to check:\n• whether notifications are allowed for the app\n• whether battery saving mode is enabled\n• whether the app is allowed to work in the background\n\nIf the problem continues — contact us and we’ll help.",

faqQ_reminders_change_time: "When does the reminder arrive?",
faqA_reminders_change_time:
  "Every day at 7:00 PM.",

faqQ_profile_where_saved: "Will my data be saved if I reinstall the app?",
faqA_profile_where_saved:
  "Yes. Your main profile data is saved together with your account.\n\nThis means:\n• after signing in again, your data will be restored\n• profile changes are saved automatically\n• you can update or delete your data at any time",

faqQ_phone_optional: "Is a phone number required?",
faqA_phone_optional:
  "No. The phone number is optional.",

};

const dict = { ua, en } as const;

export function useT() {
  const { lang } = useSettings();
  return (key: Keys) => dict[lang][key];
}
