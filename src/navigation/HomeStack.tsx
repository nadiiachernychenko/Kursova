import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeScreen from "../screens/HomeScreen";
import StatisticsScreen from "../screens/StatisticsScreen";


export type HomeStackParamList = {
  HomeMain: undefined;
  Statistics: undefined;
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="HomeMain"
        component={HomeScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="Statistics"
        component={StatisticsScreen}
        options={{ title: "Статистика", headerTitleAlign: "center" }}
      />
    </Stack.Navigator>
  );
}
