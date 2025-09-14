import React, { useEffect } from "react";
import * as Speech from "expo-speech";
import { View, Text, StyleSheet, BackHandler } from "react-native";
import { backGround } from "../../styles/BackGround";
import { tutorialCommand } from "../../styles/TutorialCommand";

export default function TutorialYoloCommand({ route, navigation }) {
  const { rate, pitch } = route.params;

  const YoloCommandTTS = async () => {
    Speech.speak(
      "객체 인식 관련 tutorial입니다. 앱 실행시 기본으로 실행됩니다." +
        "객체 인식 관련 명령어 1개를 소개하겠습니다." +
        "객체 인식, 객체 인식 모드로 전환합니다." +
        "다음으로 객체 인식 결과화면을 보여주면서 설명드리겠습니다.",
      {
        rate,
        pitch,
      }
    );

    console.log("튜토리얼 2번째 화면 ", rate, pitch);
    const delay = 17000 * (rate < 1 ? 1 + (1 - rate) : 1 / (1 + (rate - 1)));
    setTimeout(() => {
      navigation.navigate("TutorialYoloResult", {
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

    YoloCommandTTS();

    return () => backHandler.remove();
  }, []);

  return (
    <View
      style={[backGround.main, { flexDirection: "column", paddingTop: 60 }]}
    >
      <View style={tutorialCommand.headerContainer}>
        <Text style={tutorialCommand.headerText}>객체 인식</Text>
      </View>
      <View style={tutorialCommand.commandContainer}>
        <Text style={tutorialCommand.commandText}>객체 인식 명령어</Text>
        <Text style={tutorialCommand.commandText}></Text>
        <Text style={tutorialCommand.commandText}>1. 객체 인식</Text>
        <Text style={tutorialCommand.commandText}>: 객체 인식 모드 전환</Text>
      </View>
    </View>
  );
}
