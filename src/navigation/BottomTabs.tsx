import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import HomeStack from "./HomeStack";
import SortStack from "./SortStack";
import MapStack from "./MapStack";
import PandaTeachStack from "./PandaTeachStack";
export type RootTabParamList = {
  Home: undefined;
  Sort: undefined;
  Map: undefined;
  PandaTeach: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

export default function BottomTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerTitleAlign: "center" }}>
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{ title: "Головна",headerShown: false  }}
      />

      <Tab.Screen
        name="Sort"
        component={SortStack}
        options={{ title: "Сортування", headerShown: false }}
      />
<Tab.Screen
  name="PandaTeach"
  component={PandaTeachStack}
  options={{ title: "🐼 Панда вчить" }}
/>
      <Tab.Screen
        name="Map"
        component={MapStack}
        options={{ title: "Карта", headerShown: false }}
      />
    </Tab.Navigator>
  );
}
