import React, { useEffect } from "react";
import * as Speech from "expo-speech";
import { Image, View, StyleSheet, Vibration, BackHandler } from "react-native";
import { backGround } from "../../styles/BackGround";
import { image } from "../../styles/Image";

export default function TutorialYoloDanger({ route, navigation }) {
  const {rate, pitch} = route.params;

  const TutorialYoloDangerTTS = async () => {
    Speech.speak("위험 전방에 턱이 있습니다.",{
      rate,
      pitch
    });
    Vibration.vibrate([100, 500, 100, 500]);

    Speech.speak(
      "이처럼 보행 중 위험 물체가 인식이 되면 진동과 함께 경고를 해줍니다.",{
        rate,
        pitch
      });
    
    const delay = 8500 * (rate < 1 ? (1 + (1 - rate)) : 1 / (1 + (rate - 1)));   
    setTimeout(() => {
      navigation.navigate("TutorialOcrCommand",{
        rate: rate,
        pitch: pitch
      }); // 전환할 화면 설정
    }, delay);
  };

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => true
    );

    TutorialYoloDangerTTS();

    return () => backHandler.remove(); // 언마운트 시 이벤트 제거
  }, []);

  return (
    <View style={backGround.main}>
      <Image
        source={require("../../images/YoloDanger.png")}
        style={image.full}
      />
    </View>
  );
}