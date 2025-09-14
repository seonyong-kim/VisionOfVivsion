import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Button,
  StyleSheet,
  Touchable,
  TouchableOpacity,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useIsFocused } from "@react-navigation/native";
import { useAutoSTT } from "../src/services/useAutoSTT";
import * as Speech from "expo-speech";

const OCRScreen = ({ route, navigation }) => {
  const [facing, setFacing] = useState("back");
  const [permission, requestPermission] = useCameraPermissions();
  const isFocused = useIsFocused();
  const [image, setImage] = useState(null);
  const cameraRef = useRef(null);
  const [sttOn, setSttOn] = useState(true);
  const [disabled, SetDisabled] = useState(false);

  useEffect(() => {
    const StartTTS = navigation.addListener("focus", () => {
      Speech.speak("글자 인식", {
        rate: rate,
        pitch: pitch,
      });
    });

    return StartTTS;
  }, [navigation]);

  useAutoSTT({
    endpoint: "서버IP/stt",
    segmentMs: 5000,
    enabled: isFocused,
    onResult: ({ text }) => {
      if (!text) return;
      const cmd = text.trim();

      setSttOn(false);
      Speech.stop();

      if (cmd.includes("객체")) {
        Speech.speak("객체 인식");
        navigation.navigate("Home");
      } else if (cmd.includes("길")) {
        Speech.speak("길 찾기");
        navigation.navigate("Navigation");
      } else if (cmd.includes("설정")) {
        Speech.speak("설정");
        navigation.navigate("Setting");
      } else if (cmd.includes("시작")) {
        takePicture();
      }
    },
  });

  const takePicture = async () => {
    let photo = null;

    if (cameraRef.current) {
      SetDisabled(true);
      photo = await cameraRef.current.takePictureAsync({ base64: false });
      setImage(photo);
      Speech.speak("글자 인식을 진행합니다. 잠시만 기다려 주세요.", {
        language: "ko-KR",
        rate: rate,
        pitch: pitch,
      });
    }

    const formData = new FormData();
    formData.append("image", {
      uri: photo.uri,
      name: "OCR.jpg",
      type: "image/jpeg",
    });

    try {
      const response = await fetch("서버IP/ocr/image", {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.ok) {
        const result = await response.json();
        Speech.speak(
          result.translated_text ||
            "인식된 글자가 없습니다 다시 시도해 주세요.",
          {
            language: "ko-KR",
            rate: rate,
            pitch: pitch,
          }
        );
      } else {
        Speech.speak("오류가 발생." + "글자 인식 실패", {
          language: "ko-KR",
          rate: rate,
          pitch: pitch,
        });
        const errorText = await response.text();
        console.warn("서버 응답 내용:", errorText);
      }
    } catch (error) {
      console.error("OCR 업로드 실패:", error);
    }
    SetDisabled(false);
  };

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>카메라 권한이 필요합니다.</Text>
        <Button onPress={requestPermission} title="권한 허용" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isFocused ? (
        <>
          <CameraView style={styles.camera} facing={facing} ref={cameraRef} />
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.button}
              onPress={takePicture}
              disabled={disabled}
            >
              <Text style={styles.text}>글자 인식</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.camera} />
      )}
    </View>
  );
};
/*
 */
export default OCRScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  message: {
    textAlign: "center",
    paddingBottom: 10,
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  button: {
    backgroundColor: "#1e90ff",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  text: {
    fontSize: 24,
    fontWeight: "bold",
    color: "black",
  },
  OCRresult: {
    position: "absolute",
    fontsize: 24,
  },
});
