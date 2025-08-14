import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Button, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import { text } from "../styles/Text";
import { useIsFocused } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import { LoadSpeechInfo } from "./speech/LoadSpeechInfo";
import { useAutoSTT } from "../src/services/useAutoSTT";

const SpeechSetting = ({onSaveComplete, rateChange, pitchChange}) => {
  const [rate, setRate] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);
  const [sttOn, setSttOn] = useState(true);
  const isFocused = useIsFocused();

   useAutoSTT({
      endpoint: "http://3.37.7.103:5012/stt",
      segmentMs: 5000,
      enabled: isFocused,
      onResult: ({ text }) => {
        if (!text) return;
        const cmd = text.trim();
        console.log("🎤 인식:", cmd);
  
        // STT를 잠깐 끄고 
        setSttOn(false);
        Speech.stop();
  
        // 화면 전환
        if (cmd.includes("설정")) {
          Speech.speak("설정화면으로 이동합니다");
          navigation.navigate("SettingMain");
        } else if (cmd.includes("테스트")) {
          testSpeech();
        } else if (cmd.includes("저장")) {
          saveSpeech();
        } else if(cmd.includes("속도") && cmd.includes("증가")){
          Speech.speak("속도 증가");
          setRate(adjustValue(rate, +0.1));
        } else if(cmd.includes("속도")&& cmd.includes("감소")){
          Speech.speak("속도 감소");
          setRate(adjustValue(rate, -0.1));
        } else if(cmd.includes("높낮") && cmd.includes("증가")){
          Speech.speak("높낮이 증가");
          setPitch(adjustValue(pitch, +0.1));
        } else if(cmd.includes("높낮")&& cmd.includes("감소")){
          Speech.speak("높낮이 감소");
          setPitch(adjustValue(pitch, -0.1)); 
        }
      }
    });

  const adjustValue = (value, delta, min = 0.5, max = 2.0) => {
    const result = Math.round((value + delta) * 10) / 10;
    return Math.min(Math.max(result, min), max);
  };

  // 음성 테스트를 위한 함수
  const testSpeech = () => {
    Speech.speak("음성테스트 진행중입니다.", {
      rate,
      pitch,
    });
  };

  useEffect(() => {
    // 음성 정보 불러오는 함수
    LoadSpeechInfo(setRate, setPitch);
  }, []);

  // 음성 정보 저장하는 함수
  const saveSpeech = async() => {
    const deviceId = await SecureStore.getItemAsync('deviceId');
    // 서버로 전송
    const response = await fetch('http://3.37.7.103:5008/setting/speech',{
      method: "POST",
      headers:{
        "Content-Type" : "application/json",
      },
      body: JSON.stringify({
        deviceId: deviceId,
        rate: rate,
        pitch: pitch,
      }),
    });
    if(response.ok){
      Speech.speak("저장완료 rate는 ", rate, " pitch는 ",pitch);
      rateChange(rate);
      pitchChange(pitch);
      onSaveComplete?.(rate, pitch);
    }else{
      Speech.speak("저장 실패");
      console.log(response);
    }
  }

  return (
    <View style={{ flex: 1, flexDirection: "column" }}>
      <View style={styles.header}>
        <View style={styles.row}>
          <View style={styles.iconContainer}>
            <Feather name="volume-2" size={70} color="#FF8C42" />
          </View>
          <View style={styles.textContainer}>
            <Text style={text.header}>음성 설정</Text>
          </View>
        </View>
      </View>

      {/* 말하기 테스트 */}
      <View style={styles.testButtonWrapper}>
        <TouchableOpacity style={styles.testButton} onPress={testSpeech}>
          <Text style={styles.testButtonText}>테스트 하기</Text>
        </TouchableOpacity>
      </View>

      {/* 말하기 속도 */}
      <View style={styles.settingItemRow}>
        <Text style={styles.labelInline}>속도:</Text>
        <TouchableOpacity
          style={styles.adjustButton}
          onPress={() => setRate(adjustValue(rate, -0.1))}
        >
          <Text style={styles.adjustButtonText}>-</Text>
        </TouchableOpacity>

        <Text style={styles.valueText}>{typeof rate === "number" ? rate.toFixed(1) : "1.0"}</Text>
        <TouchableOpacity
          style={styles.adjustButton}
          onPress={() => setRate(adjustValue(rate, +0.1))}
        >
          <Text style={styles.adjustButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* 말하기 높낮이 */}
      <View style={styles.settingItemRow}>
        <Text style={styles.labelInline}>높낮이</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.adjustButton}
            onPress={() => setPitch(adjustValue(pitch, -0.1))}
          >
            <Text style={styles.adjustButtonText}>-</Text>
          </TouchableOpacity>

          <Text style={styles.valueText}>{typeof pitch === "number" ? pitch.toFixed(1) : "1.0"}</Text>

          <TouchableOpacity
            style={styles.adjustButton}
            onPress={() => setPitch(adjustValue(pitch, +0.1))}
          >
            <Text style={styles.adjustButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 음성 설정 정보 저장 버튼 */}
        <View style={styles.testButtonWrapper}>
          <TouchableOpacity style={styles.testButton} onPress={saveSpeech}>
            <Text style={styles.testButtonText}>저장</Text>
          </TouchableOpacity>
        </View>
      </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flex: 3,
    backgroundColor: "#121212",
    paddingHorizontal: 15,
    paddingTop: 30,
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-start",
    paddingLeft: 15,
  },
  textContainer: {
    flex: 3,
    justifyContent: "center",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 20,
  },
  voiceRow: {
    flexDirection: "row",
    gap: 20,
  },
  voiceButton: {
    backgroundColor: "#fff",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#ccc",
    marginHorizontal: 10,
  },
  voiceButtonActive: {
    backgroundColor: "#4FC3F7",
    borderColor: "#4FC3F7",
  },
  voiceText: {
    color: "#000",
    fontSize: 16,
  },
  settingItemRow: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around", // or "flex-start"
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 0.3,
    borderColor: "#aaa",
    backgroundColor: "#121212",
  },
  labelInline: {
    fontSize: 35,
    marginRight: 10,
    color: "#FFFFFF",
  },
  valueText: {
    fontSize: 35,
    marginHorizontal: 10,
    color: "#FFFFFF",
  },
  adjustButton: {
    backgroundColor: "#4FC3F7",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 6,
  },
  adjustButtonText: {
    color: "#fff",
    fontSize: 25,
    fontWeight: "bold",
  },
  testButtonWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
    paddingBottom: 30,
  },

  testButton: {
    backgroundColor: "#4FC3F7",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
  },

  testButtonText: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "bold",
  },
});

export default SpeechSetting;