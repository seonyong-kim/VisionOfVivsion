import React, { useEffect } from "react";
import * as Speech from "expo-speech";
import { View, Text, StyleSheet, BackHandler } from "react-native";

export default function TutorialNavigationCommand({ navigation }) {
  const NavigationCommandTTS = async () => {
    Speech.speak("길 찾기 관련 tutorial입니다. ");
    Speech.speak("길 찾기 관련 명령어 2개를 소개하겠습니다.");
    Speech.speak("길 찾기, 길 찾기 모드로 전환합니다.");
    Speech.speak("중단, 길 찾기를 중단합니다.");
    Speech.speak("다음으로 길 찾기 결과화면을 보여주면서 설명드리겠습니다.");

    setTimeout(() => {
      navigation.navigate("TutorialNavigationDestinationResult");
    }, 16500);
  };

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => true
    );

    NavigationCommandTTS();

    return () => backHandler.remove(); // 언마운트 시 이벤트 제거
  }, []);

  return (
    <View style={styles.mainBackGround}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>길 찾기</Text>
      </View>
      <View style={styles.commandContainer}>
        <Text style={styles.commandText}>길 찾기 명령어</Text>
        <Text style={styles.commandText}></Text>
        <Text style={styles.commandText}>1. 길 찾기</Text>
        <Text style={styles.commandText}>: 길 찾기 모드 전환</Text>
        <Text style={styles.commandText}>2. 중단</Text>
        <Text style={styles.commandText}>: 길 찾기 중단</Text>
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