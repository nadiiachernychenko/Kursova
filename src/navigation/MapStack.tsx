import React from "react";
import { Pressable, Text, View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import MapScreen, { type EcoPoint } from "../screens/MapScreen";
import PointDetailsScreen from "../screens/PointDetailsScreen";
import AddPointScreen from "../screens/AddPointScreen";
import MyPointsScreen from "../screens/MyPointsScreen";
import FavoritesScreen from "../screens/FavoritesScreen";

export type MapStackParamList = {
  MapMain:
    | undefined
    | {
        focusId?: string;
        focusNonce?: number;
        focusOnly?: boolean;
      };

  Favorites: undefined;
  MyPoints: undefined;
  PointDetails: { point: EcoPoint };
  AddPoint: undefined;
};

const Stack = createNativeStackNavigator<MapStackParamList>();

function HeaderBtn({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        opacity: pressed ? 0.5 : 1,
        paddingHorizontal: 10,
        paddingVertical: 6,
      })}
    >
      <Text style={{ fontSize: 14, fontWeight: "900" }}>{title}</Text>
    </Pressable>
  );
}

export default function MapStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="MapMain"
        component={MapScreen}
        options={({ navigation }) => ({
          title: "Карта",
          headerTitleAlign: "center",
          headerRight: () => (
            <View style={{ flexDirection: "row" }}>
              <HeaderBtn title="⭐" onPress={() => navigation.navigate("Favorites")} />
              <HeaderBtn title="Мої" onPress={() => navigation.navigate("MyPoints")} />
              <HeaderBtn title="➕" onPress={() => navigation.navigate("AddPoint")} />
            </View>
          ),
        })}
      />

      <Stack.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{ title: "Обране", headerTitleAlign: "center" }}
      />

      <Stack.Screen
        name="MyPoints"
        component={MyPointsScreen}
        options={{ title: "Мої пункти", headerTitleAlign: "center" }}
      />

      <Stack.Screen
        name="PointDetails"
        component={PointDetailsScreen}
        options={{ title: "Деталі", headerTitleAlign: "center" }}
      />

      <Stack.Screen
        name="AddPoint"
        component={AddPointScreen}
        options={{ title: "Додати пункт", headerTitleAlign: "center" }}
      />
    </Stack.Navigator>
  );
}
