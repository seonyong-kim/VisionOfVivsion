import React, { useEffect } from "react";
import * as Speech from "expo-speech";
import { Image, View, StyleSheet, BackHandler } from "react-native";
import { backGround } from "../../styles/BackGround";
import { image } from "../../styles/Image";

export default function TutorialNavigationMapResult({ route, navigation }) {
  const {rate, pitch} = route.params;

  const TutorialNavigationDestinationMapTTS = async () => {
    Speech.speak("지도가 뜨면서 음성으로 안내해줍니다."
      + "현재 위치에서 목적지까지 거리는 2533미터 예상 소요시간은 34분 입니다."
      + "안내를 시작하겠습니다."
      + "이후 객체 인식모드로 전환하면서 경로 안내를 같이 진행합니다."
      + "길 찾기의 경우 예상 시간이 도보로 35분 이하인 경우만 지원을 하고 있습니다.",{
        rate,
        pitch
      }
    );

    const delay = 22500 * (rate < 1 ? (1 + (1 - rate)) : 1 / (1 + (rate - 1)));   

    setTimeout(() => {
      navigation.navigate("TutorialSetting",{
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

    TutorialNavigationDestinationMapTTS();

    return () => backHandler.remove(); // 언마운트 시 이벤트 제거
  }, []);

  return (
    <View style={backGround.main}>
      <Image
        source={require("../../images/NavigationMap.jpg")}
        style={image.full}
      />
    </View>
  );
}