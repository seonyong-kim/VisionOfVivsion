import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import HomeScreen from "../../screens/HomeScreen";
import OCRScreen from "../../screens/OCRScreen";
import NavigationScreen from "../../screens/navigation/NavigationStack";
import Setting from "../../screens/setting/SettingStack";

const Tab = createBottomTabNavigator();

const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#FF8C42",
        tabBarInactiveTintColor: "#FFFFFF",
        tabBarStyle: {
          backgroundColor: "#121212",
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="home" size={30} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="OCR"
        component={OCRScreen}
        options={{
          tabBarLabel: "OCR",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="format-text-variant"
              size={30}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Navigation"
        component={NavigationScreen}
        options={{
          tabBarLabel: "길찾기",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="map-search" size={30} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Setting"
        component={Setting}
        options={{
          tabBarLabel: "설정",
          tabBarIcon: ({ color }) => (
            <Ionicons name="settings-outline" size={30} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;
