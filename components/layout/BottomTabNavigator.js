import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import HomeScreen from "../../screens/HomeScreen";
import OCRScreen from "../../screens/OCRScreen";
import NavigationScreen from "../../screens/NavigationScreen";
import SettingScreen from "../../screens/SettingScreen";

const Tab = createBottomTabNavigator();

const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: "#4CAF50", // 활성화일때 색상을 의미
        tabBarInactiveTintColor: "#9E9E9E", // 비활성화일때 색상 의미
      }}
    >
      <Tab.Screen
        name="Home" //tab내부 이름
        component={HomeScreen} //실제 보여질 컴포넌트로 HomeScreen.js가 보여진다.
        options={{
          tabBarLabel: "Home", //text로 화면에 보여질거
          tabBarIcon: (
            { color } //color는 위 screenOptions에서 자동으로 가져옴
          ) => <MaterialCommunityIcons name="home" size={30} color={color} />, // 아이콘 설정 및 색싱, 크기
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
        component={SettingScreen}
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