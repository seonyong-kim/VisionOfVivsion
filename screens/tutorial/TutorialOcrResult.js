import React, { useEffect } from "react";
import * as Speech from "expo-speech";
import { Image, View, StyleSheet, BackHandler } from "react-native";
import { backGround } from "../../styles/BackGround";
import { image } from "../../styles/Image";

export default function TutorialOcrResult({ route, navigation }) {
  const { rate, pitch } = route.params;

  const TutorialOcrResultTTS = async () => {
    Speech.speak(
      "읽기" +
        "사용자가 명령어를 언급하면 시작됩니다." +
        "글자 인식을 시작합니다. 잠시만 기다려 주시기 바랍니다." +
        "안녕하세요 V o V 입니다." +
        "이와 같이 글자 인식에 성공하면 글자를 읽어줍니다.",
      {
        rate,
        pitch,
      }
    );

    const delay = 14000 * (rate < 1 ? 1 + (1 - rate) : 1 / (1 + (rate - 1)));
    setTimeout(() => {
      navigation.navigate("TutorialNavigationCommand", {
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

    TutorialOcrResultTTS();

    return () => backHandler.remove();
  }, []);

  return (
    <View style={backGround.main}>
      <Image
        source={require("../../images/OcrResult.jpg")}
        style={image.full}
      />
    </View>
  );
}
