import React, { useEffect, useState } from "react";
import * as Speech from "expo-speech";
import { backGround } from "../../styles/BackGround";
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {authenticateDevice} from "../../utils/auth/AuthenticateDevice";
import { useIsFocused } from '@react-navigation/native';
import { useAutoSTT } from "../../src/services/useAutoSTT";

export default function StartScreen ({navigation}){
  const [sttOn, setSttOn] = useState(true);
  const isFocused = useIsFocused();

    const startSpeech = () => {
        Speech.speak("안녕하십니까.");
        Speech.speak("시각장애인을 위한 앱 V o V입니다.")
        Speech.speak("앱을 시작하실려면 하단의 시작 버튼을 누르거나 또는 음성으로 시작! 이라고 말씀해 주세요.")
    }

      useAutoSTT({
      endpoint: "http://3.37.7.103:5012/stt",
      segmentMs: 5000,
      enabled: isFocused,
      onResult: ({ text }) => {
        if (!text) return;
        const cmd = text.trim();
        console.log("인식:", cmd);
    
        // STT를 잠깐 끄고 
        setSttOn(false);
        Speech.stop();
    
        if (cmd.includes("시작")) {
          nextButton();
        }
      }
    });

    const nextButton = async() => {
        try{
          // 처음에 authenticateDevice를 통해 DeviceId을 받기 + DB에 저장
          const deviceId = await authenticateDevice();
          Speech.speak("음성 설정으로 넘어갑니다.");
          navigation.navigate("StartSpeechSetting");
        }catch(err){
          console.log(err);
          Speech.speak("오류가 발생했습니다. 네트워크를 확인해 주시기 바랍니다.");
        }
    };
    
    useEffect(() => {
        startSpeech();
    }, []);

  return (
    <View style={[backGround.main, { alignItems: "center", justifyContent: "center"}]}>
      <Text style={styles.mainText}>Vision Of Vision</Text>
      
      <TouchableOpacity
       style={styles.nextButton}
       onPress={nextButton}
      >
        <Text style={styles.skipText}>시작</Text>
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