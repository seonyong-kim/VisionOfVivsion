import React, { use, useEffect, useState } from "react";
import { View, Text, StyleSheet, BackHandler, TouchableOpacity } from "react-native";
import * as Speech from "expo-speech";
import {backGround} from "../../styles/BackGround"
import { LoadSpeechInfo } from "../../utils/speech/LoadSpeechInfo";

export default function TutorialStart({ navigation }) {
    const [rate, setRate] = useState(1.0);
    const [pitch, setPitch] = useState(1.0);
    const [loaded, setLoaded] = useState(false);
  
    // TTS 음성 안내 및 자동화면 전환 함수
  const guidStartTTS = async () => {
    // TTS
    Speech.speak(
      "안녕하십니까. Vision of Vision 입니다." 
      + "Vision of Vision은 명령어를 기반으로 앱을 동작시킬 수 있습니다." 
      + "튜토리얼을 시작하겠습니다.",{
        rate,
        pitch,
      }
    );

    // 음성 속도에 따른 화면 전환 속도 지정
    const delay = 11000 * (rate < 1 ? (1 + (1 - rate)) : 1 / (1 + (rate - 1)));

    // 일정 시간이 지나면 자동으로 화면 전환 및 음성 정보 넘기기
    setTimeout(() => {
      navigation.navigate("TutorialYoloCommand",{
        rate: rate,
        pitch: pitch
      }); 
    }, delay);
  };
  
  // 스킵 버튼 생성 누르면 객체 인식 화면으로 이동
  const skip = async () => {
    Speech.stop();
    navigation.replace("Root");
  }

  // 화면이 시작될때 함수가 자동으로 시작되게 하려면 useEffect를 사용
  // 이 useEffect가 먼저 실행
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => true
    );

    // 이 useState를 먼저 실행 완료하기 위해서
    const loadTTSInfo = async () => {
      await LoadSpeechInfo(setRate, setPitch);
      setLoaded(true); 
    }

    loadTTSInfo();

    return () => backHandler.remove(); // 언마운트 시 이벤트 제거
  }, []);

  // [loaded]를 통해 loaded값 변경이 있으면 이 함수가 실행 
  // 즉, 위의 useEffect를 한 후에 이 함수를 시작한다.
  useEffect(() =>{
    if(loaded){
    guidStartTTS();
    }
  }, [loaded]);

  return (
    <View style={[backGround.main, { alignItems: "center", justifyContent: "center"}]}>
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