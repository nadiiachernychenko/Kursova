import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import PandaTeachHomeScreen from "../screens/PandaTeach/PandaTeachHomeScreen";
import EcoFactsScreen from "../screens/PandaTeach/EcoFactsScreen";
import MyTruthScreen from "../screens/PandaTeach/MyTruthScreen";
import PandaAsksScreen from "../screens/PandaTeach/PandaAsksScreen";
import SortingScreen from "../screens/PandaTeach/SortingScreen";
import PandaShopScreen from "../screens/PandaTeach/PandaShopScreen";

export type PandaTeachStackParamList = {
  PandaTeachHome: undefined;
  EcoFacts: undefined;
  MyTruth: undefined;
  PandaAsks: undefined;
  Sorting: undefined;
  PandaShop: undefined;
};

const Stack = createNativeStackNavigator<PandaTeachStackParamList>();

export default function PandaTeachStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="PandaTeachHome" component={PandaTeachHomeScreen} options={{ title: "Панда вчить" }} />
      <Stack.Screen name="EcoFacts" component={EcoFactsScreen} options={{ title: "Еко-факти" }} />
      <Stack.Screen name="MyTruth" component={MyTruthScreen} options={{ title: "Міф чи правда" }} />
      <Stack.Screen name="PandaAsks" component={PandaAsksScreen} options={{ title: "Панда питає" }} />
      <Stack.Screen name="Sorting" component={SortingScreen} options={{ title: "Сортування" }} />
      <Stack.Screen name="PandaShop" component={PandaShopScreen} options={{ title: "Магазин панди" }} />
    </Stack.Navigator>
  );
}
