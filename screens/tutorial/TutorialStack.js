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
      <Stack.Screen name="TutorialStart" component={TutorialStart} />
      <Stack.Screen
        name="TutorialYoloCommand"
        component={TutorialYoloCommand}
        options={{ title: "객체 인식 명령어" }}
      />
      <Stack.Screen
        name="TutorialYoloResult"
        component={TutorialYoloResult}
        options={{ title: "객체 인식 명령어" }}
      />
      <Stack.Screen
        name="TutorialYoloDanger"
        component={TutorialYoloDanger}
        options={{ title: "객체 인식 명령어" }}
      />
      <Stack.Screen
        name="TutorialOcrCommand"
        component={TutorialOcrCommand}
        options={{ title: "객체 인식 명령어" }}
      />
      <Stack.Screen
        name="TutorialOcrResult"
        component={TutorialOcrResult}
        options={{ title: "객체 인식 명령어" }}
      />
      <Stack.Screen
        name="TutorialNavigationCommand"
        component={TutorialNavigationCommand}
        options={{ title: "객체 인식 명령어" }}
      />
      <Stack.Screen
        name="TutorialNavigationDestinationResult"
        component={TutorialNavigationDestinationResult}
        options={{ title: "객체 인식 명령어" }}
      />
      <Stack.Screen
        name="TutorialNavigationMapResult"
        component={TutorialNavigationMapResult}
        options={{ title: "객체 인식 명령어" }}
      />
      <Stack.Screen
        name="TutorialSetting"
        component={TutorialSetting}
        options={{ title: "객체 인식 명령어" }}
      />
      <Stack.Screen
        name="TutorialFinish"
        component={TutorialFinish}
        options={{ title: "객체 인식 명령어" }}
      />
    </Stack.Navigator>
  );
}