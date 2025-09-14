import * as Speech from "expo-speech";

export const speakText = (text, rate, pitch) => {
  Speech.speak(text, {
    language: "ko",
    rate: rate,
    pitch: pitch,
  });
};
