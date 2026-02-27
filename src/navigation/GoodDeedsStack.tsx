import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { GoodDeedsHistoryScreen } from "../screens/more/GoodDeedsHistoryScreen"; 

export type GoodDeedsStackParamList = {
  GoodDeedsHistory: undefined;
};

const Stack = createNativeStackNavigator<GoodDeedsStackParamList>();

export default function GoodDeedsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="GoodDeedsHistory" component={GoodDeedsHistoryScreen} />
    </Stack.Navigator>
  );
}