import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SortScreen from "../screens/SortScreen";
import SortIntroScreen from "../screens/SortIntroScreen";
import SortScanScreen from "../screens/SortScanScreen";
import SortAssistantScreen from "../screens/SortAssistantScreen";
import CategoryScreen from "../screens/CategoryScreen";
import type { WasteCategoryId } from "../data/sorting";

export type SortStackParamList = {
  SortMain: undefined;
  Intro: undefined;
  Scan: undefined;
  Assistant: { initialQuery?: string; barcode?: string } | undefined;
  Category: { id: WasteCategoryId; title?: string };
};

const Stack = createNativeStackNavigator<SortStackParamList>();

export default function SortStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SortMain" component={SortScreen} />
      <Stack.Screen name="Intro" component={SortIntroScreen} />
      <Stack.Screen name="Scan" component={SortScanScreen} />
      <Stack.Screen name="Assistant" component={SortAssistantScreen} />
      <Stack.Screen name="Category" component={CategoryScreen} />
    </Stack.Navigator>
  );
}