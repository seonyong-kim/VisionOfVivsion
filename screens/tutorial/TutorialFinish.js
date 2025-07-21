import React, { useEffect } from "react";
import { View, Text, StyleSheet, BackHandler } from "react-native";
import * as Speech from "expo-speech";

export default function TutorialFinish({ navigation }) {
  const guidFinishTTS = async () => {
    Speech.speak("튜토리얼이 끝났습니다.");
    Speech.speak("다시듣고 싶으면 설정에서 튜토리얼을 말씀하시면 됩니다.");
    Speech.speak("메인인 객체 인식을 시작합니다.");

    setTimeout(() => {
      navigation.replace("Root");
    }, 9500);
  };

  // 화면이 시작될때 함수가 자동으로 시작되게 하려면
  // useEffect를 사용
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => true
    );

    guidFinishTTS();

    return () => backHandler.remove(); // 언마운트 시 이벤트 제거
  }, []);

  return (
    <View style={styles.mainBackGround}>
      <Text style={styles.mainText}>튜토리얼 완료</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  mainBackGround: {
    flex: 1,
    backgroundColor: "#121212",
    alignItems: "center",
    justifyContent: "center",
  },

  mainText: {
    fontSize: 60,
    color: "#FFFFFF",
    textAlign: "center",
  },
});