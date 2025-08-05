import React, { useEffect } from "react";
import * as Speech from "expo-speech";
import { Image, View, StyleSheet, BackHandler } from "react-native";
import { backGround } from "../../styles/BackGround";
import { image } from "../../styles/Image";

export default function TutorialSetting({ route, navigation }) {
  const {rate, pitch} = route.params;

  const TutorialSettingTTS = async () => {
    Speech.speak("설정 화면입니다."
      + "설정 이라는 명령어로 전환이 가능하며"
      + "설정에는"
      + "음성 속도를 조절하는 음성 설정"
      + "지금까지의 Tutorial을 반복하는 튜토리얼"
      + "즐겨찾기 장소 확인이 가능한 즐겨찾기"
      + "문의 연락처로 구성되어 있습니다.",{
        rate,
        pitch
      }
    );

    const delay = 18500 * (rate < 1 ? (1 + (1 - rate)) : 1 / (1 + (rate - 1)));   
    setTimeout(() => {
      navigation.navigate("TutorialFinish",{
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

    TutorialSettingTTS();

    return () => backHandler.remove(); // 언마운트 시 이벤트 제거
  }, []);

  return (
    <View style={backGround.main}>
      <Image
        source={require("../../images/Setting.jpg")}
        style={image.full}
      />
    </View>
  );
}