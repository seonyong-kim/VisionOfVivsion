import React, { useEffect } from "react";
import * as Speech from "expo-speech";
import { Image, View, StyleSheet, BackHandler } from "react-native";
import { backGround } from "../../styles/BackGround";
import { image } from "../../styles/Image";

export default function TutorialYoloResult({ route, navigation }) {
  const { rate, pitch } = route.params;

  const TutorialYoloResultTTS = async () => {
    Speech.speak(
      "책 탐지" + "이와 같이 객체 인식에 성공하면 탐지된 물건을 안내해줍니다.",
      {
        rate,
        pitch,
      }
    );

    const delay = 7000 * (rate < 1 ? 1 + (1 - rate) : 1 / (1 + (rate - 1)));
    setTimeout(() => {
      navigation.navigate("TutorialYoloDanger", {
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

    TutorialYoloResultTTS();

    return () => backHandler.remove();
  }, []);

  return (
    <View style={backGround.main}>
      <Image
        source={require("../../images/YoloResult.png")}
        style={image.full}
      />
    </View>
  );
}
