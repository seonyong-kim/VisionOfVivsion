import React, { useEffect } from "react";
import * as Speech from "expo-speech";
import { View, Text, StyleSheet, BackHandler } from "react-native";
import { backGround } from "../../styles/BackGround";
import { tutorialCommand } from "../../styles/TutorialCommand";

export default function TutorialOcrCommand({ route, navigation }) {
  const {rate, pitch} = route.params;

  const OcrCommandTTS = async () => {
    Speech.speak("글자 인식 관련 tutorial입니다."
      + "글자 인식 관련 명령어 3개를 소개하겠습니다."
      + "글자 인식, 글자 인식 모드로 전환합니다."
      + "읽기 , 글자 인식을 실행합니다."
      + "중단 , 글자 인식을 중단합니다."
      + "다음으로 글자 인식 결과화면을 보여주면서 설명드리겠습니다.",{
        rate,
        pitch
      }
    );

    const delay = 20500 * (rate < 1 ? (1 + (1 - rate)) : 1 / (1 + (rate - 1)));   
    setTimeout(() => {
      navigation.navigate("TutorialOcrResult",{
        rate: rate,
        pitch: pitch
      });
    }, delay);
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
    <View style={[backGround.main,{ flexDirection: "column",paddingTop: 60,}]}>
      <View style={tutorialCommand.headerContainer}>
        <Text style={tutorialCommand.headerText}>글자 인식</Text>
      </View>
      <View style={tutorialCommand.commandContainer}>
        <Text style={tutorialCommand.commandText}>글자 인식 명령어</Text>
        <Text style={tutorialCommand.commandText}></Text>
        <Text style={tutorialCommand.commandText}>1. 글자 인식</Text>
        <Text style={tutorialCommand.commandText}>: 글자 인식 모드 전환</Text>
        <Text style={tutorialCommand.commandText}>2. 읽기</Text>
        <Text style={tutorialCommand.commandText}>: 글자 인식 실행</Text>
        <Text style={tutorialCommand.commandText}>3. 중단</Text>
        <Text style={tutorialCommand.commandText}>: 글자 읽기 중단</Text>
      </View>
    </View>
  );
}