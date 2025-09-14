import React from "react";
import * as SecureStore from "expo-secure-store";

export const LoadSpeechInfo = async (setRate, setPitch) => {
  const deviceId = await SecureStore.getItemAsync("deviceId");

  const url = `서버IP/setting/speech?device_id=${encodeURIComponent(deviceId)}`;
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const { rate, pitch } = await response.json();
      setRate(rate);
      setPitch(pitch);
    } else {
      Speech.speak("음성 정보 불러오기 실패");
    }
  } catch (error) {
    Speech.speak("서버에 연결 할 수 없습니다.");
    console.log(error);
  }
};
