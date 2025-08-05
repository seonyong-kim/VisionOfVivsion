import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import NavigationScreen from "./NavigationScreen";
import RouteScreen from "../navigation/RouteScreen"
import GuideScreen from "../navigation/GuideScreen"

const Stack = createNativeStackNavigator();

export default function App() {
  return (
      <Stack.Navigator 
        initialRouteName="NavigationScreen"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen 
            name="NavigationScreen" 
            component={NavigationScreen} 
        />
        {/* 필요 시 스택 네비게이터로 별도 화면 띄우기 */}
        <Stack.Screen 
            name="Route" 
            component={RouteScreen} 
        />
        <Stack.Screen 
            name="Guide" 
            component={GuideScreen} 
        />
      </Stack.Navigator>
  );
}