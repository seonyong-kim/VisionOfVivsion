import React, { useEffect } from "react";
import * as Speech from "expo-speech";
import { Image, View, StyleSheet, BackHandler } from "react-native";

export default function TutorialYoloResult({ navigation }) {
  const TutorialYoloResultTTS = async () => {
    Speech.speak("책 탐지");
    // 몇초 쉬자
    Speech.speak("이와 같이 객체 인식에 성공하면 탐지된 물건을 안내해줍니다.");

    setTimeout(() => {
      navigation.navigate("TutorialYoloDanger"); // 전환할 화면 설정
    }, 7000);
  };

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => true
    );

    TutorialYoloResultTTS();

    return () => backHandler.remove(); // 언마운트 시 이벤트 제거
  }, []);

  return (
    <View style={styles.mainBackGround}>
      {/* 이미지 바꾸고 싶으면 이미지 경로 이부분만*/}
      <Image
        source={require("../../images/YoloResult.png")}
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