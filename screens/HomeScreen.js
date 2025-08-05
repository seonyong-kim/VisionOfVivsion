import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';  // ← CameraView 로 변경
import { useIsFocused } from '@react-navigation/native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import io from 'socket.io-client';
import * as Speech from 'expo-speech';  // ← 상단에 추가
import { LoadSpeechInfo } from "../utils/speech/LoadSpeechInfo";

const { width: previewWidth, height: previewHeight } = Dimensions.get('window');
const SERVER_URL = 'IP주소';  // 본인 서버 IP:포트

export default function HomeScreen({navigation}) {
  const [rate, setRate] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);
  const [loaded, setLoaded] = useState(false);

  const cameraRef = useRef(null);
  const socketRef = useRef(null);
  const isFocused = useIsFocused();

  const [permission, requestPermission] = useCameraPermissions();
  const [detections, setDetections] = useState([]);
  const [photoSize, setPhotoSize] = useState({ width: 1, height: 1 });
  const [frameReady, setFrameReady] = useState(true);

  // 음성 설정 useEffect 먼저 설정을 위해서
  useEffect(() => {
      const loadTTSInfo = async () => {
        await LoadSpeechInfo(setRate, setPitch);
        setLoaded(true); 
      }
      
      loadTTSInfo();
    }, [navigation]);

  // 2. Socket.IO 초기화 (한 번만)
  useEffect(() => {
    console.log("객체 인식",rate, pitch);
    const sock = io(SERVER_URL, { transports: ['websocket'], reconnection: true });
    socketRef.current = sock;
    sock.on('connect',    () => console.log('✅ Socket connected'));
    sock.on('disconnect', () => console.log('❌ Socket disconnected'));
    sock.on('detection',  data => {
      console.log('🖼️ Received detections', data);
      setDetections(data);

      // ➕ 추가된 부분: 중복 제거된 class_name 리스트 추출
      const uniqueClasses = [...new Set(data.map(item => item.class_name))];

      if (uniqueClasses.length > 0) {
        const message = uniqueClasses.join(', ') + ' 감지됨';
        Speech.speak(message, { language: 'ko-KR', rate: rate, pitch: pitch});
      }
    });
    return () => sock.disconnect();
  }, [loaded]);

  // 2) 자동 프레임 전송 (권한·포커스 확인)
  useEffect(() => {
    if (!permission?.granted || !isFocused) return;

    const interval = setInterval(async () => {
      if (!frameReady) return;
      setFrameReady(false);

      try {
        const photo = await cameraRef.current.takePictureAsync({
          base64: true,
          quality: 0.3,
        });
        // 원본 해상도 저장
        setPhotoSize({ width: photo.width, height: photo.height });

        // 서버에 이미지 + 해상도 전송
        // 1. 사진 촬영 → 서버에 전송
        // 2. 성공 또는 실패하더라도
        // 3. 일정 시간 후에 다음 프레임 촬영 가능하게 설정
        const imgData = 'data:image/jpeg;base64,' + photo.base64;
        socketRef.current.emit('image', {
          image: imgData,
          width: photo.width,
          height: photo.height,
        });
        console.log('📤 Frame sent');
      } catch (e) {
        console.error('🚫 sendFrame error', e);
      } finally {
        setTimeout(() => setFrameReady(true), 1000); // 다음 프레임 준비까지 대기 시간
      }
    }, 1000); // sendFrame 실행 주기

    return () => clearInterval(interval);
  }, [permission, isFocused, frameReady]);

  // 3) 권한 요청 UI
  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text onPress={requestPermission} style={styles.link}>
          카메라 권한 요청
        </Text>
      </View>
    );
  }

  // 4) 렌더링: CameraView + 박스 오버레이
  return (
    <View style={styles.container}>
      {isFocused && <CameraView style={styles.camera} ref={cameraRef} />}
      <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
        {detections.map((item, idx) => {
          // 화면 비율 계산
          const scaleX = previewWidth  / photoSize.width;
          const scaleY = previewHeight / photoSize.height;

          // 스케일링된 좌표
          const x = item.bbox[0] * scaleX;
          const y = item.bbox[1] * scaleY;
          const w = (item.bbox[2] - item.bbox[0]) * scaleX;
          const h = (item.bbox[3] - item.bbox[1]) * scaleY;

          return (
            <React.Fragment key={idx}>
              <Rect
                x={x} y={y}
                width={w} height={h}
                stroke="lime" strokeWidth={2} fill="transparent"
              />
              <SvgText
                x={x + 4} y={y - 6}
                fontSize={14} fontWeight="bold" fill="lime"
              >
                {`${item.class_name} (${item.confidence})`}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  camera:    { flex: 1 },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center' },
  link:      { fontSize: 18, color: 'blue', textDecorationLine: 'underline' },
});