import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import BottomTabNavigator from "./components/layout/BottomTabNavigator";
import Tutorial from "./screens/tutorial/TutorialStack";
import Start from "./screens/start/StartStack";
import { CheckFirstLaunch } from "./utils/CheckFirstLaunch";
import * as Speech from "expo-speech";

const Stack = createNativeStackNavigator();

export default function App() {
  const [isFirstLaunch, setIsFirstLaunch] = useState(null);

  useEffect(() =>{
    const check = async () => {
      const {isFirst, error} = await CheckFirstLaunch();
      console.log("첫 실행 여부: ", isFirst, isFirstLaunch);
      if(error){
        console.log(error);
        Speech.speak('문제가 발생했습니다.');
      }
      setIsFirstLaunch(isFirst);
    };

    check();
  }, [])

  if (isFirstLaunch === null) {
    return true; 
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName={isFirstLaunch? 'Start': 'Root'}
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

        <Stack.Screen
          name="Start"
          component={Start}
          options={{ headerShown: false }} // 상단 바 안 보이게
        />

      </Stack.Navigator>
    </NavigationContainer>
  );
}