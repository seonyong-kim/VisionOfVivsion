import React, { useEffect, useState } from "react";
import SpeechSetting from "../../utils/SpeechSetting"
import * as Speech from "expo-speech";
import { TouchableOpacity, StyleSheet, View } from "react-native";

export default function SettingSpeech({navigation}){
  const [rate, setRate] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);
  const speechSettingSpeak = () => {
    Speech.speak("음성설정");
  }

  const nextButton = (changeRate, changePitch) =>{
    Speech.speak("저장",{
      rate: changeRate,
      pitch: changePitch
    })

    setTimeout(() => {
      navigation.replace("SettingMain",{
        rate: changeRate,
        pitch: changePitch
      }); // 전환할 화면 설정
    }); 
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