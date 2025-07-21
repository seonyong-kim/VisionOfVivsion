import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { getCurrentPositionAsync } from 'expo-location';
// import { speakText } from '../utils/tts';
import { startSTT } from '../utils/stt';
import * as Speech from 'expo-speech';
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";

export default function NavigationScreen({ navigation }) {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [currentAddress, setCurrentAddress] = useState('');
  const [destination, setDestination] = useState('');

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const location = await getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;
        setCurrentLocation({ latitude, longitude });

        const res = await fetch(
          `https://apis.openapi.sk.com/tmap/geo/reversegeocoding?version=1&lat=${latitude}&lon=${longitude}&coordType=WGS84GEO`,
          {
            headers: {
              appKey: 'PPJvzTZ1zg5PFbPCmajGn77jpjUPP3xF1X5dCzhu',
            },
          }
        );
        const json = await res.json();
        const addr = json.addressInfo.fullAddress;

        setCurrentAddress(addr);
        Speech.speak('목적지를 말씀해 주세요.');
      } catch (e) {
        console.error('📍 위치 또는 주소 변환 실패:', e);
        setCurrentAddress('현재 위치를 불러올 수 없습니다.');
      }
    };

    fetchLocation();
  }, []);

  const handleSTT = () => {
    Speech.speak('목적지를 말씀해 주세요.');
    startSTT((recognizedText) => {
      setDestination(recognizedText);
      navigation.navigate('Route', {
        currentLocation: currentLocation,
        destination: recognizedText,
      });
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <MaterialCommunityIcons name="map-search" size={70} color="#4FC3F7" />
        <Text style={styles.title}>길 찾기</Text>
      </View>

      <Text style={styles.label}>출발지</Text>
      <View style={styles.inputBoxActive}>
        <Text style={styles.inputText}>{currentAddress}</Text>
      </View>

      <Text style={styles.label}>도착지</Text>
      <TouchableOpacity style={styles.inputBox} onPress={handleSTT}>
        <Text style={styles.inputTextGray}>
          {destination ? destination : '음성으로 입력하려면 누르세요'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 24 },
  title: {
    fontSize: 60,
    color: '#4FC3F7',
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
  },
  label: {
    color: '#fff',
    fontSize: 45,
    marginTop: 30,
    marginBottom: 8,
  },
  inputBoxActive: {
    backgroundColor: '#444',
    padding: 14,
    borderRadius: 8,
  },
  inputBox: {
    backgroundColor: '#222',
    padding: 14,
    borderRadius: 8,
  },
  inputText: {
    color: '#fff',
    fontSize: 30,
  },
  inputTextGray: {
    color: '#aaa',
    fontSize: 30,
  },
  row:{
    flexDirection: "row", // 아이콘과 텍스트 가로 배치
    alignItems: "center",
    justifyContent: "center",
  }
});