import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import PandaTeachHomeScreen from "../screens/PandaTeach/PandaTeachHomeScreen";
import EcoFactsScreen from "../screens/PandaTeach/EcoFactsScreen";
import MyTruthScreen from "../screens/PandaTeach/MyTruthScreen";
import PandaAsksScreen from "../screens/PandaTeach/PandaAsksScreen";
import SortingScreen from "../screens/PandaTeach/SortingScreen";
import AccessCenterScreen from "../screens/PandaTeach/AccessCenterScreen";
import BeginnerQuestionsScreen from "../screens/PandaTeach/BeginnerQuestionsScreen";
import EcoExpertLevel2Screen from "../screens/PandaTeach/EcoExpertLevel2Screen";
import EcoExpertHubScreen from "../screens/PandaTeach/EcoExpertHubScreen";
import EcoExpertLevel1Screen from "../screens/PandaTeach/EcoExpertLevel1Screen";
import EcoExpertLevel3Screen from "../screens/PandaTeach/EcoExpertLevel3Screen";
import EcoExpertLevel2LessonScreen from "../screens/PandaTeach/EcoExpertLevel2LessonScreen";
export type PandaTeachStackParamList = {
  PandaTeachHome: undefined;
  EcoFacts: undefined;
  MyTruth: undefined;
  PandaAsks: undefined;
  Sorting: undefined;

  PandaShop: undefined; 
  EcoExpertHub: undefined;
  EcoExpertLevel1: undefined;
  EcoExpertLevel2: undefined;
  EcoExpertLevel2Lesson: { lessonId: string };
  EcoExpertLevel3: undefined;
  Beginner: undefined;
  BeginnerQuestions: undefined;
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

      <Stack.Screen name="PandaShop" component={AccessCenterScreen} />
      <Stack.Screen name="EcoExpertHub" component={EcoExpertHubScreen} />
      <Stack.Screen name="EcoExpertLevel1" component={EcoExpertLevel1Screen} />
      <Stack.Screen name="EcoExpertLevel2" component={EcoExpertLevel2Screen} />
      <Stack.Screen name="EcoExpertLevel2Lesson" component={EcoExpertLevel2LessonScreen} />
      <Stack.Screen name="EcoExpertLevel3" component={EcoExpertLevel3Screen} />
      <Stack.Screen name="Beginner" component={BeginnerQuestionsScreen} />
      <Stack.Screen name="BeginnerQuestions" component={BeginnerQuestionsScreen} />
    </Stack.Navigator>
  );
}