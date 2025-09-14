import React, { useEffect, useState } from "react";
import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
} from "react-native";
import {
  getCurrentPositionAsync,
  requestForegroundPermissionsAsync,
} from "expo-location";
import { speakText } from "../../utils/tts";
import { startSTT } from "../../utils/stt";
import { reverseGeocode, geocode } from "../../utils/navigation/tmap";
import { useAutoSTT } from "../../src/services/useAutoSTT";
import * as Speech from "expo-speech";

export default function NavigationScreen({ navigation }) {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [currentAddress, setCurrentAddress] = useState("");
  const [destination, setDestination] = useState("");
  const [destinationInput, setDestinationInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const isFocused = useIsFocused();
  const [sttOn, setSttOn] = useState(true);

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
      } else if (cmd.includes("글자")) {
        Speech.speak("글자 인식");
        navigation.navigate("OCR");
      } else if (cmd.includes("설정")) {
        Speech.speak("설정");
        navigation.navigate("Setting");
      }
    },
  });

  const fetchLocation = async () => {
    try {
      setIsLoading(true);
      const { status } = await requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "위치 권한 필요",
          "길찾기 기능을 사용하려면 위치 권한이 필요합니다.",
          [{ text: "확인" }]
        );
        setCurrentAddress("위치 권한이 필요합니다.");
        setIsLoading(false);
        return;
      }

      const location = await getCurrentPositionAsync({
        accuracy: 5,
        timeInterval: 10000,
        distanceInterval: 10,
      });

      const { latitude, longitude } = location.coords;
      setCurrentLocation({ latitude, longitude });

      try {
        const addr = await reverseGeocode(latitude, longitude);
        setCurrentAddress(addr);
        speakText("목적지를 입력하거나 음성으로 말씀해 주세요.");
      } catch (apiError) {
        console.error("주소 변환 실패:", apiError);
        setCurrentAddress(
          `위치: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
        );
        speakText("목적지를 입력하거나 음성으로 말씀해 주세요.");
      }
    } catch (e) {
      console.error("위치 가져오기 실패:", e);
      setCurrentAddress("현재 위치를 불러올 수 없습니다.");
      speakText("위치를 가져올 수 없습니다. 다시 시도해 주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchLocation();
      setDestination("");
      setDestinationInput("");
    }, [])
  );

  const handleSTT = () => {
    if (!currentLocation) {
      speakText("현재 위치를 먼저 확인해 주세요.");
      return;
    }

    speakText("목적지를 말씀해 주세요.");
    startSTT(
      (recognizedText) => {
        setDestinationInput(recognizedText);
        handleSearchDestination(recognizedText);
      },
      (error) => {
        console.error("STT 오류:", error);
        speakText("음성 인식에 실패했습니다. 다시 시도해 주세요.");
      }
    );
  };

  const handleSearchDestination = async (searchText) => {
    if (!searchText.trim()) {
      Alert.alert("알림", "목적지를 입력해 주세요.");
      return;
    }

    if (!currentLocation) {
      Alert.alert("알림", "현재 위치를 먼저 확인해 주세요.");
      return;
    }

    try {
      setIsSearching(true);
      const result = await geocode(searchText);

      setDestination(result.name || searchText);
      setDestinationInput(searchText);

      navigation.navigate("Route", {
        currentLocation: currentLocation,
        destination: result.name || searchText,
        destinationCoords: {
          latitude: result.latitude,
          longitude: result.longitude,
        },
      });
    } catch (error) {
      console.error("목적지 검색 실패:", error);
      Alert.alert(
        "검색 실패",
        "해당 주소를 찾을 수 없습니다.\n\n예시: 신림역, 강남역, 서울역, 홍대입구역, 명동, 강남대로\n\n다시 시도해 주세요."
      );
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>길 찾기</Text>

      <Text style={styles.label}>출발지</Text>
      <View style={styles.inputBoxActive}>
        <Text style={styles.inputText}>
          {isLoading ? "위치 확인 중..." : currentAddress}
        </Text>
      </View>

      <Text style={styles.label}>도착지</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="목적지를 입력하세요 (예: 신림역, 강남역, 서울역, 홍대입구역)"
          placeholderTextColor="#666"
          value={destinationInput}
          onChangeText={setDestinationInput}
          onSubmitEditing={() => handleSearchDestination(destinationInput)}
        />
        <TouchableOpacity
          style={[
            styles.searchButton,
            isSearching && styles.searchButtonDisabled,
          ]}
          onPress={() => handleSearchDestination(destinationInput)}
          disabled={isSearching || !destinationInput.trim()}
        >
          <Text style={styles.searchButtonText}>
            {isSearching ? "검색 중..." : "검색"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.helpContainer}>
        <Text style={styles.helpText}>
          검색 예시: 신림역, 강남역, 서울역, 홍대입구역, 명동, 강남대로, 코엑스,
          롯데월드
        </Text>
      </View>

      <View style={styles.orContainer}>
        <Text style={styles.orText}>또는</Text>
      </View>

      <TouchableOpacity
        style={[
          styles.voiceButton,
          !currentLocation && styles.voiceButtonDisabled,
        ]}
        onPress={handleSTT}
        disabled={!currentLocation}
      >
        <Text style={styles.voiceButtonText}>음성으로 목적지 입력</Text>
      </TouchableOpacity>

      {destination && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultLabel}>선택된 목적지:</Text>
          <Text style={styles.resultText}>{destination}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", padding: 24 },
  title: {
    fontSize: 28,
    color: "#4FC3F7",
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 20,
  },
  label: {
    color: "#fff",
    fontSize: 18,
    marginTop: 30,
    marginBottom: 8,
  },
  inputBoxActive: {
    backgroundColor: "#444",
    padding: 14,
    borderRadius: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: "#222",
    padding: 14,
    borderRadius: 8,
    color: "#fff",
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: "#4FC3F7",
    padding: 14,
    borderRadius: 8,
    minWidth: 60,
    alignItems: "center",
  },
  searchButtonDisabled: {
    backgroundColor: "#666",
  },
  searchButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  orContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  orText: {
    color: "#666",
    fontSize: 16,
  },
  voiceButton: {
    backgroundColor: "#333",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#4FC3F7",
  },
  voiceButtonDisabled: {
    backgroundColor: "#111",
    borderColor: "#333",
    opacity: 0.5,
  },
  voiceButtonText: {
    color: "#4FC3F7",
    fontSize: 16,
    fontWeight: "bold",
  },
  resultContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: "#222",
    borderRadius: 8,
  },
  resultLabel: {
    color: "#4FC3F7",
    fontSize: 14,
    marginBottom: 4,
  },
  resultText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  helpContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: "#1a1a1a",
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: "#4FC3F7",
  },
  helpText: {
    color: "#aaa",
    fontSize: 12,
    lineHeight: 16,
  },
  inputBox: {
    backgroundColor: "#222",
    padding: 14,
    borderRadius: 8,
  },
  inputBoxDisabled: {
    backgroundColor: "#111",
    opacity: 0.5,
  },
  inputText: {
    color: "#fff",
    fontSize: 16,
  },
  inputTextGray: {
    color: "#aaa",
    fontSize: 16,
  },
});
