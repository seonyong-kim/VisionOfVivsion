import React, { useEffect } from "react";
import * as Speech from "expo-speech";
import { Image, View, StyleSheet, BackHandler } from "react-native";

export default function TutorialOcrResult({ navigation }) {
  const TutorialOcrResultTTS = async () => {
    Speech.speak("읽기");
    Speech.speak("사용자가 명령어를 언급하면 시작됩니다. ");
    Speech.speak("글자 인식을 시작합니다. 잠시만 기다려 주시기 바랍니다.");
    Speech.speak("안녕하세요 V o V 입니다.");
    // 몇초 쉬자
    Speech.speak("이와 같이 글자 인식에 성공하면 글자를 읽어줍니다.");

    setTimeout(() => {
      navigation.navigate("TutorialNavigationCommand"); // 전환할 화면 설정
    }, 14000);
  };

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => true
    );

    TutorialOcrResultTTS();

    return () => backHandler.remove(); // 언마운트 시 이벤트 제거
  }, []);

  return (
    <View style={styles.mainBackGround}>
      {/* 이미지 바꾸고 싶으면 이미지 경로 이부분만*/}
      <Image
        source={require("../../images/OcrResult.jpg")}
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