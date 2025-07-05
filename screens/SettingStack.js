import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import SettingScreen from "./SettingScreen";
import Tutorial from "./Tutorial";
import Favorites from "./Favorites";

const Stack = createNativeStackNavigator();

export default function SettingStack(){
    return (
        <Stack.Navigator 
            initialRoutName="SettingMain"
            screenOptions={{ headerShown: false }}
        >
            <Stack.Screen
                name="SettingMain"
                component={SettingScreen}
            />
            <Stack.Screen
                name="Tutorial"
                component={Tutorial}
                options={{ title: "명령어 안내" }}
            />
            <Stack.Screen
                name="Favorites"
                component={Favorites}
                options={{ title: "즐겨찾는 장소" }}
            />
        </Stack.Navigator>
    )
}





