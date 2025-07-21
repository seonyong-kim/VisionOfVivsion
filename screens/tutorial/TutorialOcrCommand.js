import React, { useEffect } from "react";
import * as Speech from "expo-speech";
import { View, Text, StyleSheet, BackHandler } from "react-native";

export default function TutorialOcrCommand({ navigation }) {
  const OcrCommandTTS = async () => {
    Speech.speak("글자 인식 관련 tutorial입니다. ");
    Speech.speak("글자 인식 관련 명령어 3개를 소개하겠습니다.");
    Speech.speak("글자 인식, 글자 인식 모드로 전환합니다.");
    Speech.speak("읽기 , 글자 인식을 실행합니다.");
    Speech.speak("중단 , 글자 인식을 중단합니다.");
    Speech.speak("다음으로 글자 인식 결과화면을 보여주면서 설명드리겠습니다.");

    setTimeout(() => {
      navigation.navigate("TutorialOcrResult");
    }, 20500);
  };

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => true
    );

    OcrCommandTTS();

    return () => backHandler.remove(); // 언마운트 시 이벤트 제거
  }, []);

  return (
    <View style={styles.mainBackGround}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>글자 인식</Text>
      </View>
      <View style={styles.commandContainer}>
        <Text style={styles.commandText}>글자 인식 명령어</Text>
        <Text style={styles.commandText}></Text>
        <Text style={styles.commandText}>1. 글자 인식</Text>
        <Text style={styles.commandText}>: 글자 인식 모드 전환</Text>
        <Text style={styles.commandText}>2. 읽기</Text>
        <Text style={styles.commandText}>: 글자 인식 실행</Text>
        <Text style={styles.commandText}>3. 중단</Text>
        <Text style={styles.commandText}>: 글자 읽기 중단</Text>
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