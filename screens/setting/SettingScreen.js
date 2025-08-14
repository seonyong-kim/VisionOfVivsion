import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Linking, PushNotificationIOS } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Feather from "@expo/vector-icons/Feather";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import { backGround } from "../../styles/BackGround";
import { button } from "../../styles/Button";
import { text } from "../../styles/Text";
import * as Speech from "expo-speech";
import { useAutoSTT } from "../../src/services/useAutoSTT";

const SettingScreen = ({route}) => {
  //const {rate, pitch} = route.params;
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const [sttOn, setSttOn] = useState(true);

    useAutoSTT({
    endpoint: "http://3.37.7.103:5012/stt",
    segmentMs: 5000,
    enabled: isFocused,
    onResult: ({ text }) => {
      if (!text) return;
      const cmd = text.trim();
      console.log("🎤 인식:", cmd);

      // STT를 잠깐 끄고 
      setSttOn(false);
      Speech.stop();

      // 화면 전환
      if (cmd.includes("객체 인식")) {
        Speech.speak("객체 인식");
        navigation.navigate("Home");
      } else if (cmd.includes("길")) {
        Speech.speak("길 찾기");
        navigation.navigate("Navigation");
      } else if (cmd.includes("글자")) {
        Speech.speak("글자 인식");
        navigation.navigate("OCR");
      } else if(cmd.includes("즐겨")){
        Speech.speak("즐겨 찾기");
        navigation.navigate("Favorites");
      } else if(cmd.includes("튜토")){
        Speech.speak("튜토리얼");
        navigation.navigate("Tutorial");
      } else if(cmd.includes("음성")){
        Speech.speak("음성 설정");
        navigation.navigate("SettingSpeech");
      } else{
        Speech.speak("존재하지 않는 명령어 입니다.");
        setSttOn(true);
        return;
      }
    }
  });

  // 설정화면이라고 안내하는 TTS
  useEffect(() => {
    const StartTTS = navigation.addListener("focus", () => {
      Speech.speak("설정");
    });

    return StartTTS;
  }, [navigation]);

  return (
    <View style={{ flex: 1, flexDirection: "column" }}>
      <View style={[backGround.main, { paddingHorizontal: 15, paddingTop: 30, justifyContent: "center"}]}>
        <View style={styles.row}>
          <View style={styles.iconContainer}>
            <Feather name="settings" size={70} color="#FF8C42" />
          </View>
          <View style={styles.textContainer}>
            <Text style={text.header}>설정</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[button.blackButton,{justifyContent: "center"}]}
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
        style={[button.blackButton,{justifyContent: "center"}]}
        onPress={() => navigation.navigate("SettingSpeech")}
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
        style={[button.blackButton,{justifyContent: "center"}]}
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
        style={[button.blackButton,{justifyContent: "center"}]}
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

    </View>
  );
};

const styles = StyleSheet.create({
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