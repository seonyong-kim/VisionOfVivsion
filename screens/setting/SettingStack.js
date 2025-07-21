import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import SettingScreen from "./SettingScreen";
import Favorites from "./Favorites";
import SpeechSetting from "./SpeechSetting";

const Stack = createNativeStackNavigator();

export default function SettingStack() {
  return (
    <Stack.Navigator
      initialRoutName="SettingMain"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="SettingMain" component={SettingScreen} />
      <Stack.Screen
        name="Favorites"
        component={Favorites}
        options={{ title: "즐겨찾는 장소" }}
      />
      <Stack.Screen
        name="SpeechSetting"
        component={SpeechSetting}
        options={{ title: "즐겨찾는 장소" }}
      />
    </Stack.Navigator>
  );
}