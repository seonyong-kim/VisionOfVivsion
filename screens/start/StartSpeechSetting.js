import React, { useEffect, useState } from "react";
import SpeechSetting from "../../utils/SpeechSetting"
import * as Speech from "expo-speech";
import { TouchableOpacity, StyleSheet, View } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function StartSpeechSetting({navigation}){
    const [rate, setRate] = useState(1.0);
    const [pitch, setPitch] = useState(1.0);

  const speechSettingSpeak = () => {
    Speech.speak("음성설정 화면입니다.");
    Speech.speak("속도와 높낮이 조절이 가능합니다.");
    Speech.speak("속도 설정은 속도! 업! 다운! 으로 설정 가능하고");
    Speech.speak("높낮이 역시 설정은 높낮이! 업! 다운! 으로 설정가능합니다.");
  }

  const nextButton = (changeRate, changePitch) =>{
    const delay = 8000 * (changeRate < 1 ? (1 + (1 - changeRate)) : 1 / (1 + (changeRate - 1)));
    Speech.speak("설정을 저장했습니다."
       + "이후에 설정화면에서 음성 설정이 가능합니다."
       + "튜토리얼로 넘어갑니다.",{
        rate: changeRate,
        pitch: changePitch
       });
    setTimeout(() => {
      navigation.replace("Tutorial"); // 전환할 화면 설정
    }, delay); 
  }

  const handleRateChange = (newRate) =>{
    setRate(newRate);
  }

  const handlePitchChange = (newPitch) =>{
    setPitch(newPitch);
  }

  useEffect(() => {
    speechSettingSpeak();
  }, []);

  return (
  <SpeechSetting onSaveComplete={nextButton}  rateChange={handleRateChange} pitchChange={handlePitchChange}/>
  );
}

const styles = StyleSheet.create({
  mainText: {
    fontSize: 90,
    color: "#FFFFFF",
    textAlign: "center",
  },
  nextButton:{
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