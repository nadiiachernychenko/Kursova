import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

import HomeStack from "./HomeStack";
import SortStack from "./SortStack";
import MapStack from "./MapStack";
import PandaTeachStack from "./PandaTeachStack";
import MoreStack from "./MoreStack";

import { useAppTheme } from "../lib/theme";
import { useT } from "../lib/i18n";

export type RootTabParamList = {
  Home: undefined;
  Sort: undefined;
  PandaTeach: undefined;
  More: undefined;
  Map: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

export default function BottomTabs() {
  const { colors } = useAppTheme();
  const t = useT();

  return (
    <Tab.Navigator
      screenOptions={{
        headerTitleAlign: "center",
        headerStyle: { backgroundColor: colors.bg },
        headerTitleStyle: { color: colors.textOnDark },
        headerTintColor: colors.textOnDark,

        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          elevation: 0,
        },
        tabBarBackground: () => <View style={{ flex: 1, backgroundColor: colors.bg }} />,

        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{
          headerShown: false,
          title: t("tabHome"),
          tabBarLabel: t("tabHome"),
          tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} />,
        }}
      />

      <Tab.Screen
        name="Sort"
        component={SortStack}
        options={{
          headerShown: false,
          title: t("tabSort"),
          tabBarLabel: t("tabSort"),
          tabBarIcon: ({ color, size }) => <Ionicons name="repeat" color={color} size={size} />,
        }}
      />

      <Tab.Screen
        name="PandaTeach"
        component={PandaTeachStack}
        options={{
          headerShown: false,
          title: t("tabPanda"),
          tabBarLabel: t("tabPanda"),
          tabBarIcon: ({ color, size }) => <Ionicons name="school" color={color} size={size} />,
        }}
      />

    

      <Tab.Screen
        name="Map"
        component={MapStack}
        options={{
          headerShown: false,
          title: t("tabMap"),
          tabBarLabel: t("tabMap"),
          tabBarIcon: ({ color, size }) => <Ionicons name="map" color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}