import React, { useEffect } from "react";
import * as Speech from "expo-speech";
import { View, Text, StyleSheet, BackHandler } from "react-native";
import { backGround } from "../../styles/BackGround";
import { tutorialCommand } from "../../styles/TutorialCommand";

export default function TutorialNavigationCommand({ route, navigation }) {
  const { rate, pitch } = route.params;

  const NavigationCommandTTS = async () => {
    Speech.speak(
      "길 찾기 관련 tutorial입니다." +
        "길 찾기 관련 명령어 2개를 소개하겠습니다." +
        "길 찾기, 길 찾기 모드로 전환합니다." +
        "중단, 길 찾기를 중단합니다." +
        "다음으로 길 찾기 결과화면을 보여주면서 설명드리겠습니다.",
      {
        rate,
        pitch,
      }
    );

    const delay = 16500 * (rate < 1 ? 1 + (1 - rate) : 1 / (1 + (rate - 1)));

    setTimeout(() => {
      navigation.navigate("TutorialNavigationDestinationResult", {
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

    NavigationCommandTTS();

    return () => backHandler.remove();
  }, []);

  return (
    <View
      style={[backGround.main, { flexDirection: "column", paddingTop: 60 }]}
    >
      <View style={tutorialCommand.headerContainer}>
        <Text style={tutorialCommand.headerText}>길 찾기</Text>
      </View>
      <View style={tutorialCommand.commandContainer}>
        <Text style={tutorialCommand.commandText}>길 찾기 명령어</Text>
        <Text style={tutorialCommand.commandText}></Text>
        <Text style={tutorialCommand.commandText}>1. 길 찾기</Text>
        <Text style={tutorialCommand.commandText}>: 길 찾기 모드 전환</Text>
        <Text style={tutorialCommand.commandText}>2. 중단</Text>
        <Text style={tutorialCommand.commandText}>: 길 찾기 중단</Text>
      </View>
    </View>
  );
}
