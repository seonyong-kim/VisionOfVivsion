import React, { useEffect } from "react";
import * as Speech from "expo-speech";
import { Image, View, StyleSheet, BackHandler } from "react-native";

export default function TutorialNavigationDestinationResult({ navigation }) {
  const TutorialNavigationDestinationResultTTS = async () => {
    Speech.speak("길 찾기");
    Speech.speak(
      "사용자가 명령어를 말하면 다음과 같이 모드 전환이 일어납니다."
    );
    Speech.speak("목적지를 입력해 주시기 바랍니다.");
    Speech.speak("이 안내 후 사용자의 목적지를 말씀해주시면 됩니다.");
    Speech.speak("출발지는 현재 위치입니다.");
    Speech.speak("신림역");
    Speech.speak("사용자가 목적지를 말하면");

    setTimeout(() => {
      navigation.navigate("TutorialNavigationMapResult"); // 전환할 화면 설정
    }, 17000);
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
    <View style={styles.mainBackGround}>
      <Image
        source={require("../../images/NavigationDestination.jpg")}
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