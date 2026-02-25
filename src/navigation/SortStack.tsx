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
    <Stack.Navigator>
      <Stack.Screen name="SortMain" component={SortScreen} options={{ title: "Сортування" }} />
      <Stack.Screen name="Intro" component={SortIntroScreen} options={{ title: "Як сортувати" }} />
      <Stack.Screen name="Scan" component={SortScanScreen} options={{ title: "Скануй" }} />
      <Stack.Screen name="Assistant" component={SortAssistantScreen} options={{ title: "Запитай" }} />
      <Stack.Screen
        name="Category"
        component={CategoryScreen}
        options={({ route }) => ({ title: route.params?.title ?? "Деталі" })}
      />
    </Stack.Navigator>
  );
}