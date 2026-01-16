import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SortScreen from "../screens/SortScreen";
import CategoryScreen from "../screens/CategoryScreen";
import type { WasteCategoryId } from "../data/sorting";

export type SortStackParamList = {
  SortMain: undefined;
  Category: { id: WasteCategoryId };
};

const Stack = createNativeStackNavigator<SortStackParamList>();

export default function SortStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="SortMain"
        component={SortScreen}
        options={{ title: "Сортування" }}
      />
      <Stack.Screen
        name="Category"
        component={CategoryScreen}
        options={{ title: "Деталі" }}
      />
    </Stack.Navigator>
  );
}
