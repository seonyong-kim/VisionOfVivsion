import React, { useEffect } from "react";
import { View, Text, StyleSheet, BackHandler, TouchableOpacity } from "react-native";
import * as Speech from "expo-speech";

export default function TutorialStart({ navigation }) {
  // TTS 음성 안내 및 자동화면 전환 함수
  const guidStartTTS = async () => {
    // TTS
    Speech.speak(
      "안녕하십니까. Vision of Vision 입니다. Vision of Vision은 명령어를 기반으로 앱을 동작시킬 수 있습니다. 튜토리얼을 시작하겠습니다."
    );

    // 일정 시간이 지나면 자동으로 화면 전환
    setTimeout(() => {
      navigation.navigate("TutorialYoloCommand"); // 전환할 화면 설정
    }, 11000); // 12.05초 후 이동
  };
  
  // 스킵 버튼 생성
  const skip = async () => {
    Speech.stop();
    navigation.replace("Root");
  }
  // 화면이 시작될때 함수가 자동으로 시작되게 하려면
  // useEffect를 사용
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => true
    );

    guidStartTTS();

    return () => backHandler.remove(); // 언마운트 시 이벤트 제거
  }, []);

  return (
    <View style={styles.mainBackGround}>
      <Text style={styles.mainText}>VoV</Text>
      
      <TouchableOpacity
       style={styles.skipButton}
       onPress={() => skip()}
      >
        <Text style={styles.skipText}>튜토리얼 스킵</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  mainBackGround: {
    flex: 1,
    backgroundColor: "#121212",
    alignItems: "center",
    justifyContent: "center",
  },

  mainText: {
    fontSize: 90,
    color: "#FFFFFF",
    textAlign: "center",
  },
  skipButton:{
    backgroundColor: "#4FC3F7",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 6,
  },
  skipText:{
    fontSize: 30,
    color: "#FFFFFF",
    textAlign: "center",
  }
});