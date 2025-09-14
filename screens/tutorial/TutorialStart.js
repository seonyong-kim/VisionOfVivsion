import React, { use, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  BackHandler,
  TouchableOpacity,
} from "react-native";
import * as Speech from "expo-speech";
import { backGround } from "../../styles/BackGround";
import { LoadSpeechInfo } from "../../utils/speech/LoadSpeechInfo";

export default function TutorialStart({ navigation }) {
  const [rate, setRate] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);
  const [loaded, setLoaded] = useState(false);

  const guidStartTTS = async () => {
    Speech.speak(
      "안녕하십니까. Vision of Vision 입니다." +
        "Vision of Vision은 명령어를 기반으로 앱을 동작시킬 수 있습니다." +
        "튜토리얼을 시작하겠습니다.",
      {
        rate,
        pitch,
      }
    );

    const delay = 11000 * (rate < 1 ? 1 + (1 - rate) : 1 / (1 + (rate - 1)));

    setTimeout(() => {
      navigation.navigate("TutorialYoloCommand", {
        rate: rate,
        pitch: pitch,
      });
    }, delay);
  };

  const skip = async () => {
    Speech.stop();
    navigation.replace("Root");
  };

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => true
    );

    const loadTTSInfo = async () => {
      await LoadSpeechInfo(setRate, setPitch);
      setLoaded(true);
    };

    loadTTSInfo();

    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    if (loaded) {
      guidStartTTS();
    }
  }, [loaded]);

  return (
    <View
      style={[
        backGround.main,
        { alignItems: "center", justifyContent: "center" },
      ]}
    >
      <Text style={styles.mainText}>VoV</Text>

      <TouchableOpacity style={styles.skipButton} onPress={() => skip()}>
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
  skipButton: {
    backgroundColor: "#4FC3F7",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 6,
  },
  skipText: {
    fontSize: 30,
    color: "#FFFFFF",
    textAlign: "center",
  },
});
