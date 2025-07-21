import React, { useState } from "react";
import { View, Text, StyleSheet, Button, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Speech from "expo-speech";

const SpeechSetting = () => {
  const [rate, setRate] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);

  const adjustValue = (value, delta, min = 0.5, max = 2.0) => {
    const result = Math.round((value + delta) * 10) / 10;
    return Math.min(Math.max(result, min), max);
  };

  const testSpeech = () => {
    Speech.speak("음성테스트 진행중입니다.", {
      rate,
      pitch,
    });
  };

  return (
    <View style={{ flex: 1, flexDirection: "column" }}>
      <View style={styles.header}>
        <View style={styles.row}>
          <View style={styles.iconContainer}>
            <Feather name="volume-2" size={70} color="#FF8C42" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.headerText}>음성 설정</Text>
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

        <Text style={styles.valueText}>{rate.toFixed(1)}</Text>
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

          <Text style={styles.valueText}>{pitch.toFixed(1)}</Text>

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
        <TouchableOpacity style={styles.testButton} onPress={() => {}}>
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
  headerText: {
    textAlign: "center",
    fontSize: 60,
    color: "#FF8C42",
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