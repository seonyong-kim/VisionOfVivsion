import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import SettingScreen from "./SettingScreen";
import Favorites from "./Favorites"
import SettingSpeech from "./SettingSpeech";

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
      />
      <Stack.Screen
        name="SettingSpeech"
        component={SettingSpeech}
      />
    </Stack.Navigator>
  );
}