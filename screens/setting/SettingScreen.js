import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Feather from "@expo/vector-icons/Feather";
import { useNavigation } from "@react-navigation/native";

const SettingScreen = () => {
  const navigation = useNavigation();

  return (
    <View style={{ flex: 1, flexDirection: "column" }}>
      <View style={styles.header}>
        <View style={styles.row}>
          <View style={styles.iconContainer}>
            <Feather name="settings" size={70} color="#FF8C42" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.headerText}>설정</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.replace("Tutorial")}
      >
        <View style={styles.row}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name="help-circle-outline"
              size={60}
              color="#FFFFFF"
            />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.text}>튜토리얼</Text>
          </View>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("SpeechSetting")}
      >
        <View style={styles.row}>
          <View style={styles.iconContainer}>
            <Feather
              name="volume-2"
              size={60}
              color="#FFFFFF"
            />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.text}>음성 설정</Text>
          </View>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("Favorites")}
      >
        <View style={styles.row}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name="star-outline"
              size={60}
              color="#FFFFFF"
            />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.text}>즐겨찾는 장소</Text>
          </View>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          Linking.openURL("https://www.instagram.com/vovproject_dd/");
        }}
      >
        <View style={styles.row}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name="instagram"
              size={60}
              color="#FFFFFF"
            />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.text}>문의 연락처</Text>
          </View>
        </View>
      </TouchableOpacity>

      <View style={styles.button}>
        <Text></Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flex: 1,
    backgroundColor: "#121212",
    paddingHorizontal: 15,
    paddingTop: 30,
    justifyContent: "center",
  },
  headerText: {
    textAlign: "center",
    fontSize: 60,
    color: "#FF8C42",
  },
  button: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#121212",
    //borderBottomWidth: 1 칸간의 경계계
  },
  row: {
    flexDirection: "row", // 아이콘과 텍스트 가로 배치
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    flex: 1, // 전체 4중 1 (25%)
    justifyContent: "center",
    alignItems: "flex-start",
    paddingLeft: 15,
  },
  textContainer: {
    flex: 3, // 전체 4중 3 (75%)
    justifyContent: "center",
  },
  text: {
    fontSize: 45,
    color: "#FFFFFF",
    textAlign: "center",
  },
});

export default SettingScreen;