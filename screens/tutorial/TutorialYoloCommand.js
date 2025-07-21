import React, { useEffect } from "react";
import * as Speech from "expo-speech";
import { View, Text, StyleSheet, BackHandler } from "react-native";

export default function TutorialYoloCommand({ navigation }) {
  const YoloCommandTTS = async () => {
    Speech.speak(
      "객체 인식 관련 tutorial입니다. 앱 실행시 기본으로 실행됩니다."
    );
    Speech.speak("객체 인식 관련 명령어 1개를 소개하겠습니다.");
    Speech.speak("객체 인식, 객체 인식 모드로 전환합니다.");
    Speech.speak("다음으로 객체 인식 결과화면을 보여주면서 설명드리겠습니다.");
    setTimeout(() => {
      navigation.navigate("TutorialYoloResult"); // 전환할 화면 설정
    }, 17000); // 16초 후 이동
  };

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => true
    );

    YoloCommandTTS();

    return () => backHandler.remove(); // 언마운트 시 이벤트 제거
  }, []);

  return (
    <View style={styles.mainBackGround}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>객체 인식</Text>
      </View>
      <View style={styles.commandContainer}>
        <Text style={styles.commandText}>객체 인식 명령어</Text>
        <Text style={styles.commandText}></Text>
        <Text style={styles.commandText}>1. 객체 인식</Text>
        <Text style={styles.commandText}>: 객체 인식 모드 전환</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainBackGround: {
    flex: 1,
    backgroundColor: "#121212",
    flexDirection: "column",
    paddingTop: 60,
  },
  headerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  commandContainer: {
    flex: 4,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 200,
  },
  headerText: {
    fontSize: 75,
    color: "#FFFFFF",
    textAlign: "center",
  },
  commandText: {
    fontSize: 40,
    color: "#FFFFFF",
    textAlign: "center",
  },
});