import React, { useEffect } from "react";
import * as Speech from "expo-speech";
import { Image, View, StyleSheet, BackHandler } from "react-native";
import { backGround } from "../../styles/BackGround";
import { image } from "../../styles/Image";

export default function TutorialNavigationDestinationResult({ route, navigation }) {
  const {rate, pitch} = route.params;
  
  const TutorialNavigationDestinationResultTTS = async () => {
    Speech.speak("길 찾기"
      + "사용자가 명령어를 말하면 다음과 같이 모드 전환이 일어납니다."
      + "목적지를 입력해 주시기 바랍니다."
      + "이 안내 후 사용자의 목적지를 말씀해주시면 됩니다."
      + "출발지는 현재 위치입니다."
      + "신림역"
      + "사용자가 목적지를 말하면",{
        rate,
        pitch
      }
    );

    const delay = 17000 * (rate < 1 ? (1 + (1 - rate)) : 1 / (1 + (rate - 1)));   

    setTimeout(() => {
      navigation.navigate("TutorialNavigationMapResult",{
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

    TutorialNavigationDestinationResultTTS();

    return () => backHandler.remove(); // 언마운트 시 이벤트 제거
  }, []);

  return (
    <View style={backGround.main}>
      <Image
        source={require("../../images/NavigationDestination.jpg")}
        style={image.full}
      />
    </View>
  );
}