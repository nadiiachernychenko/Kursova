export type PandaMood =
  | "happy"
  | "happy1"
  | "love"
  | "morning"
  | "neutral"
  | "angry"
  | "question"
  | "sad";

export const pandaImages: Record<PandaMood, any> = {
  happy: require("../../assets/panda/happy.png"),
  happy1: require("../../assets/panda/happy1.png"),
  love: require("../../assets/panda/love.png"),
  morning: require("../../assets/panda/morning.png"),
  neutral: require("../../assets/panda/neutral.png"),
  angry: require("../../assets/panda/angry.png"),
  question: require("../../assets/panda/question.png"),
  sad: require("../../assets/panda/sad.png"),

};

export const pandaTexts: Record<PandaMood, string> = {
  happy: "Урррааааа",
  happy1: "Клас! Так тримати 💚",
  love: "Божечки...",
  morning: "Раночку, бігом до екосправ",
  neutral: "Куку",
  angry: "Такс, а ну ще раззз!",
  question: "Хм, цікавенько",
  sad: "Ех, давай ще разок",
};
