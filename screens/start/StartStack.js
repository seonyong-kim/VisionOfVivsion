import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import StartScreen from "./StartScreen";
import StartSpeechSetting from "./StartSpeechSetting";

const Stack = createNativeStackNavigator();

export default function StartStack(){
    return (
        <Stack.Navigator
            initialRouteName="StartScreen"
            screenOptions={{headerShown : false}}
        >

        <Stack.Screen 
            name="StartScreen" 
            component={StartScreen} 
        />

        <Stack.Screen
            name="StartSpeechSetting"
            component={StartSpeechSetting}
        />

        </Stack.Navigator>
    );
}