import React, { useEffect } from "react";
import * as Speech from "expo-speech";
import { Image, View, StyleSheet, BackHandler } from "react-native";

export default function TutorialSetting({ navigation }) {
  const TutorialSettingTTS = async () => {
    Speech.speak("설정 화면입니다.");
    Speech.speak("설정 이라는 명령어로 전환이 가능하며");
    Speech.speak("설정에는");
    Speech.speak("음성 속도를 조절하는 음성 설정");
    Speech.speak("지금까지의 Tutorial을 반복하는 튜토리얼");
    Speech.speak("즐겨찾기 장소 확인이 가능한 즐겨찾기");
    Speech.speak("문의 연락처로 구성되어 있습니다.");

    setTimeout(() => {
      navigation.navigate("TutorialFinish"); // 전환할 화면 설정
    }, 18500);
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
    <View style={styles.mainBackGround}>
      <Image
        source={require("../../images/Setting.jpg")}
        style={styles.fullImage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  mainBackGround: {
    flex: 1,
    backgroundColor: "#121212",
  },
  fullImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
});