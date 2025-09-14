import React, { useEffect } from "react";
import { View, Text, StyleSheet, BackHandler } from "react-native";
import * as Speech from "expo-speech";
import { backGround } from "../../styles/BackGround";

export default function TutorialFinish({ route, navigation }) {
  const { rate, pitch } = route.params;

  const guidFinishTTS = async () => {
    Speech.speak(
      "튜토리얼이 끝났습니다." +
        "다시듣고 싶으면 설정에서 튜토리얼을 말씀하시면 됩니다." +
        "메인인 객체 인식을 시작합니다.",
      {
        rate,
        pitch,
      }
    );

    const delay = 9500 * (rate < 1 ? 1 + (1 - rate) : 1 / (1 + (rate - 1)));
    setTimeout(() => {
      navigation.replace("Root", {
        rate: rate,
        pitch: pitch,
      });
    }, delay);
  };

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => true
    );

    guidFinishTTS();

    return () => backHandler.remove();
  }, []);

  return (
    <View
      style={[
        backGround.main,
        { alignItems: "center", justifyContent: "center" },
      ]}
    >
      <Text style={styles.mainText}>튜토리얼 완료</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  mainText: {
    fontSize: 60,
    color: "#FFFFFF",
    textAlign: "center",
  },
});
