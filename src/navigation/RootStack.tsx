import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import BottomTabs from "./BottomTabs";
import MoreStack from "./MoreStack";

export type RootStackParamList = {
  Tabs: undefined;
  More: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Tabs" component={BottomTabs} options={{ headerShown: false }} />
      <Stack.Screen name="More" component={MoreStack} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}