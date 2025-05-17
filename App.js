import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import BottomTabNavigator from "./components/layout/BottomTabNavigator";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Root"
      >
        <Stack.Screen
          name="Root"
          component={BottomTabNavigator}
          options={{ headerShown: false }} // 상단 바 안 보이게
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
