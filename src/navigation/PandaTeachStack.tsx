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
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PandaTeachHome" component={PandaTeachHomeScreen} />
      <Stack.Screen name="EcoFacts" component={EcoFactsScreen} />
      <Stack.Screen name="MyTruth" component={MyTruthScreen} />
      <Stack.Screen name="PandaAsks" component={PandaAsksScreen} />
      <Stack.Screen name="Sorting" component={SortingScreen} />
      <Stack.Screen name="PandaShop" component={PandaShopScreen} />
    </Stack.Navigator>
  );
}