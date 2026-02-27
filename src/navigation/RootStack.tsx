import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import BottomTabs from "./BottomTabs";
import MoreScreen from "../screens/more/MoreScreen";
import AppTopBar from "../components/AppTopBar";
export type RootStackParamList = {
  Tabs: undefined;
  More: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Tabs" component={BottomTabs} options={{ headerShown: false }} />
      <Stack.Screen name="More" component={MoreScreen} options={{ title: "Більше" }} />
    </Stack.Navigator>
  );
}