import React, { useEffect } from "react";
import * as Speech from "expo-speech";
import { Image, View, StyleSheet, Vibration, BackHandler } from "react-native";

export default function TutorialYoloDanger({ navigation }) {
  const TutorialYoloDangerTTS = async () => {
    Speech.speak("위험 전방에 턱이 있습니다.");
    Vibration.vibrate([100, 500, 100, 500, 100, 500]);

    Speech.speak(
      "이처럼 보행 중 위험 물체가 인식이 되면 진동과 함께 경고를 해줍니다."
    );
    setTimeout(() => {
      navigation.navigate("TutorialOcrCommand"); // 전환할 화면 설정
    }, 8500);
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
    <View style={styles.mainBackGround}>
      <Image
        source={require("../../images/YoloDanger.png")}
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