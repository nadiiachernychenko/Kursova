import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import MoreScreen from "../screens/more/MoreScreen";
import { FeedbackScreen } from "../screens/more/FeedbackScreen";
import { ProfileStubScreen } from "../screens/more/ProfileStubScreen";
import { EcoLevelStubScreen } from "../screens/more/EcoLevelStubScreen";

import { GoodDeedsHistoryScreen } from "../screens/more/GoodDeedsHistoryScreen";
import { ThemePickerScreen } from "../screens/more/ThemePickerScreen";
import { LanguagePickerScreen } from "../screens/more/LanguagePickerScreen";
import FAQScreen from "../screens/support/FAQScreen";

export type MoreStackParamList = {
  MoreHome: undefined;
  FAQ: undefined;
  Feedback: undefined;
  Profile: undefined;
  EcoLevel: undefined;
  GoodDeedsHistory: undefined;
  ThemePicker: undefined;
  LanguagePicker: undefined;
};

const Stack = createNativeStackNavigator<MoreStackParamList>();

export default function MoreStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "transparent" },
      }}
    >
      <Stack.Screen name="MoreHome" component={MoreScreen} />
      <Stack.Screen name="FAQ" component={FAQScreen} />
      <Stack.Screen name="Feedback" component={FeedbackScreen} />
      <Stack.Screen name="Profile" component={ProfileStubScreen} />
      <Stack.Screen name="EcoLevel" component={EcoLevelStubScreen} />
      <Stack.Screen name="GoodDeedsHistory" component={GoodDeedsHistoryScreen} />
      <Stack.Screen name="ThemePicker" component={ThemePickerScreen} />
      <Stack.Screen name="LanguagePicker" component={LanguagePickerScreen} />
    </Stack.Navigator>
  );
}