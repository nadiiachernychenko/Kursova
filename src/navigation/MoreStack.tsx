import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import MoreScreen from "../screens/more/MoreScreen";
import { FeedbackScreen } from "../screens/more/FeedbackScreen";
import { ProfileStubScreen } from "../screens/more/ProfileStubScreen";
import EcoLevelStubScreen from "../screens/more/EcoLevelStubScreen";
import { GoodDeedsHistoryScreen } from "../screens/more/GoodDeedsHistoryScreen";
import { ThemePickerScreen } from "../screens/more/ThemePickerScreen";
import { LanguagePickerScreen } from "../screens/more/LanguagePickerScreen";
import FAQScreen from "../screens/support/FAQScreen";

import AccessCenterScreen from "../screens/PandaTeach/AccessCenterScreen";
import EcoExpertHubScreen from "../screens/PandaTeach/EcoExpertHubScreen";
import EcoExpertLevel1Screen from "../screens/PandaTeach/EcoExpertLevel1Screen";
import EcoExpertLevel2Screen from "../screens/PandaTeach/EcoExpertLevel2Screen";
import EcoExpertLevel2LessonScreen from "../screens/PandaTeach/EcoExpertLevel2LessonScreen";
import EcoExpertLevel3Screen from "../screens/PandaTeach/EcoExpertLevel3Screen";
export type MoreStackParamList = {
  MoreHome: undefined;
  FAQ: undefined;
  Feedback: undefined;
  Profile: undefined;
  EcoLevel: undefined;
  GoodDeedsHistory: undefined;
  ThemePicker: undefined;
  LanguagePicker: undefined;
  EcoExpertLevel2Lesson: { lessonId: string };
PandaShop: undefined;
  EcoExpertHub: undefined;
  EcoExpertLevel1: undefined;
  EcoExpertLevel2: undefined;
  EcoExpertLevel3: undefined;
};

const Stack = createNativeStackNavigator<MoreStackParamList>();

export default function MoreStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "transparent" } }}>
      <Stack.Screen name="MoreHome" component={MoreScreen} />
      <Stack.Screen name="FAQ" component={FAQScreen} />
      <Stack.Screen name="Feedback" component={FeedbackScreen} />
      <Stack.Screen name="Profile" component={ProfileStubScreen} />
      <Stack.Screen name="EcoLevel" component={EcoLevelStubScreen} />
      <Stack.Screen name="GoodDeedsHistory" component={GoodDeedsHistoryScreen} />
      <Stack.Screen name="ThemePicker" component={ThemePickerScreen} />
      <Stack.Screen name="LanguagePicker" component={LanguagePickerScreen} />

      <Stack.Screen name="PandaShop" component={AccessCenterScreen} />
      <Stack.Screen name="EcoExpertHub" component={EcoExpertHubScreen} />
      <Stack.Screen name="EcoExpertLevel1" component={EcoExpertLevel1Screen} />
      <Stack.Screen name="EcoExpertLevel2" component={EcoExpertLevel2Screen} />
      <Stack.Screen name="EcoExpertLevel2Lesson" component={EcoExpertLevel2LessonScreen} />
<Stack.Screen name="EcoExpertLevel3" component={EcoExpertLevel3Screen} />
    </Stack.Navigator>
  );
}