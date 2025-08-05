import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import TutorialStart from "./TutorialStart";
import TutorialYoloCommand from "./TutorialYoloCommand";
import TutorialYoloResult from "./TutorialYoloResult";
import TutorialYoloDanger from "./TutorialYoloDanger";
import TutorialOcrCommand from "./TutorialOcrCommand";
import TutorialOcrResult from "./TutorialOcrResult";
import TutorialNavigationCommand from "./TutorialNavigationCommand";
import TutorialNavigationDestinationResult from "./TutorialNavigationDestinationResult";
import TutorialNavigationMapResult from "./TutorialNavigationMapResult";
import TutorialSetting from "./TutorialSetting";
import TutorialFinish from "./TutorialFinish";

const Stack = createNativeStackNavigator();

export default function TutorialStack() {
  return (
    <Stack.Navigator
      initialRouteName="TutorialStart"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen 
        name="TutorialStart" 
        component={TutorialStart} 
      />

      <Stack.Screen
        name="TutorialYoloCommand"
        component={TutorialYoloCommand}
      />

      <Stack.Screen
        name="TutorialYoloResult"
        component={TutorialYoloResult}
      />

      <Stack.Screen
        name="TutorialYoloDanger"
        component={TutorialYoloDanger}
      />

      <Stack.Screen
        name="TutorialOcrCommand"
        component={TutorialOcrCommand}
      />

      <Stack.Screen
        name="TutorialOcrResult"
        component={TutorialOcrResult}
      />

      <Stack.Screen
        name="TutorialNavigationCommand"
        component={TutorialNavigationCommand}
      />

      <Stack.Screen
        name="TutorialNavigationDestinationResult"
        component={TutorialNavigationDestinationResult}
      />

      <Stack.Screen
        name="TutorialNavigationMapResult"
        component={TutorialNavigationMapResult}
      />

      <Stack.Screen
        name="TutorialSetting"
        component={TutorialSetting}
      />

      <Stack.Screen
        name="TutorialFinish"
        component={TutorialFinish}
      />
      
    </Stack.Navigator>
  );
}