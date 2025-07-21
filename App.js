import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import BottomTabNavigator from "./components/layout/BottomTabNavigator";
import Tutorial from "./screens/tutorial/TutorialStack";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName="Tutorial"
      >
        <Stack.Screen
          name="Tutorial"
          component={Tutorial}
          options={{ headerShown: false }} // 상단 바 안 보이게
        />
        <Stack.Screen
          name="Root"
          component={BottomTabNavigator}
          options={{ headerShown: false }} // 상단 바 안 보이게
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}